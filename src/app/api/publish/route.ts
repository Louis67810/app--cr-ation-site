import { NextResponse } from "next/server";
import { slugifyProjectName } from "@/lib/local-publications";
import { createClient } from "@/lib/supabase/server";
import type { SitePage } from "@/lib/site-template";
import { normalizeProjectKey } from "@/lib/project-key";
import { synchronizeArticleCollections } from "@/lib/article-content";

export async function POST(request: Request) {
  try {
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

    if (
      typeof payload.projectName !== "string" ||
      payload.projectName.trim().length === 0 ||
      !Array.isArray(payload.pages) ||
      payload.pages.length === 0
    ) {
      return NextResponse.json(
        { error: "Le projet ne contient aucune page publiable." },
        { status: 400 },
      );
    }

    const publishedAt = new Date().toISOString();
    const projectKey = normalizeProjectKey(payload.projectKey);
    const projectOwnerId = payload.projectOwnerId ?? ownerId;
    if (projectOwnerId !== ownerId) {
      const { data: membership } = await supabase.from("project_members").select("user_id").eq("owner_id", projectOwnerId).eq("project_key", projectKey).eq("user_id", ownerId).maybeSingle();
      if (!membership) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    const publishedSlug = `${slugifyProjectName(payload.projectName)}-${projectOwnerId.slice(0, 8)}${projectKey === "default" ? "" : `-${projectKey}`}`;
    const normalizedPages = synchronizeArticleCollections(payload.pages);
    const values = { project_name: payload.projectName.trim(), pages: normalizedPages, published_slug: publishedSlug, published_at: publishedAt, updated_at: publishedAt };
    const { error } = projectOwnerId === ownerId
      ? await supabase.from("site_projects").upsert({ owner_id: ownerId, project_key: projectKey, ...values }, { onConflict: "owner_id,project_key" })
      : await supabase.from("site_projects").update(values).eq("owner_id", projectOwnerId).eq("project_key", projectKey);

    if (error) throw error;

    await supabase.from("project_activity_events").insert({ owner_id: projectOwnerId, project_key: projectKey, actor_user_id: ownerId, event_type: "project_published", entity_id: publishedSlug, entity_title: payload.projectName.trim(), metadata: { published_slug: publishedSlug } });

    return NextResponse.json({
      url: `/published/${publishedSlug}`,
      publishedAt,
      pages: normalizedPages,
    });
  } catch {
    return NextResponse.json(
      { error: "La publication locale a echoue." },
      { status: 500 },
    );
  }
}
