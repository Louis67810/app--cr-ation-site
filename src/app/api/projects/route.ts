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

  const [{ data: ownedProject }, { data: membership }] = await Promise.all([
    supabase.from("site_projects").select("project_key").eq("owner_id", ownerId).limit(1).maybeSingle(),
    supabase.from("project_members").select("user_id").eq("user_id", ownerId).limit(1).maybeSingle(),
  ]);
  if (membership && !ownedProject) {
    return NextResponse.json({ error: "Les collaborateurs ne peuvent pas créer de projet." }, { status: 403 });
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

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    action?: "rename" | "duplicate";
    ownerId?: string;
    projectKey?: string;
    name?: string;
  };
  const ownerId = payload.ownerId?.trim();
  const projectKey = payload.projectKey?.trim();

  if (!ownerId || !projectKey || ownerId !== userId) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { data: sourceProject, error: sourceError } = await supabase
    .from("site_projects")
    .select("project_name, pages")
    .eq("owner_id", ownerId)
    .eq("project_key", projectKey)
    .maybeSingle();
  const isDemo = projectKey === "default" && !sourceProject;
  if (sourceError || (!sourceProject && !isDemo)) {
    return NextResponse.json(
      { error: sourceError?.message ?? "Projet introuvable." },
      { status: 404 },
    );
  }

  const sourceName = sourceProject?.project_name ?? "Projet paysagiste";
  const sourcePages = Array.isArray(sourceProject?.pages)
    ? sourceProject.pages
    : demoSitePages;
  const now = new Date().toISOString();

  if (payload.action === "rename") {
    const name = payload.name?.trim();
    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Le nom du projet est invalide." },
        { status: 400 },
      );
    }

    const values = {
      owner_id: ownerId,
      project_key: projectKey,
      project_name: name,
      pages: sourcePages,
      updated_at: now,
    };
    const { error } = isDemo
      ? await supabase.from("site_projects").insert({
          ...values,
          created_at: now,
        })
      : await supabase
          .from("site_projects")
          .update({ project_name: name, updated_at: now })
          .eq("owner_id", ownerId)
          .eq("project_key", projectKey);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projectKey, name });
  }

  if (payload.action === "duplicate") {
    const name = `${sourceName} (copie)`.slice(0, 80);
    const duplicatedKey = projectKeyFromName(name);
    const { error } = await supabase.from("site_projects").insert({
      owner_id: userId,
      project_key: duplicatedKey,
      project_name: name,
      pages: structuredClone(sourcePages),
      created_at: now,
      updated_at: now,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { projectKey: duplicatedKey, name },
      { status: 201 },
    );
  }

  return NextResponse.json({ error: "Action invalide." }, { status: 400 });
}
