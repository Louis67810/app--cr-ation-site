"use client";

import { Activity, BarChart3, Eye, LoaderCircle, MousePointerClick, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import type { EditorialPerformanceSnapshot } from "@/lib/editorial-performance";

function integer(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function decimal(value: number, digits = 1) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value);
}

function percentage(value: number) {
  return `${decimal(value * 100, 1)} %`;
}

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Jamais";
}

export function AnalyticsDashboard({ projectKey, projectOwnerId, initialData }: { projectKey: string; projectOwnerId: string; initialData: EditorialPerformanceSnapshot }) {
  const [data, setData] = useState(initialData);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function synchronize() {
    setSyncing(true);
    setError("");
    try {
      const response = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey, projectOwnerId }),
      });
      const result = await response.json() as EditorialPerformanceSnapshot & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "La synchronisation a échoué.");
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La synchronisation a échoué.");
    } finally {
      setSyncing(false);
    }
  }

  const visiblePages = data.pages
    .filter((page) => page.googleAnalytics.pageViews || page.searchConsole.impressions || page.searchConsole.clicks)
    .sort((a, b) => b.googleAnalytics.pageViews + b.searchConsole.impressions - a.googleAnalytics.pageViews - a.searchConsole.impressions);
  const cards = [
    ["Sessions", integer(data.siteTotals.sessions), Activity],
    ["Pages vues", integer(data.siteTotals.pageViews), Eye],
    ["Impressions Google", integer(data.siteTotals.impressions), Search],
    ["Clics Google", integer(data.siteTotals.clicks), MousePointerClick],
  ] as const;

  return <section className="mt-8 pb-12">
    <div className="flex flex-col gap-4 rounded-[14px] border border-[#e5e8ea] bg-[#fafafa] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`size-2 rounded-full ${data.status === "connected" ? "bg-emerald-500" : data.status === "partial" ? "bg-amber-500" : "bg-black/20"}`} />
          <p className="text-[13px] font-semibold">Google Analytics 4 + Search Console</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-black/45 shadow-sm">90 jours</span>
        </div>
        <p className="mt-2 text-[12px] text-black/45">Dernière synchronisation : {date(data.updatedAt)}{data.periodStart && data.periodEnd ? ` · données du ${data.periodStart} au ${data.periodEnd}` : ""}</p>
      </div>
      <button type="button" onClick={synchronize} disabled={syncing} className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#1c1c1c] px-4 text-[12px] font-semibold text-white disabled:opacity-50">
        {syncing ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}{syncing ? "Synchronisation…" : "Synchroniser les statistiques"}
      </button>
    </div>

    {error ? <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-700">{error}</div> : null}
    {!error && data.warnings.length ? <div className="mt-4 rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-800">{data.warnings.join(" ")}</div> : null}

    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, Icon]) => <div key={label} className="rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-5"><div className="flex items-center justify-between text-black/45"><span className="text-[11px] font-medium uppercase tracking-[.06em]">{label}</span><Icon size={17} /></div><p className="mt-4 font-serif text-[30px]">{value}</p></div>)}
    </div>

    <div className="mt-5 grid gap-4 sm:grid-cols-3">
      <div className="rounded-[12px] border border-black/[0.07] p-4"><p className="text-[11px] text-black/40">Taux d’engagement GA4</p><p className="mt-2 text-[18px] font-semibold">{percentage(data.siteTotals.engagementRate)}</p></div>
      <div className="rounded-[12px] border border-black/[0.07] p-4"><p className="text-[11px] text-black/40">CTR Search Console</p><p className="mt-2 text-[18px] font-semibold">{percentage(data.siteTotals.ctr)}</p></div>
      <div className="rounded-[12px] border border-black/[0.07] p-4"><p className="text-[11px] text-black/40">Position moyenne</p><p className="mt-2 text-[18px] font-semibold">{data.siteTotals.position ? decimal(data.siteTotals.position) : "—"}</p></div>
    </div>

    <div className="mt-9 flex items-end justify-between gap-4"><div><h2 className="font-serif text-[25px]">Performances par page</h2><p className="mt-1 text-[12px] text-black/45">Ces données sont aussi envoyées à l’agent IA pendant sa phase de recherche.</p></div><BarChart3 size={19} className="text-black/30" /></div>
    <div className="mt-4 overflow-x-auto rounded-[13px] border border-[#e8ecee]">
      <table className="w-full min-w-[900px] border-collapse text-left text-[12px]">
        <thead className="bg-[#f7f7f7] text-[10px] uppercase tracking-[.05em] text-black/45"><tr><th className="px-4 py-3 font-medium">Page</th><th className="px-3 py-3 font-medium">Sessions</th><th className="px-3 py-3 font-medium">Vues</th><th className="px-3 py-3 font-medium">Engagement</th><th className="px-3 py-3 font-medium">Impressions</th><th className="px-3 py-3 font-medium">Clics</th><th className="px-3 py-3 font-medium">CTR</th><th className="px-3 py-3 font-medium">Position</th></tr></thead>
        <tbody>{visiblePages.map((page) => <tr key={page.path} className="border-t border-black/[0.06]"><td className="max-w-[300px] px-4 py-3"><p className="truncate font-medium">{page.title}</p><p className="mt-0.5 truncate text-[10px] text-black/40">{page.path}</p></td><td className="px-3 py-3">{integer(page.googleAnalytics.sessions)}</td><td className="px-3 py-3">{integer(page.googleAnalytics.pageViews)}</td><td className="px-3 py-3">{percentage(page.googleAnalytics.engagementRate)}</td><td className="px-3 py-3">{integer(page.searchConsole.impressions)}</td><td className="px-3 py-3">{integer(page.searchConsole.clicks)}</td><td className="px-3 py-3">{percentage(page.searchConsole.ctr)}</td><td className="px-3 py-3">{page.searchConsole.position ? decimal(page.searchConsole.position) : "—"}</td></tr>)}</tbody>
      </table>
      {!visiblePages.length ? <div className="p-10 text-center text-[12px] text-black/45">Aucune donnée n’est encore disponible. Configure les variables Google, puis lance une synchronisation.</div> : null}
    </div>
  </section>;
}
