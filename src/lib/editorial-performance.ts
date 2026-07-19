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
    averageSessionDuration: number;
    engagementRate: number;
    scrolledUsers: number;
  };
  searchConsole: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
};

export type AnalyticsTotals = {
  sessions: number;
  engagementSeconds: number;
  pageViews: number;
  totalUsers: number;
  averageSessionDuration: number;
  engagementRate: number;
  scrolledUsers: number;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type EditorialPerformanceSnapshot = {
  status: "connected" | "partial" | "missing";
  periodStart: string | null;
  periodEnd: string | null;
  updatedAt: string | null;
  sources: Array<"googleAnalytics" | "searchConsole">;
  siteTotals: AnalyticsTotals;
  pages: PagePerformanceMetrics[];
  warnings: string[];
};

type PerformanceRow = Record<string, unknown>;

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
    googleAnalytics: {
      sessions: 0,
      engagementSeconds: 0,
      pageViews: 0,
      totalUsers: 0,
      sessionsPerUser: 0,
      averageSessionDuration: 0,
      engagementRate: 0,
      scrolledUsers: 0,
    },
    searchConsole: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
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
      averageSessionDuration: number(row.ga_average_session_duration),
      engagementRate: number(row.ga_engagement_rate),
      scrolledUsers: number(row.ga_scrolled_users),
    },
    searchConsole: {
      clicks: number(row.gsc_clicks),
      impressions: number(row.gsc_impressions),
      ctr: number(row.gsc_ctr),
      position: number(row.gsc_position),
    },
  };
}

export function buildEditorialPerformanceSnapshot(input: {
  pages: SitePage[];
  performanceRows?: PerformanceRow[] | null;
  summaryRow?: PerformanceRow | null;
  performanceError?: string | null;
}) {
  const rows = input.performanceRows ?? [];
  const indexed = new Map(rows.map((row) => [String(row.page_path ?? ""), rowToPage(row)]));
  const projectPages = input.pages.map((page) => indexed.get(page.slug) ?? emptyPage(page.slug, page.slug.startsWith("/blog/") ? articleTitle(page) : page.title));
  const extraRows = rows.map(rowToPage).filter((page) => !projectPages.some((existing) => existing.path === page.path));
  const pages = [...projectPages, ...extraRows];
  const sources = new Set<EditorialPerformanceSnapshot["sources"][number]>();
  const summary = input.summaryRow;
  if (summary && (number(summary.ga_sessions) || number(summary.ga_page_views) || number(summary.ga_total_users))) sources.add("googleAnalytics");
  if (summary && (number(summary.gsc_impressions) || number(summary.gsc_clicks))) sources.add("searchConsole");

  const siteTotals: AnalyticsTotals = {
    sessions: number(summary?.ga_sessions),
    engagementSeconds: number(summary?.ga_engagement_seconds),
    pageViews: number(summary?.ga_page_views),
    totalUsers: number(summary?.ga_total_users),
    averageSessionDuration: number(summary?.ga_average_session_duration),
    engagementRate: number(summary?.ga_engagement_rate),
    scrolledUsers: number(summary?.ga_scrolled_users),
    clicks: number(summary?.gsc_clicks),
    impressions: number(summary?.gsc_impressions),
    ctr: number(summary?.gsc_ctr),
    position: number(summary?.gsc_position),
  };
  const strings = (values: unknown[]) => values.filter((value): value is string => typeof value === "string" && Boolean(value)).sort();
  const periodStarts = strings([summary?.period_start, ...rows.map((row) => row.period_start)]);
  const periodEnds = strings([summary?.period_end, ...rows.map((row) => row.period_end)]);
  const updatedDates = strings([summary?.updated_at, ...rows.map((row) => row.updated_at)]);
  const warnings: string[] = [];
  if (input.performanceError) warnings.push("Les tables de statistiques ne sont pas encore disponibles : applique les migrations Supabase fournies.");
  if (!summary && !rows.length) warnings.push("Aucune statistique Google n’a encore été synchronisée. Les zéros ne représentent pas de mauvaises performances.");
  if (!sources.has("googleAnalytics")) warnings.push("Google Analytics 4 n’est pas encore connecté ou ne contient aucune donnée sur la période.");
  if (!sources.has("searchConsole")) warnings.push("Google Search Console n’est pas encore connecté ou ne contient aucune donnée sur la période.");

  return {
    status: summary || rows.length ? (sources.size === 2 ? "connected" : "partial") : "missing",
    periodStart: periodStarts[0] ?? null,
    periodEnd: periodEnds.at(-1) ?? null,
    updatedAt: updatedDates.at(-1) ?? null,
    sources: [...sources],
    siteTotals,
    pages,
    warnings,
  } satisfies EditorialPerformanceSnapshot;
}
