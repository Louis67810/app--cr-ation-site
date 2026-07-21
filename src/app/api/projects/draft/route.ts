import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SitePage } from "@/lib/site-template";
import { normalizeProjectKey } from "@/lib/project-key";
import {
  getArticleDetail,
  synchronizeArticleCollections,
} from "@/lib/article-content";
import { generateArticleThumbnail } from "@/lib/article-thumbnail";

export const runtime = "nodejs";
export const maxDuration = 300;

function projectBrand(pages: SitePage[]) {
  const header = pages
    .flatMap((page) => page.sections)
    .find((section) => section.type === "site-header");
  return header?.type === "site-header"
    ? {
        logoLabel: header.fields.logoLabel,
        logoImageUrl: header.fields.logoImageUrl,
      }
    : { logoLabel: "", logoImageUrl: undefined };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const ownerId = data?.claims?.sub;

  if (!ownerId) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    projectName?: string;
    projectKey?: string;
    projectOwnerId?: string;
    pages?: SitePage[];
  };

  if (!payload.projectName || !Array.isArray(payload.pages)) {
    return NextResponse.json({ error: "Brouillon invalide." }, { status: 400 });
  }

  const projectKey = normalizeProjectKey(payload.projectKey);
  const projectOwnerId = payload.projectOwnerId ?? ownerId;
  if (projectOwnerId !== ownerId) {
    const { data: membership } = await supabase.from("project_members").select("user_id").eq("owner_id", projectOwnerId).eq("project_key", projectKey).eq("user_id", ownerId).maybeSingle();
    if (!membership) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { data: previousProject } = await supabase.from("site_projects").select("pages").eq("owner_id", projectOwnerId).eq("project_key", projectKey).maybeSingle();
  const previousPages = Array.isArray(previousProject?.pages) ? previousProject.pages as SitePage[] : null;
  let normalizedPages = synchronizeArticleCollections(payload.pages);
  const brand = projectBrand(normalizedPages);
  for (const page of normalizedPages) {
    if (!page.slug.startsWith("/blog/")) continue;
    const detail = getArticleDetail(page);
    if (!detail?.fields.heroImageUrl) continue;
    const previousPage = previousPages?.find(
      (candidate) => candidate.id === page.id || candidate.slug === page.slug,
    );
    const previousDetail = previousPage ? getArticleDetail(previousPage) : null;
    const needsThumbnail =
      !detail.fields.thumbnailImageUrl ||
      previousDetail?.fields.title !== detail.fields.title ||
      previousDetail?.fields.heroImageUrl !== detail.fields.heroImageUrl;
    if (!needsThumbnail) continue;
    try {
      const thumbnail = await generateArticleThumbnail({
        backgroundImageUrl: detail.fields.heroImageUrl,
        articleTitle: detail.fields.title,
        ...brand,
      });
      const storagePath = `${projectOwnerId}/${projectKey}/article-thumbnail-${crypto.randomUUID()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("project-assets")
        .upload(storagePath, thumbnail.bytes, {
          contentType: thumbnail.mediaType,
          upsert: false,
        });
      if (uploadError) continue;
      const { data: publicData } = supabase.storage
        .from("project-assets")
        .getPublicUrl(storagePath);
      const { error: assetError } = await supabase
        .from("project_assets")
        .insert({
          owner_id: projectOwnerId,
          project_key: projectKey,
          storage_path: storagePath,
          public_url: publicData.publicUrl,
          original_name: `miniature-${page.id}.png`,
          title: `Miniature · ${detail.fields.title}`.slice(0, 100),
          alt_text: `Miniature de l'article : ${detail.fields.title}`.slice(
            0,
            240,
          ),
          ai_generated: true,
          created_by: ownerId,
        });
      if (assetError) {
        await supabase.storage.from("project-assets").remove([storagePath]);
        continue;
      }
      detail.fields.thumbnailImageUrl = publicData.publicUrl;
    } catch {
      // A thumbnail failure must never prevent the CMS draft from being saved.
    }
  }
  normalizedPages = synchronizeArticleCollections(normalizedPages);
  const previousSlugs = new Set(previousPages?.map((page) => page.slug) ?? []);
  const createdPages = previousPages ? normalizedPages.filter((page) => !previousSlugs.has(page.slug)) : [];

  const values = { project_name: payload.projectName, pages: normalizedPages, updated_at: new Date().toISOString() };
  const { error } = projectOwnerId === ownerId
    ? await supabase.from("site_projects").upsert({ owner_id: ownerId, project_key: projectKey, ...values }, { onConflict: "owner_id,project_key" })
    : await supabase.from("site_projects").update(values).eq("owner_id", projectOwnerId).eq("project_key", projectKey);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (createdPages.length) {
    await supabase.from("project_activity_events").insert(createdPages.map((page) => ({ owner_id: projectOwnerId, project_key: projectKey, actor_user_id: ownerId, event_type: page.slug.startsWith("/blog/") ? "article_created" : page.slug.startsWith("/realisations/") ? "realisation_created" : "page_created", entity_id: page.id, entity_title: page.title, metadata: { slug: page.slug } })));
  }

  return NextResponse.json({ saved: true, pages: normalizedPages });
}
