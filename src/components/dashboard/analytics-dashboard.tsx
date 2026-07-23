"use client";

import { Activity, BarChart3, Clock3, Eye, LoaderCircle, RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import type { EditorialPerformanceSnapshot } from "@/lib/editorial-performance";

const integer = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
const decimal = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Jamais";

export function AnalyticsDashboard({ projectKey, projectOwnerId, initialData, gaPropertyId }: { projectKey: string; projectOwnerId: string; initialData: EditorialPerformanceSnapshot; gaPropertyId?: string }) {
  const [data, setData] = useState(initialData);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function refreshTracking() {
    setSyncing(true); setError("");
    try {
      const response = await fetch(`/api/analytics?projectKey=${encodeURIComponent(projectKey)}&projectOwnerId=${encodeURIComponent(projectOwnerId)}`);
      const result = await response.json() as EditorialPerformanceSnapshot & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "L’actualisation a échoué.");
      setData(result);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "L’actualisation a échoué."); }
    finally { setSyncing(false); }
  }

  const visiblePages = data.pages
    .filter((page) => page.internalTracking.pageViews || page.internalTracking.uniqueVisitors || page.internalTracking.totalEngagementSeconds || page.googleAnalytics.pageViews)
    .sort((a, b) => b.internalTracking.pageViews + b.googleAnalytics.pageViews - a.internalTracking.pageViews - a.googleAnalytics.pageViews);
  const totals = data.pages.reduce((sum, page) => ({ pageViews: sum.pageViews + page.internalTracking.pageViews, visitors: sum.visitors + page.internalTracking.uniqueVisitors, engagement: sum.engagement + page.internalTracking.totalEngagementSeconds }), { pageViews: 0, visitors: 0, engagement: 0 });
  const averageEngagement = totals.pageViews ? totals.engagement / totals.pageViews : 0;
  const cards = [["Pages vues", integer(totals.pageViews), Eye], ["Visiteurs uniques", integer(totals.visitors), Users], ["Temps cumulé", `${integer(totals.engagement)} s`, Activity], ["Temps moyen / vue", `${decimal(averageEngagement)} s`, Clock3]] as const;

  return <section className="mt-8 pb-12">
    <div className="flex flex-col gap-4 rounded-[14px] border border-[#e5e8ea] bg-[#fafafa] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex flex-wrap items-center gap-2"><span className={`size-2 rounded-full ${data.sources.includes("internalTracking") ? "bg-emerald-500" : "bg-black/20"}`} /><p className="text-[13px] font-semibold">Tracking interne du site {gaPropertyId ? "· Google Analytics disponible aussi" : "· aucune connexion Google requise"}</p><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-black/45 shadow-sm">Données réelles</span></div><p className="mt-2 text-[12px] text-black/45">Dernière donnée reçue : {date(data.updatedAt)} · vues, visiteurs et temps captés directement sur le site publié.</p></div>
      <button type="button" onClick={refreshTracking} disabled={syncing} className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#1c1c1c] px-4 text-[12px] font-semibold text-white disabled:opacity-50">{syncing ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}{syncing ? "Actualisation…" : "Actualiser les statistiques"}</button>
    </div>
    {error ? <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-700">{error}</div> : null}
    {data.warnings.filter((warning) => !warning.includes("Google")).length ? <div className="mt-4 rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-800">{data.warnings.filter((warning) => !warning.includes("Google")).join(" ")}</div> : null}
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-5"><div className="flex items-center justify-between text-black/45"><span className="text-[11px] font-medium uppercase tracking-[.06em]">{label}</span><Icon size={17} /></div><p className="mt-4 font-serif text-[30px]">{value}</p></div>)}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="rounded-[12px] border border-black/[0.07] p-4"><p className="text-[11px] text-black/40">Temps moyen par page vue</p><p className="mt-2 text-[18px] font-semibold">{decimal(averageEngagement)} s</p></div><div className="rounded-[12px] border border-black/[0.07] p-4"><p className="text-[11px] text-black/40">Pages suivies</p><p className="mt-2 text-[18px] font-semibold">{integer(visiblePages.length)}</p></div><div className="rounded-[12px] border border-black/[0.07] p-4"><p className="text-[11px] text-black/40">Source active</p><p className="mt-2 text-[18px] font-semibold">Tracker interne</p></div></div>
    <div className="mt-9 flex items-end justify-between gap-4"><div><h2 className="font-serif text-[25px]">Performances par page</h2><p className="mt-1 text-[12px] text-black/45">Les données internes sont aussi transmises à l’agent IA pendant sa recherche.</p></div><BarChart3 size={19} className="text-black/30" /></div>
    <div className="mt-4 overflow-x-auto rounded-[13px] border border-[#e8ecee]"><table className="w-full min-w-[840px] border-collapse text-left text-[12px]"><thead className="bg-[#f7f7f7] text-[10px] uppercase tracking-[.05em] text-black/45"><tr><th className="px-4 py-3 font-medium">Page</th><th className="px-3 py-3 font-medium">Vues</th><th className="px-3 py-3 font-medium">Visiteurs</th><th className="px-3 py-3 font-medium">Temps cumulé</th><th className="px-3 py-3 font-medium">Temps moyen</th><th className="px-3 py-3 font-medium">Vues GA4</th></tr></thead><tbody>{visiblePages.map((page) => <tr key={page.path} className="border-t border-black/[0.06]"><td className="max-w-[300px] px-4 py-3"><p className="truncate font-medium">{page.title}</p><p className="mt-0.5 truncate text-[10px] text-black/40">{page.path}</p></td><td className="px-3 py-3">{integer(page.internalTracking.pageViews)}</td><td className="px-3 py-3">{integer(page.internalTracking.uniqueVisitors)}</td><td className="px-3 py-3">{integer(page.internalTracking.totalEngagementSeconds)} s</td><td className="px-3 py-3">{decimal(page.internalTracking.averageEngagementSeconds)} s</td><td className="px-3 py-3">{page.googleAnalytics.pageViews ? integer(page.googleAnalytics.pageViews) : "—"}</td></tr>)}</tbody></table>{!visiblePages.length ? <div className="p-10 text-center text-[12px] text-black/45">Aucune donnée n’est encore disponible. Publie le site puis navigue dessus pour déclencher le tracker interne.</div> : null}</div>
  </section>;
}
