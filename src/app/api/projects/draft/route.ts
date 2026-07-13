import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SitePage } from "@/lib/site-template";
import { normalizeProjectKey } from "@/lib/project-key";

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

  const values = { project_name: payload.projectName, pages: payload.pages, updated_at: new Date().toISOString() };
  const { error } = projectOwnerId === ownerId
    ? await supabase.from("site_projects").upsert({ owner_id: ownerId, project_key: projectKey, ...values }, { onConflict: "owner_id,project_key" })
    : await supabase.from("site_projects").update(values).eq("owner_id", projectOwnerId).eq("project_key", projectKey);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
