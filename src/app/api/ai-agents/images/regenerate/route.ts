import { NextResponse } from "next/server";
import { generateArticleImage } from "@/lib/article-image-generation";
import { generateArticleThumbnail } from "@/lib/article-thumbnail";
import {
  getArticleDetail,
  synchronizeArticleCollections,
} from "@/lib/article-content";
import { normalizeProjectKey } from "@/lib/project-key";
import { createClient } from "@/lib/supabase/server";
import type { SitePage } from "@/lib/site-template";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId)
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const payload = (await request.json()) as {
    projectKey?: unknown;
    projectOwnerId?: unknown;
    pageId?: unknown;
    imageId?: unknown;
  };
  const projectKey = normalizeProjectKey(payload.projectKey);
  const projectOwnerId =
    typeof payload.projectOwnerId === "string"
      ? payload.projectOwnerId
      : userId;
  if (
    typeof payload.pageId !== "string" ||
    typeof payload.imageId !== "string"
  ) {
    return NextResponse.json(
      { error: "Page ou image invalide." },
      { status: 400 },
    );
  }
  if (projectOwnerId !== userId) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("owner_id", projectOwnerId)
      .eq("project_key", projectKey)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership)
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { data: projectRow, error: projectError } = await supabase
    .from("site_projects")
    .select("project_name, pages")
    .eq("owner_id", projectOwnerId)
    .eq("project_key", projectKey)
    .maybeSingle();
  if (projectError || !projectRow)
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

  const pages = structuredClone(projectRow.pages as SitePage[]);
  const page = pages.find((candidate) => candidate.id === payload.pageId);
  const imageRequest = page?.editorial?.outline?.imageRequests.find(
    (candidate) => candidate.id === payload.imageId,
  );
  if (!page || !imageRequest)
    return NextResponse.json(
      { error: "Cette image ne possède pas d’instruction IA régénérable." },
      { status: 404 },
    );

  const visual = await generateArticleImage(imageRequest, {
    articleTitle: page.editorial?.outline?.title ?? page.title,
    projectName: projectRow.project_name ?? "Projet paysagiste",
  });
  if (!visual)
    return NextResponse.json(
      {
        error:
          "La génération a échoué. Vérifie OPENROUTER_API_KEY et OPENROUTER_IMAGE_MODEL.",
      },
      { status: 502 },
    );

  const extension = visual.mediaType.includes("png")
    ? "png"
    : visual.mediaType.includes("jpeg")
      ? "jpg"
      : "webp";
  const storagePath = `${projectOwnerId}/${projectKey}/ai-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(storagePath, visual.bytes, {
      contentType: visual.mediaType,
      upsert: false,
    });
  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: publicData } = supabase.storage
    .from("project-assets")
    .getPublicUrl(storagePath);
  const publicUrl = publicData.publicUrl;
  const detail = getArticleDetail(page);
  if (!detail)
    return NextResponse.json(
      { error: "Contenu d’article introuvable." },
      { status: 404 },
    );
  if (imageRequest.kind === "hero") {
    detail.fields.heroImageUrl = publicUrl;
    detail.fields.heroImageAlt = imageRequest.alt;
    try {
      const header = pages
        .flatMap((candidate) => candidate.sections)
        .find((section) => section.type === "site-header");
      const logoLabel =
        header?.type === "site-header" ? header.fields.logoLabel : "";
      const logoImageUrl =
        header?.type === "site-header"
          ? header.fields.logoImageUrl
          : undefined;
      const thumbnail = await generateArticleThumbnail({
        backgroundImageUrl: publicUrl,
        articleTitle: detail.fields.title,
        logoLabel,
        logoImageUrl,
      });
      const thumbnailPath = `${projectOwnerId}/${projectKey}/article-thumbnail-${crypto.randomUUID()}.png`;
      const { error: thumbnailUploadError } = await supabase.storage
        .from("project-assets")
        .upload(thumbnailPath, thumbnail.bytes, {
          contentType: thumbnail.mediaType,
          upsert: false,
        });
      if (!thumbnailUploadError) {
        const { data: thumbnailPublicData } = supabase.storage
          .from("project-assets")
          .getPublicUrl(thumbnailPath);
        const { error: thumbnailAssetError } = await supabase
          .from("project_assets")
          .insert({
            owner_id: projectOwnerId,
            project_key: projectKey,
            storage_path: thumbnailPath,
            public_url: thumbnailPublicData.publicUrl,
            original_name: `miniature-${page.id}.png`,
            title: `Miniature · ${detail.fields.title}`.slice(0, 100),
            alt_text: `Miniature de l'article : ${detail.fields.title}`.slice(
              0,
              240,
            ),
            ai_generated: true,
            created_by: userId,
          });
        if (thumbnailAssetError) {
          await supabase.storage
            .from("project-assets")
            .remove([thumbnailPath]);
        } else {
          detail.fields.thumbnailImageUrl = thumbnailPublicData.publicUrl;
        }
      }
    } catch {
      detail.fields.thumbnailImageUrl = publicUrl;
    }
  } else {
    const block = detail.fields.blocks.find(
      (candidate) =>
        candidate.kind === "image" && candidate.id === imageRequest.id,
    );
    if (block?.kind === "image") block.imageUrl = publicUrl;
  }
  page.editorial = {
    ...page.editorial!,
    images: (page.editorial?.images ?? []).map((image) =>
      image.id === imageRequest.id
        ? { ...imageRequest, url: publicUrl, generated: true }
        : image,
    ),
    updatedAt: new Date().toISOString(),
  };
  const nextPages = synchronizeArticleCollections(pages);

  const { error: assetError } = await supabase.from("project_assets").insert({
    owner_id: projectOwnerId,
    project_key: projectKey,
    storage_path: storagePath,
    public_url: publicUrl,
    original_name: `${imageRequest.id}.${extension}`,
    title: imageRequest.purpose.slice(0, 70),
    alt_text: imageRequest.alt.slice(0, 240),
    ai_generated: true,
    created_by: userId,
  });
  if (assetError) {
    await supabase.storage.from("project-assets").remove([storagePath]);
    return NextResponse.json({ error: assetError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("site_projects")
    .update({ pages: nextPages, updated_at: new Date().toISOString() })
    .eq("owner_id", projectOwnerId)
    .eq("project_key", projectKey);
  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    page: nextPages.find((candidate) => candidate.id === page.id),
    imageUrl: publicUrl,
  });
}
