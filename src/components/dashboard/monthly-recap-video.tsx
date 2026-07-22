"use client";

import Image from "next/image";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DashboardProject, MonthlyRecapData } from "@/components/dashboard/dashboard-shell";

type RecapScene = {
  id: string;
  value?: string;
  label?: string;
  image?: string;
  imageAlt?: string;
  kind?: "intro" | "preview" | "stat";
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function MonthlyRecapVideo({ project, data, counts, monthLabel }: {
  project: DashboardProject;
  data: MonthlyRecapData;
  counts: { pages: number; articles: number; realisations: number; total: number };
  monthLabel: string;
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const conversionRate = data.visitors ? (data.contacts / data.visitors) * 100 : 0;
  const growth = data.previousVisitors ? ((data.visitors - data.previousVisitors) / data.previousVisitors) * 100 : data.visitors ? 100 : 0;
  const homePage = project.pages.find((page) => page.slug === "/") ?? project.pages[0];
  const previewUrl = project.publishedSlug && homePage
    ? `/published/${project.publishedSlug}?preview=dashboard`
    : null;

  const scenes = useMemo<RecapScene[]>(() => [
    { id: "intro", kind: "intro" },
    { id: "preview", kind: "preview" },
    { id: "visitors", kind: "stat", value: formatNumber(data.visitors), label: "visiteurs uniques", image: "/images/monthly-recap/stat-07.png", imageAlt: "Carte et repères végétaux" },
    { id: "views", kind: "stat", value: formatNumber(data.pageViews), label: "pages consultées", image: "/images/monthly-recap/stat-02.png", imageAlt: "Interaction avec une page" },
    { id: "contacts", kind: "stat", value: formatNumber(data.contacts), label: "prises de contact", image: "/images/monthly-recap/stat-04.png", imageAlt: "Boîte aux lettres et enveloppe" },
    { id: "conversion", kind: "stat", value: `${conversionRate.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`, label: "de conversion", image: "/images/monthly-recap/stat-01.png", imageAlt: "Croissance de personnes en fleurs" },
    { id: "impressions", kind: "stat", value: formatNumber(data.articleImpressions), label: "impressions des articles", image: "/images/monthly-recap/stat-05.png", imageAlt: "Article mis en lumière" },
    { id: "articles", kind: "stat", value: formatNumber(counts.articles), label: "articles créés", image: "/images/monthly-recap/stat-06.png", imageAlt: "Article et jeune pousse" },
    { id: "realisations", kind: "stat", value: formatNumber(counts.realisations), label: "réalisations ajoutées", image: "/images/monthly-recap/stat-03.png", imageAlt: "Album de réalisations paysagères" },
    { id: "growth", kind: "stat", value: `${growth >= 0 ? "+" : ""}${growth.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`, label: "de visiteurs vs mois dernier", image: "/images/monthly-recap/stat-08.png", imageAlt: "Deux plantes illustrant la croissance" },
  ], [counts.articles, counts.realisations, conversionRate, data.articleImpressions, data.contacts, data.pageViews, data.visitors, growth]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setSceneIndex((current) => (current + 1) % scenes.length), sceneIndex < 2 ? 5000 : 3900);
    return () => window.clearTimeout(timer);
  }, [playing, sceneIndex, scenes.length]);

  const scene = scenes[sceneIndex];

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e8ecee] bg-[#fafafa]">
      <div className="relative aspect-video min-h-[310px] w-full overflow-hidden bg-[#fafafa] sm:min-h-0">
        <div className="recap-aurora absolute inset-0 opacity-50" />

        <div key={scene.id} className="recap-scene absolute inset-0">
          {scene.kind === "intro" ? (
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
              <p className="font-serif text-[clamp(36px,6.8vw,92px)] leading-[.95] tracking-[-0.055em] text-[#036e89]">Votre récap</p>
              <p className="mt-5 font-serif text-[clamp(20px,3vw,42px)] capitalize leading-none text-[#797979]">{monthLabel}</p>
              <p className="mt-6 max-w-xl text-[11px] font-semibold uppercase tracking-[.14em] text-black/35">{project.name}</p>
            </div>
          ) : null}

          {scene.kind === "preview" ? (
            <div className="absolute inset-0">
              <div className="absolute left-[4%] top-[14%] z-20 h-[43%] w-[12%] bg-gradient-to-r from-[#fafafa] to-transparent" />
              <div className="recap-site-frame absolute left-[26%] top-[8%] h-[118%] w-[68%] origin-top-left overflow-hidden rounded-[12px] bg-white shadow-[-40px_160px_80px_rgba(0,0,0,.08)] [transform:skewX(-13.5deg)] sm:left-[22%] sm:w-[66%]">
                <div className="recap-site-scroll h-[620%] w-[152%] origin-top-left [transform:skewX(13.5deg)_translateX(-9%)]">
                  {previewUrl ? <iframe src={previewUrl} title={`Aperçu de ${project.name}`} tabIndex={-1} className="pointer-events-none h-full w-full border-0 bg-white" /> : <div className="h-full w-full bg-[url('/dashboard-site-preview.png')] bg-[length:100%_auto] bg-top bg-no-repeat" />}
                </div>
              </div>
            </div>
          ) : null}

          {scene.kind === "stat" ? (
            <div className="relative z-10 grid h-full grid-cols-[minmax(0,.9fr)_minmax(120px,1.1fr)] items-center px-[7%] sm:grid-cols-[minmax(300px,.9fr)_minmax(360px,1.1fr)] sm:px-[9%]">
              <div className="min-w-0">
                <p className="font-serif text-[clamp(52px,10vw,136px)] leading-none tracking-[-0.065em] text-[#036e89]">{scene.value}</p>
                <p className="mt-[clamp(14px,3vw,42px)] max-w-[560px] font-serif text-[clamp(20px,3.2vw,43px)] leading-[1.05] tracking-[-0.035em] text-[#797979]">{scene.label}</p>
              </div>
              <div className="relative h-[78%] w-full">
                {scene.image ? <Image src={scene.image} alt={scene.imageAlt ?? ""} fill sizes="(max-width: 768px) 48vw, 55vw" className="object-contain object-center" priority={sceneIndex < 4} /> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-black/[0.06] bg-white px-4 py-3 sm:px-5">
        <button type="button" onClick={() => setPlaying((current) => !current)} className="grid size-9 shrink-0 place-items-center rounded-full bg-[#222] text-white" aria-label={playing ? "Mettre en pause" : "Lire le récap"}>{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</button>
        <div className="flex min-w-0 flex-1 gap-1.5" aria-label={`Scène ${sceneIndex + 1} sur ${scenes.length}`}>
          {scenes.map((item, index) => <button key={item.id} type="button" onClick={() => setSceneIndex(index)} className={`${index === sceneIndex ? "bg-[#036e89]" : "bg-black/10 hover:bg-black/20"} h-1.5 min-w-1 flex-1 rounded-full transition-colors`} aria-label={`Afficher la scène ${index + 1}`} />)}
        </div>
        <button type="button" onClick={() => { setSceneIndex(0); setPlaying(true); }} className="grid size-9 shrink-0 place-items-center rounded-full border border-black/10 text-black/45 hover:text-black" aria-label="Rejouer"><RotateCcw size={14} /></button>
      </div>
    </div>
  );
}
