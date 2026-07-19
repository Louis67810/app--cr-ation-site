import "server-only";

import { GoogleAuth } from "google-auth-library";

const GA_METRICS = [
  "sessions",
  "userEngagementDuration",
  "screenPageViews",
  "totalUsers",
  "sessionsPerUser",
  "averageSessionDuration",
  "engagementRate",
  "scrolledUsers",
] as const;

type GoogleMetricValues = { metricValues?: Array<{ value?: string }>; dimensionValues?: Array<{ value?: string }> };
type GaResponse = { rows?: GoogleMetricValues[] };
type GscRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
type GscResponse = { rows?: GscRow[] };

export type GooglePagePerformance = {
  pagePath: string;
  pageTitle: string;
  gaSessions: number;
  gaEngagementSeconds: number;
  gaPageViews: number;
  gaTotalUsers: number;
  gaSessionsPerUser: number;
  gaAverageSessionDuration: number;
  gaEngagementRate: number;
  gaScrolledUsers: number;
  gscClicks: number;
  gscImpressions: number;
  gscCtr: number;
  gscPosition: number;
};

export type GooglePerformanceSync = {
  periodStart: string;
  periodEnd: string;
  pages: GooglePagePerformance[];
  totals: Omit<GooglePagePerformance, "pagePath" | "pageTitle" | "gaSessionsPerUser">;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`La variable ${name} est manquante.`);
  return value;
}

function numeric(value: string | number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizePath(value: string) {
  let path = value.trim() || "/";
  try {
    path = new URL(path).pathname;
  } catch {
    path = path.split("?")[0]?.split("#")[0] || "/";
  }
  if (!path.startsWith("/")) path = `/${path}`;
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function gaValues(row?: GoogleMetricValues) {
  const values = row?.metricValues ?? [];
  return {
    sessions: numeric(values[0]?.value),
    engagementSeconds: numeric(values[1]?.value),
    pageViews: numeric(values[2]?.value),
    totalUsers: numeric(values[3]?.value),
    sessionsPerUser: numeric(values[4]?.value),
    averageSessionDuration: numeric(values[5]?.value),
    engagementRate: numeric(values[6]?.value),
    scrolledUsers: numeric(values[7]?.value),
  };
}

async function googleToken() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: required("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ],
  });
  const token = await auth.getAccessToken();
  if (!token) throw new Error("Google n’a pas renvoyé de jeton d’accès.");
  return token;
}

async function googlePost<T>(url: string, token: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google API (${response.status}) : ${detail.slice(0, 500)}`);
  }
  return await response.json() as T;
}

async function gaReport(token: string, propertyId: string, startDate: string, endDate: string, byPage: boolean) {
  return googlePost<GaResponse>(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    token,
    {
      dateRanges: [{ startDate, endDate }],
      ...(byPage ? { dimensions: [{ name: "pagePath" }, { name: "pageTitle" }] } : {}),
      metrics: GA_METRICS.map((name) => ({ name })),
      limit: byPage ? "100000" : "1",
      keepEmptyRows: false,
    },
  );
}

async function gscReport(token: string, siteUrl: string, startDate: string, endDate: string, byPage: boolean) {
  const rows: GscRow[] = [];
  let startRow = 0;
  do {
    const response = await googlePost<GscResponse>(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      token,
      {
        startDate,
        endDate,
        ...(byPage ? { dimensions: ["page"], aggregationType: "byPage" } : {}),
        type: "web",
        dataState: "final",
        rowLimit: byPage ? 25000 : 1,
        startRow,
      },
    );
    const batch = response.rows ?? [];
    rows.push(...batch);
    startRow += batch.length;
    if (!byPage || batch.length < 25000) break;
  } while (startRow < 100000);
  return rows;
}

export async function fetchGoogleSitePerformance(days = 90): Promise<GooglePerformanceSync> {
  const propertyId = required("GA4_PROPERTY_ID").replace(/^properties\//, "");
  const siteUrl = required("GSC_SITE_URL");
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 2);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - Math.max(1, days - 1));
  const periodStart = isoDate(start);
  const periodEnd = isoDate(end);
  const token = await googleToken();

  const [gaPages, gaTotal, gscPages, gscTotal] = await Promise.all([
    gaReport(token, propertyId, periodStart, periodEnd, true),
    gaReport(token, propertyId, periodStart, periodEnd, false),
    gscReport(token, siteUrl, periodStart, periodEnd, true),
    gscReport(token, siteUrl, periodStart, periodEnd, false),
  ]);

  const pages = new Map<string, GooglePagePerformance>();
  const ensurePage = (path: string, title = path) => {
    const normalized = normalizePath(path);
    const existing = pages.get(normalized);
    if (existing) return existing;
    const created: GooglePagePerformance = {
      pagePath: normalized,
      pageTitle: title || normalized,
      gaSessions: 0,
      gaEngagementSeconds: 0,
      gaPageViews: 0,
      gaTotalUsers: 0,
      gaSessionsPerUser: 0,
      gaAverageSessionDuration: 0,
      gaEngagementRate: 0,
      gaScrolledUsers: 0,
      gscClicks: 0,
      gscImpressions: 0,
      gscCtr: 0,
      gscPosition: 0,
    };
    pages.set(normalized, created);
    return created;
  };

  for (const row of gaPages.rows ?? []) {
    const page = ensurePage(row.dimensionValues?.[0]?.value ?? "/", row.dimensionValues?.[1]?.value);
    const metrics = gaValues(row);
    page.gaSessions = metrics.sessions;
    page.gaEngagementSeconds = metrics.engagementSeconds;
    page.gaPageViews = metrics.pageViews;
    page.gaTotalUsers = metrics.totalUsers;
    page.gaSessionsPerUser = metrics.sessionsPerUser;
    page.gaAverageSessionDuration = metrics.averageSessionDuration;
    page.gaEngagementRate = metrics.engagementRate;
    page.gaScrolledUsers = metrics.scrolledUsers;
  }
  for (const row of gscPages) {
    const page = ensurePage(row.keys?.[0] ?? "/");
    page.gscClicks = numeric(row.clicks);
    page.gscImpressions = numeric(row.impressions);
    page.gscCtr = numeric(row.ctr);
    page.gscPosition = numeric(row.position);
  }

  const ga = gaValues(gaTotal.rows?.[0]);
  const gsc = gscTotal[0] ?? {};
  return {
    periodStart,
    periodEnd,
    pages: [...pages.values()],
    totals: {
      gaSessions: ga.sessions,
      gaEngagementSeconds: ga.engagementSeconds,
      gaPageViews: ga.pageViews,
      gaTotalUsers: ga.totalUsers,
      gaAverageSessionDuration: ga.averageSessionDuration,
      gaEngagementRate: ga.engagementRate,
      gaScrolledUsers: ga.scrolledUsers,
      gscClicks: numeric(gsc.clicks),
      gscImpressions: numeric(gsc.impressions),
      gscCtr: numeric(gsc.ctr),
      gscPosition: numeric(gsc.position),
    },
  };
}
