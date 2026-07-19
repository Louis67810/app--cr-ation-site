import "server-only";
import type { SitePage } from "@/lib/site-template";

export type PagePerformanceMetrics = {
  path: string;
  title: string;
  firstSeenAt: string | null;
  googleAnalytics: {
    sessions: number;
    engagementSeconds: number;
    pageViews: number;
    totalUsers: number;
    sessionsPerUser: number;
    active28DayUsers: number;
  };
  agenceflow: {
    viewsLastWeek: number;
    visitorsLastWeek: number;
    sessionsLastWeek: number;
    clicksLastWeek: number;
    formSubmitsLastWeek: number;
    avgDurationSeconds: number;
    maxScrollDepth: number;
    lastSeenAt: string | null;
    dailyStats: unknown[];
  };
  searchConsole: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  customSignals: Record<string, unknown>;
};

export type EditorialPerformanceSnapshot = {
  status: "connected" | "partial" | "missing";
  periodStart: string | null;
  periodEnd: string | null;
  sources: Array<"googleAnalytics" | "searchConsole" | "agenceflow" | "siteTraffic">;
  siteTotals: { visitors: number; pageViews: number };
  pages: PagePerformanceMetrics[];
  warnings: string[];
};

type PerformanceRow = Record<string, unknown>;
type TrafficRow = { visitors?: number | null; page_views?: number | null };

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function articleTitle(page: SitePage) {
  const detail = page.sections.find((section) => section.type === "article-detail");
  return detail?.type === "article-detail" && typeof detail.fields.title === "string"
    ? detail.fields.title
    : page.title.replace(/^Article\s*-\s*/i, "");
}

function emptyPage(path: string, title: string): PagePerformanceMetrics {
  return {
    path,
    title,
    firstSeenAt: null,
    googleAnalytics: { sessions: 0, engagementSeconds: 0, pageViews: 0, totalUsers: 0, sessionsPerUser: 0, active28DayUsers: 0 },
    agenceflow: { viewsLastWeek: 0, visitorsLastWeek: 0, sessionsLastWeek: 0, clicksLastWeek: 0, formSubmitsLastWeek: 0, avgDurationSeconds: 0, maxScrollDepth: 0, lastSeenAt: null, dailyStats: [] },
    searchConsole: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    customSignals: {},
  };
}

function rowToPage(row: PerformanceRow): PagePerformanceMetrics {
  return {
    path: String(row.page_path ?? ""),
    title: String(row.page_title ?? row.page_path ?? "Page sans titre"),
    firstSeenAt: typeof row.first_seen_at === "string" ? row.first_seen_at : null,
    googleAnalytics: {
      sessions: number(row.ga_sessions),
      engagementSeconds: number(row.ga_engagement_seconds),
      pageViews: number(row.ga_page_views),
      totalUsers: number(row.ga_total_users),
      sessionsPerUser: number(row.ga_sessions_per_user),
      active28DayUsers: number(row.ga_active_28_day_users),
    },
    agenceflow: {
      viewsLastWeek: number(row.af_views_last_week),
      visitorsLastWeek: number(row.af_visitors_last_week),
      sessionsLastWeek: number(row.af_sessions_last_week),
      clicksLastWeek: number(row.af_clicks_last_week),
      formSubmitsLastWeek: number(row.af_form_submits_last_week),
      avgDurationSeconds: number(row.af_avg_duration_seconds),
      maxScrollDepth: number(row.af_max_scroll_depth),
      lastSeenAt: typeof row.af_last_seen_at === "string" ? row.af_last_seen_at : null,
      dailyStats: Array.isArray(row.af_daily_stats) ? row.af_daily_stats : [],
    },
    searchConsole: {
      clicks: number(row.gsc_clicks),
      impressions: number(row.gsc_impressions),
      ctr: number(row.gsc_ctr),
      position: number(row.gsc_position),
    },
    customSignals: row.custom_signals && typeof row.custom_signals === "object" && !Array.isArray(row.custom_signals)
      ? row.custom_signals as Record<string, unknown>
      : {},
  };
}

export function buildEditorialPerformanceSnapshot(input: {
  pages: SitePage[];
  performanceRows?: PerformanceRow[] | null;
  trafficRows?: TrafficRow[] | null;
  performanceError?: string | null;
}) {
  const rows = input.performanceRows ?? [];
  const indexed = new Map(rows.map((row) => [String(row.page_path ?? ""), rowToPage(row)]));
  const existingArticles = input.pages
    .filter((page) => page.slug.startsWith("/blog/") && page.slug !== "/blog")
    .map((page) => indexed.get(page.slug) ?? emptyPage(page.slug, articleTitle(page)));
  const extraRows = rows.map(rowToPage).filter((page) => !existingArticles.some((existing) => existing.path === page.path));
  const pages = [...existingArticles, ...extraRows];
  const sources = new Set<EditorialPerformanceSnapshot["sources"][number]>();
  if (rows.some((row) => number(row.ga_sessions) || number(row.ga_page_views) || number(row.ga_total_users))) sources.add("googleAnalytics");
  if (rows.some((row) => number(row.gsc_impressions) || number(row.gsc_clicks))) sources.add("searchConsole");
  if (rows.some((row) => number(row.af_views_last_week) || number(row.af_sessions_last_week) || number(row.af_clicks_last_week))) sources.add("agenceflow");
  if ((input.trafficRows ?? []).length) sources.add("siteTraffic");
  const siteTotals = (input.trafficRows ?? []).reduce<{ visitors: number; pageViews: number }>((total, row) => ({
    visitors: total.visitors + number(row.visitors),
    pageViews: total.pageViews + number(row.page_views),
  }), { visitors: 0, pageViews: 0 });
  const periodStarts = rows.map((row) => String(row.period_start ?? "")).filter(Boolean).sort();
  const periodEnds = rows.map((row) => String(row.period_end ?? "")).filter(Boolean).sort();
  const warnings: string[] = [];
  if (input.performanceError) warnings.push("La table de performance par page n'est pas encore disponible : applique la migration Supabase fournie.");
  if (!rows.length) warnings.push("Aucune métrique par page n'est connectée. Les zéros ne doivent pas être interprétés comme de mauvaises performances.");
  if (!sources.has("searchConsole")) warnings.push("Search Console n'est pas connecté : impressions, clics, CTR et position sont inconnus.");

  return {
    status: rows.length ? (sources.size >= 2 ? "connected" : "partial") : "missing",
    periodStart: periodStarts[0] ?? null,
    periodEnd: periodEnds.at(-1) ?? null,
    sources: [...sources],
    siteTotals,
    pages,
    warnings,
  } satisfies EditorialPerformanceSnapshot;
}
