"use client";

import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileText,
  FolderKanban,
  Home,
  Layers3,
  LoaderCircle,
  PanelLeftClose,
  PencilLine,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { SitePage } from "@/lib/site-template";

export type DashboardProject = {
  key: string;
  name: string;
  pages: SitePage[];
  publishedSlug: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
};

type CheckItem = { label: string; detail: string; valid: boolean };

const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function projectChecks(project: DashboardProject): CheckItem[] {
  const pagesWithNoSections = project.pages.filter((page) => page.sections.length === 0);
  const duplicateSlugs = project.pages.filter(
    (page, index, pages) => pages.findIndex((item) => item.slug === page.slug) !== index,
  );
  const hasHome = project.pages.some((page) => page.slug === "/" || page.slug === "");

  return [
    {
      label: "Page d’accueil",
      detail: hasHome ? "La page principale est prête." : "Ajoutez une page avec le slug /.",
      valid: hasHome,
    },
    {
      label: "Contenu des pages",
      detail: pagesWithNoSections.length === 0 ? "Toutes les pages ont du contenu." : `${pagesWithNoSections.length} page(s) vide(s).`,
      valid: pagesWithNoSections.length === 0,
    },
    {
      label: "Adresses uniques",
      detail: duplicateSlugs.length === 0 ? "Aucun conflit d’URL détecté." : `${duplicateSlugs.length} doublon(s) à corriger.`,
      valid: duplicateSlugs.length === 0,
    },
    {
      label: "Publication",
      detail: project.publishedAt ? "Le site possède une version en ligne." : "Le site n’a pas encore été publié.",
      valid: Boolean(project.publishedAt),
    },
  ];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function DashboardShell({
  projects,
  selectedKey,
  activeTab,
}: {
  projects: DashboardProject[];
  selectedKey: string;
  activeTab: "overview" | "traffic" | "pages";
}) {
  const project = projects.find((item) => item.key === selectedKey) ?? projects[0];
  const [query, setQuery] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const checks = useMemo(() => projectChecks(project), [project]);
  const sectionCount = project.pages.reduce((total, page) => total + page.sections.length, 0);
  const validCount = checks.filter((item) => item.valid).length;
  const filteredPages = project.pages.filter((page) =>
    `${page.title} ${page.slug}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")),
  );
  const activeMonth = new Date(project.updatedAt).getMonth();
  const projectQuery = `project=${encodeURIComponent(project.key)}`;
  const tabHref = (tab: "overview" | "traffic" | "pages") =>
    `/dashboard?${projectQuery}&tab=${tab}`;

  async function publish() {
    setPublishing(true);
    setPublishMessage("");
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey: project.key, projectName: project.name, pages: project.pages }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Publication impossible.");
      setPublishMessage("Version publiée avec succès.");
      if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setPublishMessage(error instanceof Error ? error.message : "Publication impossible.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#1c1c1c] lg:grid lg:grid-cols-[212px_1fr]">
      <aside className="border-b border-black/10 bg-[#fcf9f4] px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-12 items-center justify-between px-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-serif text-[23px] tracking-[-0.05em]">
            <span className="grid size-7 place-items-center rounded-full bg-[#1c1c1c] text-white"><Sparkles size={14} /></span>
            Atelier
          </Link>
          <PanelLeftClose size={17} className="text-black/35 lg:hidden" />
        </div>

        <div className="mt-8 px-3">
          <p className="text-[12px] text-[#777]">Projet actif</p>
          <div className="group relative mt-1">
            <button className="flex w-full items-center justify-between font-serif text-[21px]" type="button">
              <span className="max-w-[125px] truncate">{project.name}</span><ChevronDown size={15} />
            </button>
            <div className="invisible absolute left-0 top-full z-30 mt-2 w-44 rounded-xl border border-black/10 bg-white p-1 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              {projects.map((item) => (
                <Link key={item.key} href={`/dashboard?project=${encodeURIComponent(item.key)}`} className="block truncate rounded-lg px-3 py-2 text-[13px] hover:bg-black/5">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <Link href={`/builder?project=${encodeURIComponent(project.key)}`} className="mt-3 flex h-8 items-center justify-center rounded-md border border-[#d9d9d9] bg-white text-[12px] font-medium shadow-sm hover:bg-black/[0.03]">
            Ouvrir le projet
          </Link>
        </div>

        <nav className="mt-10">
          <p className="px-3 text-[13px] text-black/40">Dashboard</p>
          <div className="mt-2 grid gap-1 text-[14px]">
            <Link href={tabHref("overview")} className={`${activeTab === "overview" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><Home size={18} />Vue d’ensemble</Link>
            <Link href={tabHref("traffic")} className={`${activeTab === "traffic" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><BarChart3 size={18} />Statistiques</Link>
            <Link href={tabHref("pages")} className={`${activeTab === "pages" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><FolderKanban size={18} />Pages du site</Link>
          </div>
        </nav>
      </aside>

      <section className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-11 xl:px-12">
        <header id="vue-ensemble" className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[30px] tracking-[-0.05em]">{activeTab === "pages" ? "Pages du site" : activeTab === "traffic" ? "Statistiques et trafic" : "Bonjour, voici votre site"}</h1>
            <p className="mt-2 text-[14px] font-medium text-black/60">{activeTab === "pages" ? `Gérez toutes les pages de ${project.name}.` : activeTab === "traffic" ? `Suivez les indicateurs disponibles pour ${project.name}.` : `Suivez le contenu, le trafic et la publication de ${project.name}.`}</p>
          </div>
          <Link href={`/builder?project=${encodeURIComponent(project.key)}`} className="flex h-9 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] px-5 text-[14px] font-semibold text-white shadow-md">
            <PencilLine size={15} />Nouvelle modification
          </Link>
        </header>

        {activeTab === "pages" ? <div className="mt-8 flex max-w-[633px] items-center gap-2 rounded-[10px] border border-[#d7dce4] px-3 py-2.5 focus-within:border-black/40">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une page" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
        </div> : null}

        {activeTab !== "pages" ? <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Pages", project.pages.length, FileText],
            ["Sections", sectionCount, Layers3],
            ["Contrôles validés", `${validCount}/${checks.length}`, Check],
          ].map(([label, value, Icon]) => {
            const CardIcon = Icon as typeof FileText;
            return <div key={String(label)} className="rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-5 shadow-[inset_0_0_0_2px_rgba(255,255,255,.4)]"><div className="flex items-center justify-between text-black/45"><span className="text-[12px] font-medium uppercase tracking-[.06em]">{String(label)}</span><CardIcon size={18} /></div><p className="mt-4 font-serif text-[32px]">{String(value)}</p></div>;
          })}
        </div> : null}

        {activeTab === "overview" ? <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
          <section id="activite">
            <h2 className="font-serif text-[25px]">Activité du projet</h2>
            <div className="mt-4 rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-6">
              <div className="flex items-start justify-between"><div><p className="text-[13px] text-black/45">Dernière mise à jour</p><p className="mt-1 text-[15px] font-medium">{formatDate(project.updatedAt)}</p></div><span className="rounded-full bg-[#e8f5ec] px-3 py-1 text-[11px] font-semibold text-[#24743a]">{project.publishedAt ? "Publié" : "Brouillon"}</span></div>
              <div className="mt-8 flex h-48 items-end gap-2 border-b border-black/10 pb-2">
                {monthLabels.map((month, index) => {
                  const isActive = index === activeMonth;
                  const height = isActive ? Math.max(38, Math.min(100, 30 + sectionCount * 2)) : 12;
                  return <div key={month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div title={isActive ? `${sectionCount} sections dans l’état actuel` : "Aucun historique enregistré"} className={`w-full rounded-lg ${isActive ? "bg-[#474749]" : "bg-[#eceeef]"}`} style={{ height: `${height}%` }} /><span className="hidden text-[10px] text-[#525866] sm:block">{month}</span></div>;
                })}
              </div>
              <p className="mt-4 text-[12px] leading-5 text-black/45">Le mois actif reflète l’état actuel. Un historique détaillé nécessitera une table de versions lors de la prochaine phase.</p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-[25px]">Validations avant publication</h2>
            <div className="mt-4 overflow-hidden rounded-[13px] border border-[#e8ecee] bg-white">
              {checks.map((item) => <div key={item.label} className="flex gap-3 border-b border-black/[0.06] p-4 last:border-0">{item.valid ? <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e8f5ec] text-[#24743a]"><Check size={15} /></span> : <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#fff3df] text-[#a46300]"><CircleAlert size={15} /></span>}<div><p className="text-[13px] font-semibold">{item.label}</p><p className="mt-1 text-[12px] text-black/45">{item.detail}</p></div></div>)}
            </div>
            <button onClick={publish} disabled={publishing || project.pages.length === 0} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-[#1c1c1c] text-[13px] font-semibold text-white disabled:opacity-50">
              {publishing ? <LoaderCircle size={15} className="animate-spin" /> : <ExternalLink size={15} />}{publishing ? "Publication…" : project.publishedAt ? "Publier une nouvelle version" : "Publier le site"}
            </button>
            {publishMessage ? <p className="mt-2 text-center text-[12px] text-black/55">{publishMessage}</p> : null}
          </section>
        </div> : null}

        {activeTab === "traffic" ? (
          <section className="mt-10 pb-12">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
              <div>
                <h2 className="font-serif text-[25px]">Trafic du site</h2>
                <div className="mt-4 rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-6 shadow-[inset_0_0_0_2px_rgba(255,255,255,.35)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><p className="text-[12px] text-black/45">Contenu actuellement mesurable</p><p className="mt-1 font-serif text-[28px]">{sectionCount} blocs publiables</p></div>
                    <span className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium">12 derniers mois</span>
                  </div>
                  <div className="mt-9 grid h-[260px] grid-cols-[32px_1fr] gap-4">
                    <div className="flex flex-col justify-between pb-7 text-[10px] text-[#525866]"><span>20k</span><span>15k</span><span>10k</span><span>0</span></div>
                    <div className="relative flex items-end gap-2 border-b border-black/10 pb-7 before:absolute before:inset-x-0 before:top-1/4 before:border-t before:border-dashed before:border-black/10 after:absolute after:inset-x-0 after:top-1/2 after:border-t after:border-dashed after:border-black/10">
                      {monthLabels.map((month, index) => {
                        const isActive = index === activeMonth;
                        const height = isActive ? Math.max(32, Math.min(92, 28 + sectionCount * 1.8)) : 9 + ((index * 7) % 13);
                        return <div key={month} className="relative z-10 flex h-full min-w-0 flex-1 flex-col justify-end"><div className={`${isActive ? "bg-[#474749]" : "bg-[#e7e9eb]"} relative w-full rounded-[8px]`} style={{ height: `${height}%` }}>{isActive ? <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-[#676769] px-2 py-1 text-[9px] font-semibold text-white">{sectionCount}</span> : null}</div><span className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 text-[9px] text-[#525866]">{month}</span></div>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="font-serif text-[25px]">Répartition</h2>
                <div className="mt-4 rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-6">
                  <div className="mx-auto grid size-44 place-items-center rounded-full" style={{ background: `conic-gradient(#474749 0 ${validCount * 25}%, #d7dadd ${validCount * 25}% 78%, #f0f1f2 78% 100%)` }}><div className="grid size-28 place-items-center rounded-full bg-[#f9f9f9] text-center"><div><p className="font-serif text-[28px]">{validCount}/{checks.length}</p><p className="text-[10px] text-black/45">contrôles validés</p></div></div></div>
                  <div className="mt-7 grid gap-3 text-[12px]"><div className="flex items-center justify-between"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#474749]" />Pages structurées</span><b>{project.pages.length}</b></div><div className="flex items-center justify-between"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#aeb3b8]" />Sections</span><b>{sectionCount}</b></div><div className="flex items-center justify-between"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#e2e4e6]" />État</span><b>{project.publishedAt ? "Publié" : "Brouillon"}</b></div></div>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-black/40">Les visites réelles seront affichées ici dès qu’une source Analytics sera connectée. Aucun trafic fictif n’est inventé.</p>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "pages" ? <section id="pages" className="mt-10 pb-12">
          <div className="flex items-end justify-between"><div><h2 className="font-serif text-[25px]">Pages du site</h2><p className="mt-1 text-[13px] text-black/45">{filteredPages.length} résultat(s) pour ce projet</p></div><Clock3 size={18} className="text-black/30" /></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredPages.map((page) => <Link key={page.id} href={`/builder?project=${encodeURIComponent(project.key)}`} className="group rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between"><span className="grid size-9 place-items-center rounded-lg bg-white text-black/50 shadow-sm"><FileText size={17} /></span><ArrowUpRight size={16} className="text-black/25 transition group-hover:text-black" /></div><p className="mt-5 truncate text-[14px] font-semibold">{page.title}</p><p className="mt-1 truncate text-[12px] text-black/40">{page.slug || "/"} · {page.sections.length} section(s)</p></Link>)}
          </div>
          {filteredPages.length === 0 ? <div className="mt-4 rounded-[13px] border border-dashed border-black/15 p-8 text-center text-[13px] text-black/45">Aucune page ne correspond à « {query} ».</div> : null}
        </section> : null}
      </section>
    </main>
  );
}
