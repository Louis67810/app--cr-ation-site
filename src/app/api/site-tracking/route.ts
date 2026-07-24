import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function uuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function string(value: unknown, fallback: string, max = 180) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Tracking indisponible." }, { status: 503 });

  try {
    const input = await request.json() as Record<string, unknown>;
    const publishedSlug = typeof input.publishedSlug === "string" ? input.publishedSlug.trim().slice(0, 180) : "";
    const pagePath = typeof input.pagePath === "string" && input.pagePath.startsWith("/") ? input.pagePath.slice(0, 500) : "";
    const sessionId = uuid(input.sessionId);
    const visitorId = uuid(input.visitorId);
    const referrer = string(input.referrer, "direct");
    const deviceType = ["desktop", "mobile", "tablet"].includes(String(input.deviceType)) ? String(input.deviceType) : "desktop";
    const countryCode = string(request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry"), "Unknown", 24);
    const engagementSeconds = Math.min(21600, Math.max(0, Math.round(Number(input.engagementSeconds) || 0)));
    if (!publishedSlug || !pagePath || !sessionId || !visitorId) return NextResponse.json({ error: "Événement invalide." }, { status: 400 });

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: project, error: projectError } = await admin
      .from("site_projects")
      .select("owner_id, project_key")
      .eq("published_slug", publishedSlug)
      .not("published_at", "is", null)
      .maybeSingle();
    if (projectError || !project) return NextResponse.json({ error: "Site publié introuvable." }, { status: 404 });

    const { error } = await admin.rpc("record_project_page_tracking", {
      tracking_owner_id: project.owner_id,
      tracking_project_key: project.project_key,
      tracking_page_path: pagePath,
      tracking_session_id: sessionId,
      tracking_visitor_id: visitorId,
      tracking_engagement_seconds: engagementSeconds,
    });
    if (error) throw error;
    // Keep the aggregate tracker backwards compatible if this new migration has not yet been applied.
    const { error: dimensionsError } = await admin.rpc("record_project_tracking_event", {
      tracking_owner_id: project.owner_id,
      tracking_project_key: project.project_key,
      tracking_page_path: pagePath,
      tracking_session_id: sessionId,
      tracking_visitor_id: visitorId,
      tracking_referrer: referrer,
      tracking_device_type: deviceType,
      tracking_country_code: countryCode,
    });
    if (dimensionsError && !/record_project_tracking_event|function/i.test(dimensionsError.message)) throw dimensionsError;
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Le suivi n’a pas pu être enregistré." }, { status: 500 });
  }
}
