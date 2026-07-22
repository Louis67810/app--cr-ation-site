import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function uuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Suivi indisponible." }, { status: 503 });

  try {
    const input = await request.json() as Record<string, unknown>;
    const publishedSlug = typeof input.publishedSlug === "string" ? input.publishedSlug.trim().slice(0, 180) : "";
    const pagePath = typeof input.pagePath === "string" && input.pagePath.startsWith("/") ? input.pagePath.slice(0, 500) : "/";
    const visitorId = uuid(input.visitorId);
    const sessionId = uuid(input.sessionId);
    if (!publishedSlug || !visitorId || !sessionId) return NextResponse.json({ error: "Événement invalide." }, { status: 400 });

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: project, error: projectError } = await admin.from("site_projects").select("owner_id, project_key").eq("published_slug", publishedSlug).not("published_at", "is", null).maybeSingle();
    if (projectError || !project) return NextResponse.json({ error: "Site publié introuvable." }, { status: 404 });

    const { error } = await admin.from("project_contact_events").upsert({
      owner_id: project.owner_id,
      project_key: project.project_key,
      visitor_id: visitorId,
      session_id: sessionId,
      page_path: pagePath,
      source: "contact_form",
    }, { onConflict: "owner_id,project_key,session_id", ignoreDuplicates: true });
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "La prise de contact n’a pas pu être enregistrée." }, { status: 500 });
  }
}
