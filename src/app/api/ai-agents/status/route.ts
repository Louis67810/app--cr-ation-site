import { NextResponse } from "next/server";
import { demoSitePages } from "@/lib/demo-site";
import { normalizeProjectKey } from "@/lib/project-key";
import { createClient } from "@/lib/supabase/server";
import type { EditorialPageStatus, SitePage } from "@/lib/site-template";

function isEditorialStatus(value: unknown): value is EditorialPageStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const payload = (await request.json()) as { projectKey?: unknown; projectOwnerId?: unknown; pageId?: unknown; status?: unknown };
  if (typeof payload.pageId !== "string" || !isEditorialStatus(payload.status)) {
    return NextResponse.json({ error: "Page ou statut invalide." }, { status: 400 });
  }

  const projectKey = normalizeProjectKey(payload.projectKey);
  const projectOwnerId = typeof payload.projectOwnerId === "string" ? payload.projectOwnerId : userId;
  if (projectOwnerId !== userId) {
    const { data: membership } = await supabase.from("project_members").select("user_id").eq("owner_id", projectOwnerId).eq("project_key", projectKey).eq("user_id", userId).maybeSingle();
    if (!membership) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { data: project } = await supabase.from("site_projects").select("project_name, pages").eq("owner_id", projectOwnerId).eq("project_key", projectKey).maybeSingle();
  const pages = Array.isArray(project?.pages)
    ? structuredClone(project.pages) as SitePage[]
    : structuredClone(demoSitePages);
  const page = pages.find((candidate) => candidate.id === payload.pageId);
  if (!page || !page.slug.startsWith("/blog/")) return NextResponse.json({ error: "Article introuvable." }, { status: 404 });

  const now = new Date().toISOString();
  page.editorial = {
    status: payload.status,
    mode: page.editorial?.mode ?? "editorial",
    category: page.editorial?.category ?? "Conseils",
    createdAt: page.editorial?.createdAt ?? now,
    updatedAt: now,
    research: page.editorial?.research,
    outline: page.editorial?.outline,
    article: page.editorial?.article,
    quiz: page.editorial?.quiz,
    quizPlacementAfterHeading: page.editorial?.quizPlacementAfterHeading,
  };

  const values = {
    project_name: project?.project_name ?? "Projet paysagiste",
    pages,
    updated_at: now,
  };
  const { error } = projectOwnerId === userId
    ? await supabase.from("site_projects").upsert(
        { owner_id: userId, project_key: projectKey, ...values },
        { onConflict: "owner_id,project_key" },
      )
    : await supabase.from("site_projects").update(values).eq("owner_id", projectOwnerId).eq("project_key", projectKey);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pageId: page.id, status: payload.status, updatedAt: now });
}
