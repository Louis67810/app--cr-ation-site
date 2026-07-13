import { NextResponse } from "next/server";
import { demoSitePages } from "@/lib/demo-site";
import { createClient } from "@/lib/supabase/server";

function projectKeyFromName(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "projet";

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const ownerId = data?.claims?.sub;

  if (!ownerId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const payload = (await request.json()) as { name?: string };
  const name = payload.name?.trim();

  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Le nom du projet est invalide." }, { status: 400 });
  }

  const projectKey = projectKeyFromName(name);
  const now = new Date().toISOString();
  const { error } = await supabase.from("site_projects").insert({
    owner_id: ownerId,
    project_key: projectKey,
    project_name: name,
    pages: demoSitePages,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projectKey, name }, { status: 201 });
}

