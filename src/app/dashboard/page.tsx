import { redirect } from "next/navigation";
import { DashboardShell, type DashboardAsset, type DashboardInvitation, type DashboardProject, type DashboardTab, type MonthlyRecapData, type ProjectAnalyticsConnection } from "@/components/dashboard/dashboard-shell";
import { demoSitePages } from "@/lib/demo-site";
import { buildEditorialPerformanceSnapshot } from "@/lib/editorial-performance";
import { normalizeProjectKey } from "@/lib/project-key";
import type { SitePage } from "@/lib/site-template";
import { createClient } from "@/lib/supabase/server";
import { visibleProjectImageAssets } from "@/lib/asset-visibility";
import { synchronizeCmsRelations } from "@/lib/cms-relations";

export const dynamic = "force-dynamic";

type ProjectRow = {
  owner_id: string;
  project_key: string;
  project_name: string;
  pages: unknown;
  published_slug: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function dashboardProject(project: ProjectRow, role: DashboardProject["role"]): DashboardProject {
  return {
    key: project.project_key,
    ownerId: project.owner_id,
    role,
    name: project.project_name,
    pages: Array.isArray(project.pages) ? project.pages as SitePage[] : [],
    publishedSlug: project.published_slug,
    publishedAt: project.published_at,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ project?: string; tab?: string }> }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) redirect("/login");

  // Keep project switching light: the full page document is fetched only for the selected project.
  const projectSelection = "owner_id, project_key, project_name, published_slug, published_at, created_at, updated_at";
  const [{ data: ownedRows }, { data: memberships }] = await Promise.all([
    supabase.from("site_projects").select(projectSelection).eq("owner_id", userId).order("updated_at", { ascending: false }),
    supabase.from("project_members").select("owner_id, project_key").eq("user_id", userId),
  ]);

  const sharedRows = await Promise.all((memberships ?? []).map(async (membership) => {
    const { data } = await supabase.from("site_projects").select(projectSelection).eq("owner_id", membership.owner_id).eq("project_key", membership.project_key).maybeSingle();
    return data as ProjectRow | null;
  }));

  const projects: DashboardProject[] = [
    ...((ownedRows ?? []) as ProjectRow[]).map((project) => dashboardProject(project, "admin")),
    ...sharedRows.filter((project): project is ProjectRow => Boolean(project)).map((project) => dashboardProject(project, "collaborator")),
  ];

  const hasOwnedProjects = (ownedRows ?? []).length > 0;
  if ((hasOwnedProjects || (memberships ?? []).length === 0) && !projects.some((project) => project.key === "default" && project.ownerId === userId)) {
    projects.push({ key: "default", ownerId: userId, role: "admin", name: "Projet paysagiste", pages: demoSitePages, publishedSlug: null, publishedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDemo: true });
  }

  if (projects.length === 0) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const requestedKey = normalizeProjectKey(resolvedSearchParams.project);
  const selected = projects.find((project) => project.key === requestedKey) ?? projects[0];
  const allowedTabs: DashboardTab[] = ["overview", "traffic", "pages", "cms", "assets", "ai", "recap", "settings"];
  const requestedTab = allowedTabs.includes(resolvedSearchParams.tab as DashboardTab) ? resolvedSearchParams.tab as DashboardTab : "overview";
  const activeTab = (requestedTab === "settings" || requestedTab === "recap") && selected.role !== "admin" ? "overview" : requestedTab;

  if (!selected.isDemo) {
    const { data: selectedContent } = await supabase
      .from("site_projects")
      .select("pages")
      .eq("owner_id", selected.ownerId)
      .eq("project_key", selected.key)
      .maybeSingle();
    selected.pages = Array.isArray(selectedContent?.pages) ? selectedContent.pages as SitePage[] : [];
  }

  let invitations: DashboardInvitation[] = [];
  if (selected.role === "admin" && activeTab === "settings") {
    const { data } = await supabase.from("project_invitations").select("id, email, token, status, accepted_user_id, created_at, accepted_at").eq("owner_id", userId).eq("project_key", selected.key).order("created_at", { ascending: false });
    invitations = (data ?? []) as DashboardInvitation[];
  }

  const needsAssets = activeTab === "assets" || activeTab === "cms" || activeTab === "pages" || activeTab === "ai";
  let assets: DashboardAsset[] = [];
  if (needsAssets) {
    const { data: assetRows } = await supabase.from("project_assets").select("id, public_url, original_name, title, alt_text, ai_generated, created_at").eq("owner_id", selected.ownerId).eq("project_key", selected.key).order("created_at", { ascending: false });
    assets = visibleProjectImageAssets((assetRows ?? []) as DashboardAsset[]);
    selected.pages = synchronizeCmsRelations(selected.pages, assets);
  }

  const needsAnalytics = activeTab === "ai" || activeTab === "recap";
  let analytics = buildEditorialPerformanceSnapshot({ pages: selected.pages });
  if (needsAnalytics) {
    const [performanceResult, analyticsSummaryResult, internalTrackingResult] = await Promise.all([
      supabase.from("project_page_performance").select("*").eq("owner_id", selected.ownerId).eq("project_key", selected.key).order("ga_page_views", { ascending: false }),
      supabase.from("project_analytics_summary").select("*").eq("owner_id", selected.ownerId).eq("project_key", selected.key).maybeSingle(),
      supabase.from("project_page_traffic_daily").select("page_path, day, page_views, unique_visitors, total_engagement_seconds, updated_at").eq("owner_id", selected.ownerId).eq("project_key", selected.key),
    ]);
    analytics = buildEditorialPerformanceSnapshot({
      pages: selected.pages,
      performanceRows: performanceResult.data,
      trackingRows: internalTrackingResult.data,
      summaryRow: analyticsSummaryResult.data,
      performanceError: performanceResult.error?.message ?? analyticsSummaryResult.error?.message,
      trackingError: internalTrackingResult.error?.message,
    });
  }

  let analyticsConnection: ProjectAnalyticsConnection | null = null;
  if (activeTab === "settings") {
    const { data } = await supabase.from("project_analytics_connections").select("ga_property_id, ga_measurement_id, gsc_site_url, updated_at").eq("owner_id", selected.ownerId).eq("project_key", selected.key).maybeSingle();
    analyticsConnection = data as ProjectAnalyticsConnection | null;
  }

  const recap: MonthlyRecapData = {
    settings: null,
    events: [],
    deliveries: [],
    visitors: 0,
    previousVisitors: 0,
    contacts: 0,
    previousContacts: 0,
    pageViews: 0,
    articleImpressions: analytics.pages.filter((page) => page.path.startsWith("/blog/")).reduce((total, page) => total + page.searchConsole.impressions, 0),
    ready: false,
    defaultEmail: typeof authData?.claims?.email === "string" ? authData.claims.email : "",
  };
  if (selected.role === "admin" && activeTab === "recap") {
    const now = new Date();
    const monthStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const previousMonthStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const monthStart = monthStartDate.toISOString();
    const nextMonthStart = nextMonthStartDate.toISOString();
    const previousMonthStart = previousMonthStartDate.toISOString();
    const dayStart = monthStart.slice(0, 10);
    const nextDayStart = nextMonthStart.slice(0, 10);
    const previousDayStart = previousMonthStart.slice(0, 10);
    const [settingsResult, eventsResult, deliveriesResult, trafficResult, currentVisitorsResult, previousVisitorsResult, currentContactsResult, previousContactsResult] = await Promise.all([
      supabase.from("monthly_recap_settings").select("recipient_email, enabled, send_day").eq("owner_id", selected.ownerId).eq("project_key", selected.key).maybeSingle(),
      supabase.from("project_activity_events").select("id, event_type, entity_title, created_at").eq("owner_id", selected.ownerId).eq("project_key", selected.key).gte("created_at", monthStart).order("created_at", { ascending: false }).limit(100),
      supabase.from("monthly_recap_deliveries").select("id, period_start, status, created_at").eq("owner_id", selected.ownerId).eq("project_key", selected.key).order("period_start", { ascending: false }).limit(6),
      supabase.from("project_traffic_daily").select("visitors, page_views").eq("owner_id", selected.ownerId).eq("project_key", selected.key).gte("day", dayStart),
      supabase.from("project_site_tracking_visitors").select("visitor_id").eq("owner_id", selected.ownerId).eq("project_key", selected.key).gte("day", dayStart).lt("day", nextDayStart),
      supabase.from("project_site_tracking_visitors").select("visitor_id").eq("owner_id", selected.ownerId).eq("project_key", selected.key).gte("day", previousDayStart).lt("day", dayStart),
      supabase.from("project_contact_events").select("visitor_id").eq("owner_id", selected.ownerId).eq("project_key", selected.key).gte("created_at", monthStart).lt("created_at", nextMonthStart),
      supabase.from("project_contact_events").select("visitor_id").eq("owner_id", selected.ownerId).eq("project_key", selected.key).gte("created_at", previousMonthStart).lt("created_at", monthStart),
    ]);
    recap.settings = settingsResult.data as MonthlyRecapData["settings"];
    recap.events = (eventsResult.data ?? []) as MonthlyRecapData["events"];
    recap.deliveries = (deliveriesResult.data ?? []) as MonthlyRecapData["deliveries"];
    const trackedVisitors = new Set((currentVisitorsResult.data ?? []).map((row) => row.visitor_id)).size;
    const dailyVisitors = (trafficResult.data ?? []).reduce((total, row) => total + Number(row.visitors ?? 0), 0);
    recap.visitors = trackedVisitors || analytics.siteTotals.totalUsers || dailyVisitors;
    recap.previousVisitors = new Set((previousVisitorsResult.data ?? []).map((row) => row.visitor_id)).size;
    recap.contacts = new Set((currentContactsResult.data ?? []).map((row) => row.visitor_id)).size;
    recap.previousContacts = new Set((previousContactsResult.data ?? []).map((row) => row.visitor_id)).size;
    const trackedPageViews = (trafficResult.data ?? []).reduce((total, row) => total + Number(row.page_views ?? 0), 0);
    recap.pageViews = trackedPageViews || analytics.siteTotals.pageViews;
    recap.ready = !settingsResult.error && !eventsResult.error && !deliveriesResult.error && !trafficResult.error && !currentVisitorsResult.error && !previousVisitorsResult.error && !currentContactsResult.error && !previousContactsResult.error;
  }

  return <DashboardShell projects={projects} selectedKey={selected.key} activeTab={activeTab} invitations={invitations} assets={assets} recap={recap} analytics={analytics} analyticsConnection={analyticsConnection} />;
}
