import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { demoSitePages } from "@/lib/demo-site";
import { buildEditorialPerformanceSnapshot } from "@/lib/editorial-performance";
import { fetchGoogleSitePerformance } from "@/lib/google-site-analytics";
import { normalizeProjectKey } from "@/lib/project-key";
import { createClient } from "@/lib/supabase/server";
import type { SitePage } from "@/lib/site-template";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function context(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };

  const url = new URL(request.url);
  let payload: { projectKey?: unknown; projectOwnerId?: unknown } = {};
  if (request.method === "POST") payload = await request.json() as typeof payload;
  const projectKey = normalizeProjectKey(request.method === "POST" ? payload.projectKey : url.searchParams.get("projectKey"));
  const projectOwnerId = request.method === "POST"
    ? (typeof payload.projectOwnerId === "string" ? payload.projectOwnerId : userId)
    : (url.searchParams.get("projectOwnerId") || userId);

  if (projectOwnerId !== userId) {
    const { data: membership } = await supabase.from("project_members").select("user_id").eq("owner_id", projectOwnerId).eq("project_key", projectKey).eq("user_id", userId).maybeSingle();
    if (!membership) return { error: NextResponse.json({ error: "Accès refusé." }, { status: 403 }) };
  }

  const { data: project } = await supabase.from("site_projects").select("pages").eq("owner_id", projectOwnerId).eq("project_key", projectKey).maybeSingle();
  const pages = Array.isArray(project?.pages) ? project.pages as SitePage[] : structuredClone(demoSitePages);
  return { supabase, projectKey, projectOwnerId, pages };
}

type TrackingEvent = {
  page_path: string;
  session_id: string;
  visitor_id: string;
  referrer: string;
  device_type: "desktop" | "mobile" | "tablet";
  country_code: string;
  occurred_at: string;
  last_seen_at: string;
  engagement_seconds?: number;
};

function buildInternalAnalytics(events: TrackingEvent[]) {
  const now = Date.now();
  const days = Array.from({ length: 31 }, (_, index) => {
    const value = new Date(now - (30 - index) * 86_400_000);
    return value.toISOString().slice(0, 10);
  });
  const liveVisitorIds = new Set(events
    .filter((event) => new Date(event.last_seen_at).getTime() >= now - 120_000)
    .map((event) => event.visitor_id));
  return {
    liveVisitors: liveVisitorIds.size,
    events,
    series: days.map((day) => {
      const daily = events.filter((event) => event.occurred_at.slice(0, 10) === day);
      return {
        day,
        pageViews: daily.length,
        uniqueVisitors: new Set(daily.map((event) => event.visitor_id)).size,
      };
    }),
  };
}

async function snapshotData(input: Exclude<Awaited<ReturnType<typeof context>>, { error: NextResponse }>) {
  const after = new Date(Date.now() - 30 * 86_400_000).toISOString();
  if ("error" in input) return input.error;
  const [performanceResult, summaryResult, trackingResult, eventsResult, sessionsResult] = await Promise.all([
    input.supabase.from("project_page_performance").select("*").eq("owner_id", input.projectOwnerId).eq("project_key", input.projectKey).order("ga_page_views", { ascending: false }),
    input.supabase.from("project_analytics_summary").select("*").eq("owner_id", input.projectOwnerId).eq("project_key", input.projectKey).maybeSingle(),
    input.supabase.from("project_page_traffic_daily").select("page_path, day, page_views, unique_visitors, total_engagement_seconds, updated_at").eq("owner_id", input.projectOwnerId).eq("project_key", input.projectKey),
    input.supabase.from("project_tracking_events").select("page_path, session_id, visitor_id, referrer, device_type, country_code, occurred_at, last_seen_at").eq("owner_id", input.projectOwnerId).eq("project_key", input.projectKey).gte("occurred_at", after).order("occurred_at", { ascending: true }),
    input.supabase.from("project_page_tracking_sessions").select("page_path, session_id, engagement_seconds").eq("owner_id", input.projectOwnerId).eq("project_key", input.projectKey).gte("created_at", after),
  ]);
  const base = buildEditorialPerformanceSnapshot({
    pages: input.pages,
    performanceRows: performanceResult.data,
    trackingRows: trackingResult.data,
    summaryRow: summaryResult.data,
    performanceError: performanceResult.error?.message ?? summaryResult.error?.message,
    trackingError: trackingResult.error?.message,
  });
  const engagementBySession = new Map((sessionsResult.data ?? []).map((session) => [
    `${session.page_path}:${session.session_id}`,
    Number(session.engagement_seconds ?? 0),
  ]));
  const events = ((eventsResult.data ?? []) as TrackingEvent[]).map((event) => ({
    ...event,
    engagement_seconds: engagementBySession.get(`${event.page_path}:${event.session_id}`) ?? 0,
  }));
  return {
    ...base,
    internalAnalytics: buildInternalAnalytics(events),
  };
}

