"use client";

import {
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  ChevronsUpDown,
  CircleAlert,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  FolderKanban,
  Home,
  Images,
  Layers3,
  LoaderCircle,
  PencilLine,
  Plus,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SitePage } from "@/lib/site-template";
import type { EditorialPerformanceSnapshot } from "@/lib/editorial-performance";
import { ProjectsLibrary } from "@/components/dashboard/projects-library";

const DeferredPanel = () => <div className="grid min-h-[240px] place-items-center text-[12px] text-black/40"><LoaderCircle size={18} className="animate-spin" /></div>;
const CmsEditor = dynamic(() => import("@/components/dashboard/cms-editor").then((module) => module.CmsEditor), { loading: DeferredPanel });
const ProjectSettings = dynamic(() => import("@/components/dashboard/project-settings").then((module) => module.ProjectSettings), { loading: DeferredPanel });
const AssetLibrary = dynamic(() => import("@/components/dashboard/asset-library").then((module) => module.AssetLibrary), { loading: DeferredPanel });
const GlobalSectionsEditor = dynamic(() => import("@/components/dashboard/global-sections-editor").then((module) => module.GlobalSectionsEditor), { loading: DeferredPanel });
const AiAgents = dynamic(() => import("@/components/dashboard/ai-agents").then((module) => module.AiAgents), { loading: DeferredPanel });
const MonthlyRecap = dynamic(() => import("@/components/dashboard/monthly-recap").then((module) => module.MonthlyRecap), { loading: DeferredPanel });
const AnalyticsDashboard = dynamic(() => import("@/components/dashboard/analytics-dashboard").then((module) => module.AnalyticsDashboard), { loading: DeferredPanel });

export type DashboardTab = "projects" | "overview" | "traffic" | "pages" | "cms" | "assets" | "ai" | "recap" | "settings";

export type MonthlyRecapEvent = { id: string; event_type: "page_created" | "article_created" | "realisation_created" | "project_published"; entity_title: string; created_at: string };
export type MonthlyRecapSettings = { recipient_email: string; enabled: boolean; send_day: number };
export type MonthlyRecapDelivery = { id: string; period_start: string; status: "processing" | "sent" | "failed"; created_at: string };
export type MonthlyRecapData = {
  settings: MonthlyRecapSettings | null;
  events: MonthlyRecapEvent[];
  deliveries: MonthlyRecapDelivery[];
  visitors: number;
  previousVisitors: number;
  contacts: number;
  previousContacts: number;
  pageViews: number;
  articleImpressions: number;
  ready: boolean;
  defaultEmail: string;
};
export type ProjectAnalyticsConnection = { ga_property_id: string; ga_measurement_id: string; gsc_site_url: string; updated_at: string };

export type DashboardProject = {
  key: string;
  ownerId: string;
  role: "admin" | "collaborator";
  name: string;
  pages: SitePage[];
  publishedSlug: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
};

export type DashboardInvitation = {
  id: string;
  email: string | null;
  token: string;
  status: "pending" | "accepted";
  accepted_user_id: string | null;
  created_at: string;
  accepted_at: string | null;
};

