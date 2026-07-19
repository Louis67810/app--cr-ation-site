import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizeProjectKey } from "@/lib/project-key";

export const runtime = "nodejs";

type IncomingPage = {
  path?: unknown;
  url?: unknown;
  title?: unknown;
  firstSeenAt?: unknown;
  periodStart?: unknown;
  periodEnd?: unknown;
  googleAnalytics?: Record<string, unknown>;
  agenceflow?: Record<string, unknown>;
  searchConsole?: Record<string, unknown>;
  customSignals?: Record<string, unknown>;
};

function finite(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function date(value: unknown, fallback: string) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : fallback;
}

function pagePath(page: IncomingPage) {
  if (typeof page.path === "string" && page.path.startsWith("/")) return page.path;
  if (typeof page.url === "string") {
    try { return new URL(page.url).pathname; } catch { return ""; }
  }
  return "";
}

export async function POST(request: Request) {
  const configuredSecret = process.env.ANALYTICS_INGEST_SECRET;
  const providedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configuredSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Clé d'import Analytics invalide." }, { status: 401 });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: "Configuration Supabase serveur manquante." }, { status: 500 });

  const payload = await request.json() as { ownerId?: unknown; projectKey?: unknown; periodStart?: unknown; periodEnd?: unknown; pages?: unknown };
  if (typeof payload.ownerId !== "string" || !Array.isArray(payload.pages)) {
    return NextResponse.json({ error: "ownerId ou pages manquant." }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const periodStart = date(payload.periodStart, new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10));
  const periodEnd = date(payload.periodEnd, today);
  const projectKey = normalizeProjectKey(payload.projectKey);
  const rows = (payload.pages as IncomingPage[]).map((page) => {
    const ga = page.googleAnalytics ?? {};
    const af = page.agenceflow ?? {};
    const gsc = page.searchConsole ?? {};
    const path = pagePath(page);
    return {
      owner_id: payload.ownerId,
      project_key: projectKey,
      page_path: path,
      page_title: typeof page.title === "string" ? page.title : path,
      first_seen_at: typeof page.firstSeenAt === "string" ? page.firstSeenAt : null,
      period_start: date(page.periodStart, periodStart),
      period_end: date(page.periodEnd, periodEnd),
      ga_sessions: finite(ga.sessions), ga_engagement_seconds: finite(ga.engagementSeconds), ga_page_views: finite(ga.pageViews), ga_total_users: finite(ga.totalUsers), ga_sessions_per_user: finite(ga.sessionsPerUser), ga_active_28_day_users: finite(ga.active28DayUsers),
      af_views_last_week: finite(af.viewsLastWeek), af_visitors_last_week: finite(af.visitorsLastWeek), af_sessions_last_week: finite(af.sessionsLastWeek), af_clicks_last_week: finite(af.clicksLastWeek), af_form_submits_last_week: finite(af.formSubmitsLastWeek), af_avg_duration_seconds: finite(af.avgDurationSeconds ?? finite(af.avgDurationMs) / 1000), af_max_scroll_depth: finite(af.maxScrollDepth), af_last_seen_at: typeof af.lastSeenAt === "string" ? af.lastSeenAt : null, af_daily_stats: Array.isArray(af.dailyStats) ? af.dailyStats : [],
      gsc_clicks: finite(gsc.clicks), gsc_impressions: finite(gsc.impressions), gsc_ctr: finite(gsc.ctr), gsc_position: finite(gsc.position), custom_signals: page.customSignals ?? {}, updated_at: new Date().toISOString(),
    };
  }).filter((row) => row.page_path);
  if (!rows.length) return NextResponse.json({ error: "Aucune page valide à importer." }, { status: 400 });

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.from("project_page_performance").upsert(rows, { onConflict: "owner_id,project_key,page_path" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imported: rows.length, projectKey, periodStart, periodEnd });
}
