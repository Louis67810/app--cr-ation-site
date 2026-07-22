"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, Check, FileText, ImageIcon, LoaderCircle, Mail, MonitorPlay, Send, Sparkles } from "lucide-react";
import type { DashboardProject, MonthlyRecapData, MonthlyRecapEvent } from "@/components/dashboard/dashboard-shell";
import { MonthlyRecapVideo } from "@/components/dashboard/monthly-recap-video";

const eventLabels: Record<MonthlyRecapEvent["event_type"], string> = {
  page_created: "Page créée",
  article_created: "Article ajouté",
  realisation_created: "Réalisation ajoutée",
  project_published: "Site publié",
};

export function MonthlyRecap({ project, data }: { project: DashboardProject; data: MonthlyRecapData }) {
  const { settings: initialSettings, events: initialEvents, deliveries: initialDeliveries, visitors, pageViews, ready, defaultEmail } = data;
  const [email, setEmail] = useState(initialSettings?.recipient_email ?? defaultEmail);
  const [enabled, setEnabled] = useState(initialSettings?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(ready ? "" : "La base du récap mensuel doit encore être installée dans Supabase.");
  const counts = useMemo(() => ({
    pages: project.pages.filter((page) => !page.slug.startsWith("/blog/") && !page.slug.startsWith("/realisations/")).length,
    articles: project.pages.filter((page) => page.slug.startsWith("/blog/")).length,
    realisations: project.pages.filter((page) => page.slug.startsWith("/realisations/")).length,
    total: project.pages.length,
  }), [project.pages]);
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date());
  const homePage = project.pages.find((page) => page.slug === "/") ?? project.pages[0];
  const previewPath = homePage?.slug === "/" ? "" : homePage?.slug.startsWith("/") ? homePage.slug : `/${homePage?.slug ?? ""}`;
  const previewUrl = project.publishedSlug && homePage
    ? `/published/${project.publishedSlug}${previewPath}?preview=dashboard`
    : undefined;

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || !email.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/monthly-recap/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectKey: project.key, projectOwnerId: project.ownerId, recipientEmail: email.trim(), enabled }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Enregistrement impossible.");
      setMessage(enabled ? "Le récap sera envoyé chaque mois à cette adresse." : "L’envoi mensuel est désactivé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  const cards = [
    { label: "Pages créées", value: counts.total, Icon: FileText },
    { label: "Articles ajoutés", value: counts.articles, Icon: Sparkles },
    { label: "Réalisations ajoutées", value: counts.realisations, Icon: ImageIcon },
    { label: "Visiteurs", value: visitors, Icon: BarChart3 },
  ];

  return <div className="pb-8 font-[var(--font-inter)] sm:pb-16">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-black/35"><CalendarDays size={14} />Récap mensuel</div><h1 className="mt-3 font-serif text-[27px] capitalize leading-tight tracking-[-0.05em] sm:text-[32px]">{monthLabel}</h1><p className="mt-2 max-w-2xl text-[13px] font-medium leading-5 text-black/55 sm:text-[14px]">Tout ce qui a évolué sur {project.name}, regroupé dans un bilan clair et envoyé automatiquement par email.</p></div><span className={`${enabled && ready ? "bg-[#e7f8ef] text-[#24743a]" : "bg-[#f2f2f2] text-black/45"} flex h-8 w-fit items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold`}>{enabled && ready ? <Check size={12} /> : null}{enabled && ready ? "Envoi actif" : "Envoi inactif"}</span></header>

    <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(({ label, value, Icon }) => <div key={label} className="rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-4 shadow-[inset_0_0_0_2px_rgba(255,255,255,.3)] sm:p-5"><span className="grid size-8 place-items-center rounded-[8px] bg-white text-black/40 shadow-sm"><Icon size={15} /></span><p className="mt-5 font-serif text-[28px] sm:text-[32px]">{value}</p><p className="mt-1 text-[10px] font-medium text-black/40 sm:text-[11px]">{label}</p></div>)}</div>
    <p className="mt-2 text-[10px] text-black/40"><strong className="font-semibold text-black/55">{visitors} visiteur(s) unique(s)</strong> · {pageViews} vue(s) de pages. Une personne reste comptée une seule fois même si elle consulte plusieurs pages.</p>

    <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
      <section className="overflow-hidden rounded-[14px] border border-[#e8ecee] bg-white"><div className="flex items-center justify-between border-b border-black/[0.07] px-4 py-4 sm:px-5"><div><h2 className="font-serif text-[22px]">Activité du mois</h2><p className="mt-1 text-[10px] text-black/40">Les créations et publications sont enregistrées à partir de maintenant.</p></div><span className="text-[10px] text-black/35">{initialEvents.length} événement(s)</span></div>{initialEvents.length ? <div>{initialEvents.map((event) => <div key={event.id} className="flex min-h-16 items-center gap-3 border-b border-black/[0.06] px-4 py-3 last:border-0 sm:px-5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f4f4f4]"><FileText size={14} /></span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium sm:text-[13px]">{event.entity_title}</p><p className="mt-0.5 text-[10px] text-black/40">{eventLabels[event.event_type]}</p></div><time className="shrink-0 text-[9px] text-black/35">{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(event.created_at))}</time></div>)}</div> : <div className="grid min-h-44 place-items-center px-6 text-center"><div><span className="mx-auto grid size-10 place-items-center rounded-full bg-[#f5f5f5] text-black/30"><CalendarDays size={17} /></span><p className="mt-3 text-[12px] text-black/40">Aucune nouvelle activité enregistrée ce mois-ci.</p></div></div>}</section>

      <section className="rounded-[14px] border border-[#e8ecee] bg-[#f9f9f9] p-4 sm:p-5"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-white shadow-sm"><Mail size={16} /></span><div><h2 className="text-[14px] font-semibold">Envoi automatique</h2><p className="mt-1 text-[11px] leading-5 text-black/45">Le bilan du mois précédent est envoyé au début de chaque nouveau mois.</p></div></div><form onSubmit={saveSettings} className="mt-5"><label htmlFor="recap-email" className="text-[10px] font-semibold text-black/55">Adresse destinataire</label><input id="recap-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="client@exemple.fr" className="mt-2 h-11 w-full rounded-[9px] border border-black/10 bg-white px-3 text-[12px] outline-none focus:border-black/30" /><label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-[9px] border border-black/[0.07] bg-white px-3 py-3"><span><strong className="block text-[11px] font-semibold">Envoyer chaque mois</strong><span className="mt-0.5 block text-[9px] text-black/35">Un seul email par projet et par période.</span></span><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="size-4 accent-black" /></label><button type="submit" disabled={!ready || saving || !email.trim()} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-[#222] text-[12px] font-semibold text-white disabled:opacity-40">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}{saving ? "Enregistrement…" : "Enregistrer"}</button></form>{message ? <p aria-live="polite" className="mt-3 text-[10px] leading-4 text-black/45">{message}</p> : null}</section>
    </div>

    <section className="mt-7"><div className="mb-4 px-1"><div className="flex items-center gap-2"><MonitorPlay size={17} className="text-black/35" /><h2 className="font-serif text-[22px]">Vidéo du mois</h2></div><p className="mt-1 text-[10px] text-black/40">Un récap animé construit avec les données réelles du projet.</p></div><MonthlyRecapVideo data={data} counts={counts} monthLabel={monthLabel} previewUrl={previewUrl} /></section>

    {initialDeliveries.length ? <section className="mt-7"><h2 className="font-serif text-[21px]">Derniers envois</h2><div className="mt-3 flex flex-wrap gap-2">{initialDeliveries.map((delivery) => <span key={delivery.id} className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[9px] text-black/45">{new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${delivery.period_start}T12:00:00Z`))} · {delivery.status === "sent" ? "Envoyé" : delivery.status === "processing" ? "En cours" : "Échec"}</span>)}</div></section> : null}
  </div>;
}