export type DashboardAsset = {
  id: string;
  public_url: string;
  original_name: string;
  title: string;
  alt_text: string;
  ai_generated: boolean;
  created_at: string;
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

function ProjectPreviewCard({ project }: { project: DashboardProject }) {
  const homePage = project.pages.find((page) => page.slug === "/") ?? project.pages[0];
  const sidePages = project.pages.filter((page) => page.id !== homePage?.id);
  const previews = [sidePages[0] ?? homePage, homePage, sidePages[1] ?? sidePages[0] ?? homePage];
  const previewUrl = (page: SitePage | undefined) => {
    if (!project.publishedSlug || !page) return null;
    const path = page.slug === "/" ? "" : page.slug.startsWith("/") ? page.slug : `/${page.slug}`;
    return `/published/${project.publishedSlug}${path}?preview=dashboard`;
  };

  return (
    <Link href={`/builder?project=${encodeURIComponent(project.key)}`} className="group relative mt-8 block h-[320px] w-full max-w-[564px] overflow-hidden rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] shadow-[inset_0_0_0_2px_rgba(255,255,255,.29)] sm:h-[428px]" aria-label={`Ouvrir le builder de ${project.name}`}>
      {previews.map((page, index) => {
        const url = previewUrl(page);
        const placement = index === 0 ? "hidden sm:block sm:-left-[210px] sm:top-[172px] sm:z-[1]" : index === 1 ? "left-[calc(50%_-_198px)] top-[30px] z-10 shadow-[-54px_218px_90px_rgba(0,0,0,.01),-30px_122px_76px_rgba(0,0,0,.05),-13px_54px_56px_rgba(0,0,0,.09),-3px_14px_31px_rgba(0,0,0,.10)] sm:left-[82px] sm:top-[48px]" : "hidden sm:block sm:left-[420px] sm:top-[112px] sm:z-[2]";
        return <div key={`${page?.id ?? "fallback"}-${index}`} className={`pointer-events-none absolute h-[365px] w-[396px] origin-top-left overflow-hidden rounded-[7px] bg-white [transform:skewX(14deg)] transition-transform duration-500 group-hover:[transform:skewX(14deg)_translateY(-4px)] ${placement}`}><div className="h-[3466px] w-[1800px] origin-top-left [transform:scale(.22)]">{url ? <iframe src={url} title={`Aperçu ${page?.title ?? project.name}`} loading="lazy" tabIndex={-1} className="h-[3466px] w-[1800px] border-0 bg-white" /> : <div className="h-[3466px] w-[1800px] bg-[url('/dashboard-site-preview.png')] bg-[length:1800px_auto] bg-top bg-no-repeat" />}</div></div>;
      })}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[138px] bg-gradient-to-b from-[rgba(250,250,250,.09)] to-[#fafafa]" />
      <span className="absolute bottom-4 left-4 z-20 flex h-11 items-center gap-2 rounded-[11px] border border-black/[0.06] bg-white px-3.5 text-[14px] tracking-[.01em] text-black/70 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md sm:bottom-[19px] sm:left-[23px] sm:h-[45px] sm:gap-3 sm:px-4 sm:text-[16px]">Ouvrir le projet<ArrowUpRight size={20} /></span>
    </Link>
  );
}

function ProjectSelector({
  projects,
  project,
  activeTab,
  placement = "sidebar",
}: {
  projects: DashboardProject[];
  project: DashboardProject;
  activeTab: DashboardTab;
  placement?: "sidebar" | "mobile";
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [createError, setCreateError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) return;

    setSubmitting(true);
    setCreateError("");
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const result = (await response.json()) as { projectKey?: string; error?: string };
    setSubmitting(false);

    if (!response.ok || !result.projectKey) {
      setCreateError(result.error ?? "Création impossible.");
      return;
    }

    setOpen(false);
    router.push(`/dashboard?project=${encodeURIComponent(result.projectKey)}&tab=${activeTab}`);
    router.refresh();
  }

  return (
      <div ref={menuRef} className="relative min-w-0 flex-1 font-[var(--font-inter)]">
        <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="menu" className={`${placement === "mobile" ? "h-11 w-full px-3" : "h-12 w-full px-2"} flex min-w-0 items-center gap-2 rounded-[9px] text-[13px] font-semibold text-[#191919] hover:bg-black/[0.04]`}>
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-black text-white"><Sparkles size={10} /></span>
          <span className="truncate">{project.name}</span>
          <ChevronsUpDown size={15} className="ml-auto shrink-0 text-black/55" />
        </button>

        {open ? <div role="menu" className={`${placement === "mobile" ? "fixed inset-x-3 bottom-[calc(112px+env(safe-area-inset-bottom))]" : "absolute left-0 top-[calc(100%+7px)] w-[260px]"} z-[120] overflow-hidden rounded-[12px] border border-black/10 bg-white p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.14)]`}>
          <div className="max-h-60 overflow-y-auto">
            {projects.map((item) => <Link prefetch={false} role="menuitem" key={item.key} href={`/dashboard?project=${encodeURIComponent(item.key)}&tab=${activeTab}`} onClick={() => setOpen(false)} className={`${item.key === project.key ? "bg-black/[0.055]" : "hover:bg-black/[0.035]"} flex h-10 items-center justify-between gap-3 rounded-[8px] px-3 text-[13px]`}><span className="truncate">{item.name}</span>{item.key === project.key ? <Check size={14} /> : null}</Link>)}
          </div>
          {project.role === "admin" ? <><div className="my-1.5 border-t border-black/[0.08]" />
          {creating ? <form onSubmit={createProject} className="p-1.5">
            <label htmlFor="new-project-name" className="text-[11px] font-medium text-black/55">Nom du nouveau projet</label>
            <input id="new-project-name" autoFocus value={projectName} onChange={(event) => setProjectName(event.target.value)} maxLength={80} placeholder="Ex. Jardin Dupont" className="mt-2 h-9 w-full rounded-[8px] border border-black/10 px-3 text-[13px] outline-none focus:border-black/30" />
            {createError ? <p className="mt-1.5 text-[11px] text-red-600">{createError}</p> : null}
            <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setCreating(false)} className="h-8 px-2 text-[12px] text-black/50">Annuler</button><button type="submit" disabled={!projectName.trim() || submitting} className="h-8 rounded-[8px] bg-black px-3 text-[12px] font-semibold text-white disabled:opacity-40">{submitting ? "Création…" : "Créer"}</button></div>
          </form> : <button type="button" onClick={() => { setCreating(true); setProjectName(""); setCreateError(""); }} className="flex h-10 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[13px] font-medium hover:bg-black/[0.035]"><Plus size={15} />Créer un projet</button>}</> : null}
        </div> : null}
      </div>
  );
}

function MobileDashboardNav({ projects, project, activeTab }: { projects: DashboardProject[]; project: DashboardProject; activeTab: DashboardTab }) {
  const items: Array<[DashboardTab, string, typeof Home]> = [
    ["projects", "Projets", FolderKanban],
    ["overview", "Vue", Home],
    ["traffic", "Stats", BarChart3],
    ["pages", "Pages", FolderKanban],
    ["cms", "CMS", Database],
    ["assets", "Assets", Images],
    ["ai", "IA", Bot],
    ...(project.role === "admin" ? [["recap", "Récap", CalendarDays] as [DashboardTab, string, typeof Home]] : []),
    ...(project.role === "admin" ? [["settings", "Réglages", Settings2] as [DashboardTab, string, typeof Home]] : []),
  ];
  return <nav aria-label="Navigation du dashboard" className="fixed inset-x-0 bottom-0 z-[110] border-t border-black/10 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"><div className="border-b border-black/[0.07] px-2"><ProjectSelector projects={projects} project={project} activeTab={activeTab} placement="mobile" /></div><div className="grid h-16" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>{items.map(([tab, label, Icon]) => <Link prefetch={false} key={tab} href={`/dashboard?project=${encodeURIComponent(project.key)}&tab=${tab}`} aria-current={activeTab === tab ? "page" : undefined} className={`${activeTab === tab ? "text-black" : "text-black/40"} relative flex min-w-0 flex-col items-center justify-center gap-1 text-[9px] font-medium`}>{activeTab === tab ? <span className="absolute top-0 h-0.5 w-7 rounded-full bg-black" /> : null}<Icon size={18} strokeWidth={activeTab === tab ? 2.2 : 1.8} /><span className="max-w-full truncate px-0.5">{label}</span></Link>)}</div></nav>;
}

export function DashboardShell({
  projects,
  selectedKey,
  activeTab,
  invitations,
  assets,
  recap,
  analytics,
  analyticsConnection,
}: {
  projects: DashboardProject[];
  selectedKey: string;
  activeTab: DashboardTab;
  invitations: DashboardInvitation[];
  assets: DashboardAsset[];
  recap: MonthlyRecapData;
  analytics: EditorialPerformanceSnapshot;
  analyticsConnection: ProjectAnalyticsConnection | null;
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
  const tabHref = (tab: DashboardTab) =>
    `/dashboard?${projectQuery}&tab=${tab}`;

  async function publish() {
    setPublishing(true);
    setPublishMessage("");
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey: project.key, projectOwnerId: project.ownerId, projectName: project.name, pages: project.pages }),
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
    <main className={`${activeTab === "cms" ? "fixed inset-0 flex h-dvh flex-col overflow-hidden pb-[calc(108px+env(safe-area-inset-bottom))] lg:grid lg:grid-cols-[212px_minmax(0,1fr)] lg:pb-0" : "min-h-screen pb-[calc(108px+env(safe-area-inset-bottom))] lg:grid lg:grid-cols-[212px_1fr] lg:pb-0"} bg-white text-[#1c1c1c]`}>
      <aside className={`${activeTab === "cms" ? "lg:col-start-1 lg:row-start-1 lg:h-dvh lg:overflow-hidden lg:border-r" : "lg:sticky lg:top-0 lg:col-start-1 lg:row-start-1 lg:h-screen lg:border-r"} hidden border-black/10 bg-[#fcf9f4] px-4 py-4 lg:block`}>
        <ProjectSelector projects={projects} project={project} activeTab={activeTab} />

        {project.role === "admin" ? <div className="mt-8 px-3">
          <Link href={`/builder?project=${encodeURIComponent(project.key)}`} className="flex h-8 items-center justify-center rounded-md border border-[#d9d9d9] bg-white text-[12px] font-medium shadow-sm hover:bg-black/[0.03]">
            Ouvrir le projet
          </Link>
        </div> : null}

        <nav className="mt-8">
          <p className="px-3 text-[13px] text-black/40">Espace</p>
          <div className="mt-2 grid gap-1 text-[14px]">
            <Link prefetch={false} href="/dashboard?tab=projects" className={`${activeTab === "projects" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><FolderKanban size={18} />Projets</Link>
          </div>
        </nav>

        <nav className="mt-8">
          <p className="px-3 text-[13px] text-black/40">Dashboard</p>
          <div className="mt-2 grid gap-1 text-[14px]">
            <Link prefetch={false} href={tabHref("overview")} className={`${activeTab === "overview" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><Home size={18} />Vue d’ensemble</Link>
            <Link prefetch={false} href={tabHref("traffic")} className={`${activeTab === "traffic" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><BarChart3 size={18} />Statistiques</Link>
            <Link prefetch={false} href={tabHref("pages")} className={`${activeTab === "pages" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><FolderKanban size={18} />Pages du site</Link>
            <Link prefetch={false} href={tabHref("cms")} className={`${activeTab === "cms" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><Database size={18} />CMS</Link>
            <Link prefetch={false} href={tabHref("assets")} className={`${activeTab === "assets" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><Images size={18} />Assets</Link>
            <Link prefetch={false} href={tabHref("ai")} className={`${activeTab === "ai" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><Bot size={18} />Agents IA</Link>
            {project.role === "admin" ? <Link prefetch={false} href={tabHref("recap")} className={`${activeTab === "recap" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><CalendarDays size={18} />Récap mensuel</Link> : null}
            {project.role === "admin" ? <Link prefetch={false} href={tabHref("settings")} className={`${activeTab === "settings" ? "relative bg-black/5 before:absolute before:left-0 before:h-4 before:w-1 before:rounded-full before:bg-black" : "hover:bg-black/5"} flex h-8 items-center gap-3 rounded-lg px-3 pl-9`}><Settings2 size={18} />Paramètres</Link> : null}
          </div>
        </nav>
      </aside>

      <section className={activeTab === "cms" ? "min-h-0 min-w-0 flex-1 overflow-hidden lg:col-start-2 lg:row-start-1 lg:h-full" : "min-w-0 px-4 py-7 sm:px-8 lg:col-start-2 lg:row-start-1 lg:px-10 lg:py-11 xl:px-12"}>
        {activeTab === "projects" ? <ProjectsLibrary projects={projects} /> : activeTab === "cms" ? <CmsEditor project={project} canOpenBuilder={project.role === "admin"} /> : activeTab === "assets" ? <AssetLibrary project={project} initialAssets={assets} /> : activeTab === "ai" ? <AiAgents key={`${project.ownerId}:${project.key}`} project={project} initialAnalytics={analytics} /> : activeTab === "recap" ? <MonthlyRecap project={project} data={recap} /> : activeTab === "settings" ? <ProjectSettings project={project} initialInvitations={invitations} initialAnalyticsConnection={analyticsConnection} /> : <>
        {activeTab !== "traffic" ? <header id="vue-ensemble" className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[27px] leading-tight tracking-[-0.05em] sm:text-[30px]">{activeTab === "pages" ? "Pages du site" : "Bonjour, voici votre site"}</h1>
            <p className="mt-2 text-[13px] font-medium leading-5 text-black/60 sm:text-[14px]">{activeTab === "pages" ? `Gérez toutes les pages de ${project.name}.` : `Suivez le contenu, le trafic et la publication de ${project.name}.`}</p>
          </div>
          {project.role === "admin" ? <Link href={`/builder?project=${encodeURIComponent(project.key)}`} className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#323232] to-[#222] px-5 text-[13px] font-semibold text-white shadow-md sm:h-9 sm:w-auto sm:text-[14px]">
            <PencilLine size={15} />Nouvelle modification
          </Link> : null}
        </header> : null}

        {activeTab === "overview" && project.role === "admin" ? <ProjectPreviewCard project={project} /> : null}

        {activeTab === "pages" ? <div className="mt-8 flex max-w-[633px] items-center gap-2 rounded-[10px] border border-[#d7dce4] px-3 py-2.5 focus-within:border-black/40">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une page" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
        </div> : null}

        {activeTab === "overview" ? <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
            <div className="mt-4 rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-4 sm:p-6">
              <div className="flex items-start justify-between"><div><p className="text-[13px] text-black/45">Dernière mise à jour</p><p className="mt-1 text-[15px] font-medium">{formatDate(project.updatedAt)}</p></div><span className="rounded-full bg-[#e8f5ec] px-3 py-1 text-[11px] font-semibold text-[#24743a]">{project.publishedAt ? "Publié" : "Brouillon"}</span></div>
              <div className="mt-8 flex h-48 items-end gap-2 border-b border-black/10 pb-2">
                {monthLabels.map((month, index) => {
                  const isActive = index === activeMonth;
                  const height = isActive ? Math.max(38, Math.min(100, 30 + sectionCount * 2)) : 12;
                  return <div key={month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div title={isActive ? `${sectionCount} sections dans l’état actuel` : "Aucun historique enregistré"} className={`w-full rounded-md sm:rounded-lg ${isActive ? "bg-[#474749]" : "bg-[#eceeef]"}`} style={{ height: `${height}%` }} /><span className="text-[8px] text-[#525866] sm:text-[10px]">{month}</span></div>;
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

        {activeTab === "traffic" ? <AnalyticsDashboard projectKey={project.key} projectOwnerId={project.ownerId} initialData={analytics} gaPropertyId={analyticsConnection?.ga_property_id} /> : null}

        {activeTab === "pages" ? <section id="pages" className="mt-10 pb-12">
          <div className="flex items-end justify-between"><div><h2 className="font-serif text-[25px]">Pages du site</h2><p className="mt-1 text-[13px] text-black/45">{filteredPages.length} résultat(s) pour ce projet</p></div><Clock3 size={18} className="text-black/30" /></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredPages.map((page) => <Link key={page.id} href={`/builder?project=${encodeURIComponent(project.key)}`} className="group rounded-[13px] border border-[#e8ecee] bg-[#f9f9f9] p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between"><span className="grid size-9 place-items-center rounded-lg bg-white text-black/50 shadow-sm"><FileText size={17} /></span><ArrowUpRight size={16} className="text-black/25 transition group-hover:text-black" /></div><p className="mt-5 truncate text-[14px] font-semibold">{page.title}</p><p className="mt-1 truncate text-[12px] text-black/40">{page.slug || "/"} · {page.sections.length} section(s)</p></Link>)}
          </div>
          {filteredPages.length === 0 ? <div className="mt-4 rounded-[13px] border border-dashed border-black/15 p-8 text-center text-[13px] text-black/45">Aucune page ne correspond à « {query} ».</div> : null}
          <GlobalSectionsEditor key={project.key} project={project} initialAssets={assets} />
        </section> : null}
        </>}
      </section>
      <MobileDashboardNav projects={projects} project={project} activeTab={activeTab} />
    </main>
  );
}
