import { NextResponse } from "next/server";
import type { SitePage } from "@/lib/site-template";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const ownerId = data?.claims?.sub;

  if (!ownerId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    projectKey?: string;
    projectName?: string;
    pages?: SitePage[];
    email?: string;
  };
  const email = payload.email?.trim().toLowerCase();

  if (!payload.projectKey || !payload.projectName?.trim() || !Array.isArray(payload.pages) || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Invitation invalide." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: projectError } = await supabase.from("site_projects").upsert({
    owner_id: ownerId,
    project_key: payload.projectKey,
    project_name: payload.projectName.trim(),
    pages: payload.pages,
    updated_at: now,
  }, { onConflict: "owner_id,project_key" });

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  const token = crypto.randomUUID();
  const { data: invitation, error } = await supabase.from("project_invitations").insert({
    owner_id: ownerId,
    project_key: payload.projectKey,
    email,
    token,
  }).select("id, email, token, status, accepted_user_id, created_at, accepted_at").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    invitation,
    link: `${new URL(request.url).origin}/invite/${token}`,
  }, { status: 201 });
}
