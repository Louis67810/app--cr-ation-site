"use client";

import { ChevronDown, CircleDot, Globe2, Laptop, LoaderCircle, RefreshCw, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { EditorialPerformanceSnapshot } from "@/lib/editorial-performance";

type Event = {
  page_path: string; session_id: string; visitor_id: string; referrer: string;
  device_type: "desktop" | "mobile" | "tablet"; country_code: string; occurred_at: string; last_seen_at: string; engagement_seconds: number;
};
type AnalyticsRange = "day" | "week" | "month" | "year";
type SeriesPoint = { bucket: string; pageViews: number; uniqueVisitors: number };
type InternalAnalytics = { range: AnalyticsRange; liveVisitors: number; events: Event[]; series: SeriesPoint[] };
type ResponseData = EditorialPerformanceSnapshot & { internalAnalytics?: InternalAnalytics; error?: string };
type Filters = { referrer?: string; page_path?: string; country_code?: string; device_type?: string };

const integer = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
const seconds = (value: number) => value >= 60 ? `${Math.floor(value / 60)}m${Math.round(value % 60).toString().padStart(2, "0")}s` : `${Math.round(value)}s`;
const countryNames = new Intl.DisplayNames(["fr"], { type: "region" });
const rangeOptions: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "day", label: "24 h" },
  { value: "week", label: "7 jours" },
  { value: "month", label: "30 jours" },
  { value: "year", label: "1 an" },
];