async function snapshot(input: Awaited<ReturnType<typeof context>>) {
  if ("error" in input) return input.error;
  return NextResponse.json(await snapshotData(input));
}

export async function GET(request: Request) {
  return snapshot(await context(request));
}

export async function POST(request: Request) {
  const input = await context(request);
  if ("error" in input) return input.error;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY est requise côté serveur pour enregistrer la synchronisation." }, { status: 500 });
  }

  try {
    const { data: connection, error: connectionError } = await input.supabase
      .from("project_analytics_connections")
      .select("ga_property_id, gsc_site_url")
      .eq("owner_id", input.projectOwnerId)
      .eq("project_key", input.projectKey)
      .maybeSingle();
    if (connectionError) throw connectionError;
    if (!connection?.ga_property_id) {
      return NextResponse.json({ error: "Renseigne l’identifiant de propriété GA4 dans les paramètres de ce projet." }, { status: 400 });
    }
    const google = await fetchGoogleSitePerformance({
      propertyId: connection.ga_property_id,
      siteUrl: connection.gsc_site_url || undefined,
      days: 90,
    });
    const admin = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const projectPages = new Map(input.pages.map((page) => [page.slug, page]));
    const now = new Date().toISOString();
    const rows = google.pages.map((page) => {
      const projectPage = projectPages.get(page.pagePath);
      const editorial = projectPage?.editorial;
      return {
        owner_id: input.projectOwnerId,
        project_key: input.projectKey,
        page_path: page.pagePath,
        page_title: projectPage?.title ?? page.pageTitle,
        first_seen_at: editorial?.createdAt ?? null,
        period_start: google.periodStart,
        period_end: google.periodEnd,
        ga_sessions: page.gaSessions,
        ga_engagement_seconds: page.gaEngagementSeconds,
        ga_page_views: page.gaPageViews,
        ga_total_users: page.gaTotalUsers,
        ga_sessions_per_user: page.gaSessionsPerUser,
        ga_average_session_duration: page.gaAverageSessionDuration,
        ga_engagement_rate: page.gaEngagementRate,
        ga_scrolled_users: page.gaScrolledUsers,
        gsc_clicks: page.gscClicks,
        gsc_impressions: page.gscImpressions,
        gsc_ctr: page.gscCtr,
        gsc_position: page.gscPosition,
        updated_at: now,
      };
    });
    const { error: cleanupError } = await admin.from("project_page_performance").delete().eq("owner_id", input.projectOwnerId).eq("project_key", input.projectKey);
    if (cleanupError) throw cleanupError;
    if (rows.length) {
      const { error } = await admin.from("project_page_performance").upsert(rows, { onConflict: "owner_id,project_key,page_path" });
      if (error) throw error;
    }
    const totals = google.totals;
    const { error: summaryError } = await admin.from("project_analytics_summary").upsert({
      owner_id: input.projectOwnerId,
      project_key: input.projectKey,
      period_start: google.periodStart,
      period_end: google.periodEnd,
      ga_sessions: totals.gaSessions,
      ga_engagement_seconds: totals.gaEngagementSeconds,
      ga_page_views: totals.gaPageViews,
      ga_total_users: totals.gaTotalUsers,
      ga_average_session_duration: totals.gaAverageSessionDuration,
      ga_engagement_rate: totals.gaEngagementRate,
      ga_scrolled_users: totals.gaScrolledUsers,
      gsc_clicks: totals.gscClicks,
      gsc_impressions: totals.gscImpressions,
      gsc_ctr: totals.gscCtr,
      gsc_position: totals.gscPosition,
      updated_at: now,
    }, { onConflict: "owner_id,project_key" });
    if (summaryError) throw summaryError;

    return await snapshot(input);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "La synchronisation Google a échoué." }, { status: 502 });
  }
}
