"use client";

import Image from "next/image";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MonthlyRecapData } from "@/components/dashboard/dashboard-shell";

type RecapScene = {
  id: string;
  duration: number;
  value?: string;
  accent?: string;
  label?: string;
  image?: string;
  imageAlt?: string;
  kind: "intro" | "preview" | "stat";
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `0:${String(seconds).padStart(2, "0")}`;
}

export function MonthlyRecapVideo({ data, counts, monthLabel }: {
  data: MonthlyRecapData;
  counts: { pages: number; articles: number; realisations: number; total: number };
  monthLabel: string;
}) {
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const previousFrameRef = useRef<number | null>(null);
  const conversionRate = data.visitors ? (data.contacts / data.visitors) * 100 : 0;
  const growth = data.previousVisitors ? ((data.visitors - data.previousVisitors) / data.previousVisitors) * 100 : data.visitors ? 100 : 0;

  const scenes = useMemo<RecapScene[]>(() => [
    { id: "intro", kind: "intro", duration: 1250 },
    { id: "preview", kind: "preview", duration: 6400 },
    { id: "visitors", kind: "stat", duration: 2900, value: formatNumber(data.visitors), label: "visiteurs uniques", image: "/images/monthly-recap/stat-07.png", imageAlt: "Carte et repères végétaux" },
    { id: "views", kind: "stat", duration: 2900, value: formatNumber(data.pageViews), label: "pages consultées", image: "/images/monthly-recap/stat-02.png", imageAlt: "Interaction avec une page" },
    { id: "contacts", kind: "stat", duration: 2900, value: formatNumber(data.contacts), label: "prises de contact", image: "/images/monthly-recap/stat-04.png", imageAlt: "Boîte aux lettres et enveloppe" },
    { id: "conversion", kind: "stat", duration: 2900, value: `${conversionRate.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`, label: "de conversion", image: "/images/monthly-recap/stat-01.png", imageAlt: "Croissance de personnes en fleurs" },
    { id: "impressions", kind: "stat", duration: 2900, value: formatNumber(data.articleImpressions), label: "impressions des articles", image: "/images/monthly-recap/stat-05.png", imageAlt: "Article mis en lumière" },
    { id: "articles", kind: "stat", duration: 2900, value: formatNumber(counts.articles), label: "articles créés", image: "/images/monthly-recap/stat-06.png", imageAlt: "Article et jeune pousse" },
    { id: "realisations", kind: "stat", duration: 2900, value: formatNumber(counts.realisations), label: "réalisations ajoutées", image: "/images/monthly-recap/stat-03.png", imageAlt: "Album de réalisations paysagères" },
    { id: "growth", kind: "stat", duration: 3600, accent: growth >= 0 ? "+" : "−", value: `${Math.abs(growth).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`, label: "de visiteurs vs mois dernier", image: "/images/monthly-recap/stat-08.png", imageAlt: "Deux plantes illustrant la croissance" },
  ], [counts.articles, counts.realisations, conversionRate, data.articleImpressions, data.contacts, data.pageViews, data.visitors, growth]);
  const totalDuration = useMemo(() => scenes.reduce((total, scene) => total + scene.duration, 0), [scenes]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    if (!playing) {
      previousFrameRef.current = null;
      return;
    }
    let frame = 0;
    const tick = (timestamp: number) => {
      const previous = previousFrameRef.current ?? timestamp;
      previousFrameRef.current = timestamp;
      const next = elapsedRef.current + Math.min(timestamp - previous, 100);
      if (next >= totalDuration) {
        elapsedRef.current = totalDuration;
        setElapsed(totalDuration);
        setPlaying(false);
        previousFrameRef.current = null;
        return;
      }
      elapsedRef.current = next;
      setElapsed(next);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, totalDuration]);

  function seek(next: number) {
    elapsedRef.current = next;
    setElapsed(next);
    previousFrameRef.current = null;
  }

  function restart() {
    seek(0);
    setPlaying(true);
  }

  let cursor = 0;
  const timedScenes = scenes.map((scene) => {
    const start = cursor;
    cursor += scene.duration;
    return { scene, start, end: cursor };
  });

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e8ecee] bg-[#fafafa]">
      <div className="relative aspect-video min-h-[310px] w-full overflow-hidden bg-[#fafafa] sm:min-h-0">
        {timedScenes.map(({ scene, start, end }, index) => {
          const enter = clamp((elapsed - start) / 280);
          const exit = clamp((end - elapsed) / 240);
          const visibility = Math.min(enter, exit);
          const translateY = enter < 1 ? (1 - enter) * 110 : exit < 1 ? -(1 - exit) * 24 : 0;
          const localProgress = clamp((elapsed - start) / scene.duration);
          const visible = elapsed >= start - 300 && elapsed <= end + 300;
          if (!visible) return null;

          return (
            <div key={scene.id} className="absolute inset-0 z-10 will-change-transform" style={{ opacity: visibility, transform: `translate3d(0, ${translateY}px, 0)` }} aria-hidden={visibility < 0.5}>
              {scene.kind === "intro" ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <p className="font-serif text-[clamp(36px,6.8vw,92px)] leading-[.95] tracking-[-0.055em] text-[#036e89]">Votre récap</p>
                  <p className="mt-5 font-serif text-[clamp(20px,3vw,42px)] capitalize leading-none text-[#797979]">{monthLabel}</p>
                </div>
              ) : null}

              {scene.kind === "preview" ? (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute left-[4%] top-[14%] z-20 h-[43%] w-[12%] bg-gradient-to-r from-[#fafafa] to-transparent" />
                  <div className="absolute left-[24%] top-[9%] h-[610%] w-[66%] origin-top-left overflow-hidden rounded-[12px] bg-white bg-[url('/dashboard-site-preview.png')] bg-[length:100%_auto] bg-top bg-no-repeat shadow-[-40px_160px_80px_rgba(0,0,0,.10)] will-change-transform" style={{ transform: `translate3d(0, ${-82 * localProgress}%, 0) skewX(-13.5deg)` }}>
                  </div>
                </div>
              ) : null}

              {scene.kind === "stat" ? (
                <div className="grid h-full grid-cols-[minmax(0,.9fr)_minmax(120px,1.1fr)] items-center px-[7%] sm:grid-cols-[minmax(300px,.9fr)_minmax(360px,1.1fr)] sm:px-[9%]">
                  <div className="min-w-0">
                    <p className="font-serif text-[clamp(52px,10vw,136px)] leading-none tracking-[-0.065em] text-[#797979]">{scene.accent ? <span className="text-[#036e89]">{scene.accent}</span> : null}{scene.value}</p>
                    <p className="mt-[clamp(14px,3vw,42px)] max-w-[560px] font-serif text-[clamp(20px,3.2vw,43px)] leading-[1.05] tracking-[-0.035em] text-[#797979]">{scene.label}</p>
                  </div>
                  <div className="relative h-[78%] w-full">
                    {scene.image ? <Image src={scene.image} alt={scene.imageAlt ?? ""} fill sizes="(max-width: 768px) 48vw, 55vw" className="object-contain object-center" priority={index < 4} /> : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {elapsed < scenes[0].duration + scenes[1].duration ? <div className="recap-aurora pointer-events-none absolute inset-0 z-20 opacity-50" /> : null}
      </div>

      <div className="flex items-center gap-3 border-t border-black/[0.06] bg-white px-4 py-3 sm:px-5">
        <button type="button" onClick={() => elapsed >= totalDuration ? restart() : setPlaying((current) => !current)} className="grid size-9 shrink-0 place-items-center rounded-full bg-[#222] text-white" aria-label={playing ? "Mettre en pause" : "Lire le récap"}>{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</button>
        <span className="w-9 text-right text-[9px] font-medium tabular-nums text-black/40">{formatTime(elapsed)}</span>
        <input type="range" min={0} max={totalDuration} step={50} value={elapsed} onChange={(event) => seek(Number(event.target.value))} aria-label="Progression de la vidéo" className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#036e89]" />
        <span className="w-9 text-[9px] font-medium tabular-nums text-black/40">{formatTime(totalDuration)}</span>
        <button type="button" onClick={restart} className="grid size-9 shrink-0 place-items-center rounded-full border border-black/10 text-black/45 hover:text-black" aria-label="Rejouer"><RotateCcw size={14} /></button>
      </div>
    </div>
  );
}