function sourceLabel(value: string) { return value === "direct" ? "Accès direct" : value; }
function countryLabel(value: string) {
  if (value === "Unknown") return "Inconnu";
  try { return countryNames.of(value) ?? value; } catch { return value; }
}
function deviceLabel(value: string) { return value === "desktop" ? "Ordinateur" : value === "mobile" ? "Mobile" : "Tablette"; }
function pageLabel(path: string, titles: Map<string, string>) { return titles.get(path) ?? (path === "/" ? "Accueil" : path); }
function group(events: Event[], key: keyof Pick<Event, "referrer" | "page_path" | "country_code" | "device_type">) {
  return [...events.reduce((map, event) => map.set(event[key], (map.get(event[key]) ?? 0) + 1), new Map<string, number>()).entries()]
    .map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

function eventBucket(event: Event, range: AnalyticsRange) {
  const value = new Date(event.occurred_at);
  if (range === "day") {
    value.setUTCMinutes(0, 0, 0);
    return value.toISOString();
  }
  return event.occurred_at.slice(0, range === "year" ? 7 : 10);
}

function formatBucket(bucket: string, range: AnalyticsRange, detailed = false) {
  const date = range === "year"
    ? new Date(`${bucket}-01T12:00:00Z`)
    : range === "day"
      ? new Date(bucket)
      : new Date(`${bucket}T12:00:00`);
  if (range === "day") {
    return new Intl.DateTimeFormat("fr-FR", detailed
      ? { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
      : { hour: "2-digit" }).format(date);
  }
  if (range === "year") {
    return new Intl.DateTimeFormat("fr-FR", { month: detailed ? "long" : "short", year: detailed ? "numeric" : undefined }).format(date);
  }
  return new Intl.DateTimeFormat("fr-FR", detailed
    ? { weekday: "short", day: "numeric", month: "long", year: "numeric" }
    : { day: "numeric", month: "short" }).format(date);
}

function LineChart({ series, range, onRangeChange }: { series: SeriesPoint[]; range: AnalyticsRange; onRangeChange: (range: AnalyticsRange) => void }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const max = Math.max(1, ...series.flatMap((point) => [point.pageViews, point.uniqueVisitors]));
  const width = 1000; const height = 250; const left = 0; const bottom = 210;
  const points = (field: "pageViews" | "uniqueVisitors") => series.map((point, index) => {
    const x = left + (index / Math.max(1, series.length - 1)) * width;
    const y = bottom - (point[field] / max) * 185;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  const area = `${left},${bottom} ${points("pageViews")} ${width},${bottom}`;
  const hovered = hoveredIndex === null ? null : series[hoveredIndex];
  const hoveredLeft = hoveredIndex === null ? 0 : hoveredIndex / Math.max(1, series.length - 1) * 100;
  const hoveredViewsTop = hovered ? (bottom - (hovered.pageViews / max) * 185) / height * 230 : 0;
  const hoveredVisitorsTop = hovered ? (bottom - (hovered.uniqueVisitors / max) * 185) / height * 230 : 0;
  return <div className="mt-7 border-t border-black/[0.08] pt-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4 text-[11px] font-medium text-black/45"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#8064ff]" />Pages vues</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#179dff]" />Visiteurs</span></div>
      <div className="flex rounded-[9px] bg-black/[0.045] p-1" aria-label="Période du graphique">{rangeOptions.map((option) => <button type="button" key={option.value} aria-pressed={range === option.value} onClick={() => onRangeChange(option.value)} className={`${range === option.value ? "bg-white text-black shadow-sm" : "text-black/45 hover:text-black/70"} rounded-[7px] px-3 py-1.5 text-[11px] font-semibold transition`}>{option.label}</button>)}</div>
    </div>
    <div
      className="relative h-[270px] w-full touch-none overflow-hidden"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
        setHoveredIndex(Math.round(ratio * Math.max(0, series.length - 1)));
      }}
      onPointerLeave={() => setHoveredIndex(null)}
    >
      <span className="absolute left-0 top-0 text-[11px] font-medium text-black/40">{integer(max)}</span>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-[230px] w-full" aria-label="Évolution des visites">
        <defs><linearGradient id="traffic-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#8265ff" stopOpacity=".18"/><stop offset="1" stopColor="#8265ff" stopOpacity="0"/></linearGradient></defs>
        <line x1="0" x2={width} y1={bottom} y2={bottom} stroke="rgba(0,0,0,.1)" strokeWidth="1" />
        <polygon points={area} fill="url(#traffic-fill)" />
        <polyline points={points("pageViews")} fill="none" stroke="#8064ff" strokeWidth="2.3" vectorEffect="non-scaling-stroke" />
        <polyline points={points("uniqueVisitors")} fill="none" stroke="#179dff" strokeWidth="2.1" vectorEffect="non-scaling-stroke" />
      </svg>
      {hovered ? <><span className="pointer-events-none absolute top-0 h-[230px] w-px bg-black/15" style={{ left: `${hoveredLeft}%` }} /><span className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#8064ff] shadow" style={{ left: `${hoveredLeft}%`, top: hoveredViewsTop }} /><span className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#179dff] shadow" style={{ left: `${hoveredLeft}%`, top: hoveredVisitorsTop }} /><div className={`pointer-events-none absolute top-3 z-10 min-w-[174px] rounded-[10px] border border-black/10 bg-white p-3 shadow-[0_12px_35px_rgba(0,0,0,.12)] ${hoveredLeft > 72 ? "-translate-x-full" : hoveredLeft > 28 ? "-translate-x-1/2" : ""}`} style={{ left: `${hoveredLeft}%` }}><p className="text-[10px] font-semibold capitalize text-black/45">{formatBucket(hovered.bucket, range, true)}</p><div className="mt-2 flex items-center justify-between gap-6 text-[12px]"><span className="flex items-center gap-1.5 text-black/55"><span className="size-2 rounded-full bg-[#8064ff]" />Pages vues</span><strong>{integer(hovered.pageViews)}</strong></div><div className="mt-1.5 flex items-center justify-between gap-6 text-[12px]"><span className="flex items-center gap-1.5 text-black/55"><span className="size-2 rounded-full bg-[#179dff]" />Visiteurs</span><strong>{integer(hovered.uniqueVisitors)}</strong></div></div></> : null}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[11px] font-medium text-black/40"><span>{series[0] ? formatBucket(series[0].bucket, range) : "—"}</span><span>{series.at(-1) ? formatBucket(series.at(-1)!.bucket, range) : "—"}</span></div>
    </div>
  </div>;
}

function Breakdown({ title, icon, items, filterKey, selected, onSelect, label }: { title: string; icon: React.ReactNode; items: Array<{ value: string; count: number }>; filterKey: keyof Filters; selected?: string; onSelect: (key: keyof Filters, value: string) => void; label: (value: string) => string }) {
  return <section className="min-w-0 border-t border-black/[0.08] pt-5 lg:border-t-0 lg:pt-0">
    <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-[14px] font-semibold text-black/80">{icon}{title}</h3><ChevronDown size={15} className="text-black/35" /></div>
    <div className="space-y-2">{items.slice(0, 6).map(({ value, count }) => <button type="button" key={value} onClick={() => onSelect(filterKey, value)} className={`flex w-full items-center justify-between gap-3 rounded-[11px] px-3 py-2 text-left transition ${selected === value ? "bg-[#e8e8e8]" : "bg-black/[0.045] hover:bg-black/[0.07]"}`}><span className="min-w-0 truncate text-[13px] font-medium text-black/60">{label(value)}</span><span className="shrink-0 text-[13px] font-medium text-black/75">{integer(count)}</span></button>)}{!items.length ? <p className="py-4 text-[12px] text-black/40">Aucune donnée pour ce filtre.</p> : null}</div>
  </section>;
}

export function AnalyticsDashboard({ projectKey, projectOwnerId, initialData }: { projectKey: string; projectOwnerId: string; initialData: EditorialPerformanceSnapshot; gaPropertyId?: string }) {
  const [data, setData] = useState<ResponseData>(initialData);
  const [range, setRange] = useState<AnalyticsRange>("month");
  const [filters, setFilters] = useState<Filters>({});
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState("");
  const titles = useMemo(() => new Map(data.pages.map((page) => [page.path, page.title])), [data.pages]);
  const analytics = data.internalAnalytics;

  async function refreshTracking() {
    setSyncing(true); setError("");
    try {
      const response = await fetch(`/api/analytics?projectKey=${encodeURIComponent(projectKey)}&projectOwnerId=${encodeURIComponent(projectOwnerId)}&range=${range}`);
      const result = await response.json() as ResponseData;
      if (!response.ok) throw new Error(result.error ?? "L’actualisation a échoué.");
      setData(result);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "L’actualisation a échoué."); }
    finally { setSyncing(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    const url = `/api/analytics?projectKey=${encodeURIComponent(projectKey)}&projectOwnerId=${encodeURIComponent(projectOwnerId)}&range=${range}`;
    void fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as ResponseData;
        if (!response.ok) throw new Error(result.error ?? "L’actualisation a échoué.");
        return result;
      })
      .then((result) => setData(result))
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "L’actualisation a échoué.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setSyncing(false);
      });
    return () => controller.abort();
  }, [projectKey, projectOwnerId, range]);

  const filteredEvents = useMemo(() => (analytics?.events ?? []).filter((event) => Object.entries(filters).every(([key, value]) => !value || event[key as keyof Event] === value)), [analytics, filters]);
  const series = useMemo(() => {
    const buckets = analytics?.series.map((item) => item.bucket) ?? [];
    return buckets.map((bucket) => {
      const events = filteredEvents.filter((event) => eventBucket(event, range) === bucket);
      return { bucket, pageViews: events.length, uniqueVisitors: new Set(events.map((event) => event.visitor_id)).size };
    });
  }, [analytics, filteredEvents, range]);
  const uniqueVisitors = new Set(filteredEvents.map((event) => event.visitor_id)).size;
  const pageViews = filteredEvents.length;
  const engagement = filteredEvents.reduce((total, event) => total + Number(event.engagement_seconds ?? 0), 0);
  const selectedCount = Object.keys(filters).length;
  const toggle = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: current[key] === value ? undefined : value }));
  const cards = [
    ["Visiteurs en direct", analytics?.liveVisitors ?? 0, true],
    ["Pages vues totales", pageViews, false],
    ["Visiteurs uniques", uniqueVisitors, false],
    ["Temps total", seconds(engagement), false],
    ["Temps moyen", seconds(pageViews ? engagement / pageViews : 0), false],
  ] as const;

  return <section className="mt-8 pb-12">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-serif text-[28px] text-black">Statistiques</h2><p className="mt-1 text-[13px] text-black/45">{range === "day" ? "Dernières 24 heures" : range === "week" ? "7 derniers jours" : range === "year" ? "12 derniers mois" : "30 derniers jours"} · données du tracker intégré au site publié.</p></div><div className="flex items-center gap-3">{selectedCount ? <button type="button" onClick={() => setFilters({})} className="text-[12px] font-medium text-black/55 hover:text-black">Effacer les filtres ({selectedCount})</button> : null}<button type="button" onClick={refreshTracking} disabled={syncing} className="flex h-9 items-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] px-5 text-[14px] font-semibold text-white shadow-md disabled:opacity-50">{syncing ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}{syncing ? "Actualisation…" : "Actualiser"}</button></div></div>
    {error ? <p className="mb-4 rounded-[10px] border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">{error}</p> : null}
    <div className="border-y border-black/[0.08] py-7"><div className="grid grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-5">{cards.map(([label, value, live]) => <div key={label}><div className="flex items-center gap-1.5 text-[13px] font-medium text-black/55">{label}{live ? <span className="relative flex size-3"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#149cff] opacity-25"/><span className="relative inline-flex size-2.5 rounded-full bg-[#149cff]"/></span> : null}</div><p className="mt-1.5 text-[27px] font-semibold tracking-[-.04em] text-black/80">{typeof value === "number" ? integer(value) : value}</p></div>)}</div></div>
    <LineChart series={series} range={range} onRangeChange={(nextRange) => { if (nextRange !== range) { setSyncing(true); setRange(nextRange); } }} />
    <div className="mt-8 grid gap-x-10 gap-y-9 border-t border-black/[0.08] pt-7 lg:grid-cols-2"><Breakdown title="Sources" icon={<Globe2 size={16} className="text-black/45" />} items={group(filteredEvents, "referrer")} filterKey="referrer" selected={filters.referrer} onSelect={toggle} label={sourceLabel}/><Breakdown title="Pages" icon={<CircleDot size={16} className="text-black/45" />} items={group(filteredEvents, "page_path")} filterKey="page_path" selected={filters.page_path} onSelect={toggle} label={(value) => pageLabel(value, titles)}/><Breakdown title="Géographie" icon={<Globe2 size={16} className="text-black/45" />} items={group(filteredEvents, "country_code")} filterKey="country_code" selected={filters.country_code} onSelect={toggle} label={countryLabel}/><Breakdown title="Appareils" icon={<Laptop size={16} className="text-black/45" />} items={group(filteredEvents, "device_type")} filterKey="device_type" selected={filters.device_type} onSelect={toggle} label={deviceLabel}/></div>
    {!analytics?.events.length && !syncing ? <p className="mt-8 rounded-[12px] border border-dashed border-black/15 p-5 text-[12px] text-black/50">Aucune donnée détaillée pour le moment. Applique la migration puis navigue sur le site publié : les visites apparaîtront ici automatiquement.</p> : null}
    <p className="mt-8 flex items-center gap-2 text-[11px] text-black/40"><Smartphone size={13} />Clique sur une source, une page, un pays ou un appareil pour croiser toutes les statistiques.</p>
  </section>;
}
