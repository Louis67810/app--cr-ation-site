"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArticleQuiz } from "@/components/article-quiz";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ExternalLink,
  FilePenLine,
  FolderSearch2,
  Grip,
  Images,
  Lightbulb,
  LoaderCircle,
  Plus,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import type { DashboardProject } from "@/components/dashboard/dashboard-shell";
import type {
  ArticleOutline,
  EditorialExecutionMode,
  EditorialMode,
  GeneratedArticle,
  GeneratedQuizPlan,
  ResolvedArticleImage,
  ResearchBrief,
} from "@/lib/editorial-pipeline";
import type {
  EditorialPerformanceSnapshot,
  PagePerformanceMetrics,
} from "@/lib/editorial-performance";
import type {
  ArticleDetailFields,
  EditorialPageStatus,
  SitePage,
} from "@/lib/site-template";

type IdeaMode = "seo" | "youtube" | "trends";
type EditorialIdea = {
  id: string;
  title: string;
  content: string;
  mode: IdeaMode;
  createdAt: string;
  approved: boolean;
};
type OverlayView =
  | "ideas"
  | "idea-form"
  | "idea-detail"
  | "production"
  | "article"
  | "images"
  | "statistics"
  | "research"
  | "outline"
  | "writing"
  | "quiz"
  | null;
type ProductionPhase = "research" | "outline" | "images" | "write";
type ProductionPhaseStatus = "pending" | "running" | "completed" | "error";
type ProductionState = {
  idea: EditorialIdea;
  executionMode: EditorialExecutionMode;
  discoverTopic: boolean;
  statuses: Record<ProductionPhase, ProductionPhaseStatus>;
  research?: ResearchBrief;
  outline?: ArticleOutline;
  images?: ResolvedArticleImage[];
  quizPlan?: GeneratedQuizPlan;
  failedPhase?: ProductionPhase;
  error?: string;
  warning?: string;
  pageId?: string;
};

const ideaModes: Array<{ id: IdeaMode; label: string }> = [
  { id: "seo", label: "Classique" },
  { id: "youtube", label: "YouTube" },
  { id: "trends", label: "Tendance" },
];

function getArticleFields(page: SitePage | null | undefined) {
  const section = page?.sections.find(
    (candidate) => candidate.type === "article-detail",
  );
  return section?.type === "article-detail"
    ? (section.fields as ArticleDetailFields)
    : null;
}

function getArticlePages(pages: SitePage[]) {
  return pages.filter(
    (page) => page.slug.startsWith("/blog/") && page.slug !== "/blog",
  );
}

function getTitle(page: SitePage) {
  return (
    getArticleFields(page)?.title || page.title.replace(/^Article\s*-\s*/i, "")
  );
}

function getStatus(page: SitePage): EditorialPageStatus {
  return page.editorial?.status ?? "pending";
}

function getMode(page: SitePage): IdeaMode {
  const mode = page.editorial?.mode;
  return mode === "youtube" || mode === "trends" ? mode : "seo";
}

function modeLabel(mode: EditorialMode | undefined) {
  return ideaModes.find((item) => item.id === mode)?.label ?? "Classique";
}

function getRelativeDate(raw?: string) {
  if (!raw) return "Date inconnue";
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(raw).getTime()) / 86_400_000),
  );
  if (days === 0) return "Aujourd’hui";
  if (days === 1) return "Il y a 1j";
  return `Il y a ${days}j`;
}

function getHero(page: SitePage) {
  return getArticleFields(page)?.heroImageUrl ?? "";
}

function defaultIdeas(pages: SitePage[]): EditorialIdea[] {
  return getArticlePages(pages)
    .slice(0, 6)
    .map((page, index) => ({
      id: `existing-${page.id}`,
      title: getTitle(page),
      content: `Approfondir le sujet « ${getTitle(page)} » avec un nouvel angle pratique et des informations actualisées.`,
      mode: getMode(page),
      createdAt:
        page.editorial?.createdAt ??
        new Date(Date.now() - index * 86_400_000).toISOString(),
      approved: false,
    }));
}

export function AiAgents({
  project,
  initialAnalytics,
}: {
  project: DashboardProject;
  initialAnalytics: EditorialPerformanceSnapshot;
}) {
  const [pages, setPages] = useState(project.pages);
  const [view, setView] = useState<OverlayView>(null);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [ideaMode, setIdeaMode] = useState<IdeaMode>("seo");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [ideaFilter, setIdeaFilter] = useState<IdeaMode>("seo");
  const [ideas, setIdeas] = useState<EditorialIdea[]>([]);
  const [savingPageId, setSavingPageId] = useState<string | null>(null);
  const [production, setProduction] = useState<ProductionState | null>(null);
  const [executionMode, setExecutionMode] =
    useState<EditorialExecutionMode>("test");
  const analytics = initialAnalytics;
  const articles = useMemo(() => getArticlePages(pages), [pages]);
  const performanceByPath = useMemo(
    () => new Map(analytics.pages.map((page) => [page.path, page])),
    [analytics.pages],
  );
  const activeArticle =
    articles.find((page) => page.id === activeArticleId) ?? null;
  const activeIdea = ideas.find((idea) => idea.id === activeIdeaId) ?? null;
  const visibleIdeas = ideas.filter((idea) => idea.mode === ideaFilter);
  const storageKey = `editorial-ideas:${project.ownerId}:${project.key}`;
  const executionModeStorageKey = `editorial-execution-mode:${project.ownerId}:${project.key}`;

  useEffect(() => {
    const stored = window.localStorage.getItem(executionModeStorageKey);
    if (stored === "test" || stored === "classic") setExecutionMode(stored);
  }, [executionModeStorageKey]);

  function changeExecutionMode(mode: EditorialExecutionMode) {
    setExecutionMode(mode);
    window.localStorage.setItem(executionModeStorageKey, mode);
  }

  useEffect(() => {
    let cancelled = false;
    let nextIdeas: EditorialIdea[];
    try {
      const stored = window.localStorage.getItem(storageKey);
      nextIdeas = stored
        ? (JSON.parse(stored) as Array<EditorialIdea & { title?: string }>).map(
            (idea) => ({
              ...idea,
              title: idea.title?.trim() || idea.content.slice(0, 72),
            }),
          )
        : defaultIdeas(project.pages);
    } catch {
      nextIdeas = defaultIdeas(project.pages);
    }
    queueMicrotask(() => {
      if (cancelled) return;
      setIdeas(nextIdeas);
    });
    return () => {
      cancelled = true;
    };
  }, [project.pages, storageKey]);

  useEffect(() => {
    if (!view) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOverlay();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [view]);

  function closeOverlay() {
    setView(null);
    setActiveArticleId(null);
    setActiveIdeaId(null);
  }

  function openIdeas() {
    setView("ideas");
    setActiveIdeaId(null);
  }

  function openIdeaForm() {
    setIdeaTitle("");
    setIdeaText("");
    setIdeaMode(ideaFilter);
    setView("idea-form");
  }

  function openArticleCreation() {
    void runProduction(
      {
        id: `automatic-${crypto.randomUUID()}`,
        title: "Sujet choisi automatiquement",
        content:
          "Analyse les statistiques, les pages existantes et les opportunités disponibles afin de choisir un nouveau sujet pertinent et non redondant.",
        mode: ideaFilter,
        createdAt: new Date().toISOString(),
        approved: true,
      },
      true,
    );
  }

  function addIdea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ideaTitle.trim() || !ideaText.trim()) return;
    const idea: EditorialIdea = {
      id: crypto.randomUUID(),
      title: ideaTitle.trim(),
      content: ideaText.trim(),
      mode: ideaMode,
      createdAt: new Date().toISOString(),
      approved: false,
    };
    setIdeas((current) => {
      const next = [idea, ...current];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
    setIdeaFilter(ideaMode);
    setActiveIdeaId(idea.id);
    setIdeaTitle("");
    setIdeaText("");
    setView("idea-detail");
  }

  function saveIdea(updated: EditorialIdea) {
    setIdeas((current) => {
      const next = current.map((idea) =>
        idea.id === updated.id ? updated : idea,
      );
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
    setIdeaFilter(updated.mode);
  }

  async function runProduction(
    updated: EditorialIdea,
    discoverTopic = false,
    resume?: ProductionState,
  ) {
    if (!updated.approved) return;
    const idea = updated;
    const selectedExecutionMode = resume?.executionMode ?? executionMode;
    if (!discoverTopic && !resume) saveIdea(idea);
    let research = resume?.research;
    let outline = resume?.outline;
    let images = resume?.images;
    let quizPlan = resume?.quizPlan;
    let productionWarning = resume?.warning;
    setActiveIdeaId(idea.id);
    setView("production");
    setProduction({
      idea,
      executionMode: selectedExecutionMode,
      discoverTopic,
      statuses: {
        research: research ? "completed" : "running",
        outline: outline ? "completed" : research ? "running" : "pending",
        images: images ? "completed" : outline ? "running" : "pending",
        write: images ? "running" : "pending",
      },
      research,
      outline,
      images,
      quizPlan,
      warning: productionWarning,
    });

    const requestPhase = async <T,>(
      phase: ProductionPhase,
      extra: Record<string, unknown> = {},
    ) => {
      const response = await fetch("/api/ai-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase,
          mode: idea.mode,
          executionMode: selectedExecutionMode,
          topic: idea.title,
          source: idea.content,
          discoverTopic,
          projectKey: project.key,
          projectOwnerId: project.ownerId,
          ...extra,
        }),
      });
      const rawResponse = await response.text();
      let result: T & { error?: string };
      try {
        result = JSON.parse(rawResponse) as T & { error?: string };
      } catch {
        throw new Error(
          `La route des agents a retourné une réponse non JSON.\n- phase : ${phase}\n- statut HTTP : ${response.status}\n- corps : ${rawResponse.slice(0, 3000) || "vide"}`,
        );
      }
      if (!response.ok)
        throw new Error(
          result.error ??
            `La phase ${phase} a échoué sans message détaillé (HTTP ${response.status}).`,
        );
      return result;
    };

    let currentPhase: ProductionPhase = "research";
    try {
      if (!research) {
        const researchResult = await requestPhase<{
          research: ResearchBrief;
        }>("research");
        research = researchResult.research;
      }
      if (!research)
        throw new Error("Le dossier de recherche est introuvable.");

      currentPhase = "outline";
      setProduction((current) =>
        current
          ? {
              ...current,
              idea: discoverTopic
                ? {
                    ...current.idea,
                    title: research?.topic ?? current.idea.title,
                  }
                : current.idea,
              research,
              statuses: {
                ...current.statuses,
                research: "completed",
                outline: outline ? "completed" : "running",
              },
            }
          : current,
      );

      if (!outline) {
        const outlineResult = await requestPhase<{
          outline: ArticleOutline;
        }>("outline", { research });
        outline = outlineResult.outline;
      }
      if (!outline)
        throw new Error("La structure de l'article est introuvable.");

      currentPhase = "images";
      setProduction((current) =>
        current
          ? {
              ...current,
              outline,
              statuses: {
                ...current.statuses,
                outline: "completed",
                images: images ? "completed" : "running",
              },
            }
          : current,
      );

      if (!images) {
        const imageResult = await requestPhase<{
          images: ResolvedArticleImage[];
          quizPlan?: GeneratedQuizPlan;
          warning?: string;
        }>("images", { research, outline });
        images = imageResult.images;
        quizPlan = imageResult.quizPlan;
        productionWarning = imageResult.warning;
      }
      if (!images)
        throw new Error("Les visuels de l'article sont introuvables.");

      currentPhase = "write";
      setProduction((current) =>
        current
          ? {
              ...current,
              images,
              quizPlan,
              statuses: {
                ...current.statuses,
                images: "completed",
                write: "running",
              },
              warning: productionWarning,
            }
          : current,
      );

      const writeResult = await requestPhase<{
        page: SitePage;
        warning?: string;
      }>("write", {
        research,
        outline,
        images,
        quizPlan,
      });
      if (!writeResult.page)
        throw new Error(
          "L’article a été rédigé, mais le brouillon CMS est introuvable.",
        );
      setPages((current) =>
        current.some((page) => page.id === writeResult.page.id)
          ? current.map((page) =>
              page.id === writeResult.page.id ? writeResult.page : page,
            )
          : [...current, writeResult.page],
      );
      setActiveArticleId(writeResult.page.id);
      setProduction((current) =>
        current
          ? {
              ...current,
              statuses: {
                research: "completed",
                outline: "completed",
                images: "completed",
                write: "completed",
              },
              research,
              outline,
              images,
              quizPlan,
              failedPhase: undefined,
              error: undefined,
              warning: [productionWarning, writeResult.warning]
                .filter(Boolean)
                .join(" "),
              pageId: writeResult.page.id,
            }
          : current,
      );
    } catch (error) {
      setProduction((current) =>
        current
          ? {
              ...current,
              idea:
                discoverTopic && research
                  ? { ...current.idea, title: research.topic }
                  : current.idea,
              research,
              outline,
              images,
              quizPlan,
              failedPhase: currentPhase,
              statuses: { ...current.statuses, [currentPhase]: "error" },
              error:
                error instanceof Error
                  ? error.message
                  : "La production a été interrompue.",
            }
          : current,
      );
    }
  }

  function openArticle(page: SitePage) {
    setActiveArticleId(page.id);
    setView("article");
  }

  async function setEditorialStatus(
    page: SitePage,
    status: EditorialPageStatus,
  ) {
    if (savingPageId) return;
    setSavingPageId(page.id);
    try {
      const response = await fetch("/api/ai-agents/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectKey: project.key,
          projectOwnerId: project.ownerId,
          pageId: page.id,
          status,
        }),
      });
      const result = (await response.json()) as {
        updatedAt?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          result.error ?? "Le statut n’a pas pu être enregistré.",
        );
      setPages((existing) =>
        existing.map((candidate) =>
          candidate.id === page.id
            ? {
                ...candidate,
                editorial: {
                  status,
                  mode: candidate.editorial?.mode ?? "editorial",
                  executionMode: candidate.editorial?.executionMode,
                  category: candidate.editorial?.category ?? "Conseils",
                  createdAt:
                    candidate.editorial?.createdAt ?? new Date().toISOString(),
                  updatedAt: result.updatedAt ?? new Date().toISOString(),
                  research: candidate.editorial?.research,
                  outline: candidate.editorial?.outline,
                  article: candidate.editorial?.article,
                  images: candidate.editorial?.images,
                  quiz: candidate.editorial?.quiz,
                  quizPlacementAfterSectionId:
                    candidate.editorial?.quizPlacementAfterSectionId,
                },
              }
            : candidate,
        ),
      );
    } catch {
      // La ligne reste dans son état précédent si l’enregistrement échoue.
    } finally {
      setSavingPageId(null);
    }
  }

  return (
    <div className="-mx-3 -mt-3 min-h-[1004px] bg-white font-[var(--font-inter)] text-[#1c1c1c] sm:-mx-6 sm:-mt-6">
      <header className="flex min-h-[148px] flex-col justify-center gap-5 px-6 py-8 sm:px-[clamp(32px,5.75vw,71px)] lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-serif text-[32px] leading-none">Pages générées</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="mr-1 flex h-12 items-center rounded-[10px] border border-black/[0.08] bg-[#f7f7f7] p-1"
            role="group"
            aria-label="Mode de production"
          >
            <button
              type="button"
              onClick={() => changeExecutionMode("test")}
              className={`${executionMode === "test" ? "bg-white text-[#222] shadow-sm" : "text-black/40"} h-10 rounded-[8px] px-3 text-[11px] font-semibold transition`}
            >
              Test
            </button>
            <button
              type="button"
              onClick={() => changeExecutionMode("classic")}
              className={`${executionMode === "classic" ? "bg-[#222] text-white shadow-sm" : "text-black/40"} h-10 rounded-[8px] px-3 text-[11px] font-semibold transition`}
            >
              Classique
            </button>
          </div>
          <button
            type="button"
            onClick={openIdeas}
            className="flex h-12 min-w-[127px] items-center justify-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold tracking-[-.02em] text-[#222]"
          >
            <Lightbulb size={16} />
            Voir les idées
          </button>
          <button
            type="button"
            onClick={openIdeaForm}
            className="flex h-12 min-w-[145px] items-center justify-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold tracking-[-.02em] text-[#222]"
          >
            <Plus size={16} />
            Ajouter une idée
          </button>
          <button
            type="button"
            onClick={openArticleCreation}
            className="flex h-12 min-w-[172px] items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222_100%)] px-5 text-[14px] font-semibold tracking-[-.02em] text-[#fcfcfc] shadow-[0_2px_4px_-1px_rgba(13,13,13,.5),0_0_0_1px_#333,inset_0_.5px_1px_rgba(255,255,255,.15),inset_0_-1px_1.2px_.35px_#121212]"
          >
            <Sparkles size={16} />
            Créer un article
          </button>
        </div>
      </header>

      <section className="border-t border-black/[0.07]">
        {articles.map((page) => (
          <GeneratedRow
            key={page.id}
            title={getTitle(page)}
            mode={getMode(page)}
            status={getStatus(page)}
            date={getRelativeDate(
              page.editorial?.updatedAt ?? page.editorial?.createdAt,
            )}
            hero={getHero(page)}
            performance={performanceByPath.get(page.slug)}
            loading={savingPageId === page.id}
            onApprove={() => setEditorialStatus(page, "approved")}
            onReject={() => setEditorialStatus(page, "rejected")}
            onReset={() => setEditorialStatus(page, "pending")}
            onOpen={() => openArticle(page)}
          />
        ))}
        {!articles.length ? (
          <div className="grid min-h-[300px] place-items-center text-center">
            <div>
              <FilePenLine size={28} className="mx-auto text-black/15" />
              <p className="mt-3 text-[12px] text-black/40">
                Aucune page article générée.
              </p>
              <button
                type="button"
                onClick={openArticleCreation}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#222] px-5 text-[13px] font-semibold text-white"
              >
                <Sparkles size={15} />
                Créer mon premier article
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {view ? (
        <Overlay
          onClose={closeOverlay}
          size={
            view === "images"
              ? "tall"
              : view === "ideas" ||
                  view === "idea-form" ||
                  view === "idea-detail" ||
                  view === "production"
                ? "large"
                : "medium"
          }
        >
          {view === "ideas" ? (
            <IdeasOverlay
              ideas={visibleIdeas}
              filter={ideaFilter}
              onFilter={setIdeaFilter}
              onAdd={openIdeaForm}
              onOpen={(idea) => {
                setActiveIdeaId(idea.id);
                setView("idea-detail");
              }}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "idea-form" ? (
            <IdeaForm
              mode={ideaMode}
              title={ideaTitle}
              text={ideaText}
              onMode={setIdeaMode}
              onTitle={setIdeaTitle}
              onText={setIdeaText}
              onSubmit={addIdea}
              onBack={openIdeas}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "idea-detail" && activeIdea ? (
            <IdeaDetail
              idea={activeIdea}
              onSave={saveIdea}
              onProduce={runProduction}
              onBack={openIdeas}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "production" && production ? (
            <ProductionOverlay
              production={production}
              onRetry={() =>
                runProduction(
                  production.idea,
                  production.discoverTopic,
                  production,
                )
              }
              onOpenArticle={() => setView("article")}
              onBack={() => {
                setProduction(null);
                openIdeas();
              }}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "article" && activeArticle ? (
            <ArticleOverlay
              page={activeArticle}
              performance={performanceByPath.get(activeArticle.slug)}
              onOpen={setView}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "images" && activeArticle ? (
            <ImagesOverlay
              page={activeArticle}
              onBack={() => setView("article")}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "statistics" && activeArticle ? (
            <StatisticsOverlay
              page={activeArticle}
              performance={performanceByPath.get(activeArticle.slug)}
              analytics={analytics}
              onBack={() => setView("article")}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "research" && activeArticle ? (
            <PhaseOverlay
              kind="research"
              page={activeArticle}
              onBack={() => setView("article")}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "outline" && activeArticle ? (
            <PhaseOverlay
              kind="outline"
              page={activeArticle}
              onBack={() => setView("article")}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "writing" && activeArticle ? (
            <PhaseOverlay
              kind="writing"
              page={activeArticle}
              onBack={() => setView("article")}
              onClose={closeOverlay}
            />
          ) : null}
          {view === "quiz" && activeArticle ? (
            <QuizOverlay
              page={activeArticle}
              onBack={() => setView("article")}
              onClose={closeOverlay}
            />
          ) : null}
        </Overlay>
      ) : null}
    </div>
  );
}

function formatMetric(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    value,
  );
}

function formatAnalyticsDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "jamais";
}

function PagePerformance({
  performance,
  compact = false,
}: {
  performance?: PagePerformanceMetrics;
  compact?: boolean;
}) {
  const hasData =
    performance &&
    (performance.internalTracking.pageViews ||
      performance.googleAnalytics.sessions ||
      performance.googleAnalytics.pageViews ||
      performance.searchConsole.impressions ||
      performance.searchConsole.clicks);
  if (!hasData)
    return (
      <div
        className={`${compact ? "hidden xl:block" : "rounded-[14px] border border-dashed border-black/10 p-4"} text-[10px] text-black/35`}
      >
        Aucune statistique synchronisée pour cette page
      </div>
    );
  const metrics = performance.internalTracking.pageViews
    ? ([
        ["Vues", performance.internalTracking.pageViews],
        ["Visiteurs", performance.internalTracking.uniqueVisitors],
        [
          "Temps moyen",
          `${formatMetric(performance.internalTracking.averageEngagementSeconds)} s`,
        ],
      ] as const)
    : ([
        ["Sessions", performance.googleAnalytics.sessions],
        ["Vues", performance.googleAnalytics.pageViews],
        ["Impressions", performance.searchConsole.impressions],
      ] as const);
  return (
    <div
      className={
        compact
          ? "hidden items-center gap-4 xl:flex"
          : "grid grid-cols-2 gap-3 rounded-[14px] border border-black/[0.06] bg-[#fafafa] p-4 sm:grid-cols-4"
      }
    >
      {metrics.map(([label, value]) => (
        <div
          key={label}
          className={compact ? "min-w-[54px]" : "rounded-[10px] bg-white p-3"}
        >
          <p className="text-[9px] text-black/35">{label}</p>
          <p
            className={`${compact ? "text-[12px]" : "mt-1 text-[17px]"} font-semibold`}
          >
            {typeof value === "number" ? formatMetric(value) : value}
          </p>
        </div>
      ))}
    </div>
  );
}

function GeneratedRow({
  title,
  mode,
  status,
  date,
  hero,
  performance,
  loading,
  onApprove,
  onReject,
  onReset,
  onOpen,
}: {
  title: string;
  mode: IdeaMode;
  status: EditorialPageStatus;
  date: string;
  hero: string;
  performance?: PagePerformanceMetrics;
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
  onReset: () => void;
  onOpen: () => void;
}) {
  const decided = status !== "pending";
  return (
    <div
      className={`grid min-h-[74px] border-b border-black/[0.07] bg-white transition md:grid-cols-[199px_minmax(0,1fr)] ${decided ? "opacity-30" : ""}`}
    >
      <div className="flex items-center justify-center gap-3 px-5 py-3 md:border-r md:border-black/[0.07]">
        <Grip size={15} className="text-[#d9d9d9]" />
        <div>
          <p className="font-serif text-[16px] leading-none">Page article</p>
          <p className="mt-1 text-[9px] text-black/35">{modeLabel(mode)}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-[21px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-[45px] w-[62px] shrink-0 overflow-hidden rounded-[6px] border border-black/[0.07] bg-[#d9d9d9]">
            {hero ? (
              <Image
                src={hero}
                alt=""
                width={62}
                height={45}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium leading-5 text-black/60">
              {title}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <ModePill mode={mode} />
              <span className="text-[12px] leading-5 text-black/55">
                {date}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 lg:flex-nowrap">
          <PagePerformance performance={performance} compact />
          {status === "pending" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={onApprove}
                className="flex h-9 min-w-[68px] items-center justify-center rounded-[27px] border border-black/[0.08] bg-[#4ac872] px-3 text-[14px] text-white shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : (
                  "Valider"
                )}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onReject}
                className="flex h-9 min-w-[74px] items-center justify-center rounded-[27px] border border-black/[0.08] bg-[#e1957e] px-3 text-[14px] text-white shadow-sm disabled:opacity-50"
              >
                Refuser
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={onReset}
              aria-label="Modifier le choix"
              className={`grid size-8 place-items-center rounded-full ${status === "approved" ? "bg-[#ebffe8] text-[#37982a]" : "bg-[#fff0ec] text-[#b85d45]"}`}
            >
              {loading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : status === "approved" ? (
                <CheckCircle2 size={19} />
              ) : (
                <XCircle size={19} />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onOpen}
            aria-label="Ouvrir l’article"
            className="grid size-[36px] place-items-center rounded-[6px] border border-black/10 bg-white text-[#525866]"
          >
            <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModePill({ mode }: { mode: IdeaMode }) {
  const styles =
    mode === "youtube"
      ? "bg-[#fff0ed] text-[#a84732]"
      : mode === "trends"
        ? "bg-[#eef2ff] text-[#4f5e9b]"
        : "bg-[#ededed] text-black/50";
  return (
    <span
      className={`rounded-full px-2 py-[5px] text-[11px] leading-4 ${styles}`}
    >
      {modeLabel(mode)}
    </span>
  );
}

function Overlay({
  children,
  onClose,
  size,
}: {
  children: ReactNode;
  onClose: () => void;
  size: "medium" | "large" | "tall";
}) {
  const height =
    size === "large"
      ? "h-[min(726px,calc(100dvh-48px))]"
      : size === "tall"
        ? "h-[min(588px,calc(100dvh-48px))]"
        : "h-[min(574px,calc(100dvh-48px))]";
  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[#e8e5e0]/75 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        className={`relative flex w-full max-w-[1019px] flex-col overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_38px_23px_rgba(0,0,0,.02),0_17px_17px_rgba(0,0,0,.03),0_4px_9px_rgba(0,0,0,.03)] sm:rounded-[32px] ${height}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}

function OverlayTop({
  title,
  children,
  onClose,
}: {
  title: string;
  children?: ReactNode;
  onClose: () => void;
}) {
  return (
    <header className="flex min-h-[104px] shrink-0 items-center gap-4 border-b border-black/[0.08] px-5 sm:px-9">
      <h2 className="min-w-0 flex-1 truncate font-serif text-[24px] leading-none">
        {title}
      </h2>
      {children}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f3f3f3] text-black/55"
      >
        <X size={18} />
      </button>
    </header>
  );
}

function IdeasOverlay({
  ideas,
  filter,
  onFilter,
  onAdd,
  onOpen,
  onClose,
}: {
  ideas: EditorialIdea[];
  filter: IdeaMode;
  onFilter: (mode: IdeaMode) => void;
  onAdd: () => void;
  onOpen: (idea: EditorialIdea) => void;
  onClose: () => void;
}) {
  return (
    <>
      <OverlayTop title="Toutes les idées" onClose={onClose}>
        <div className="hidden items-center gap-1 md:flex">
          {ideaModes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilter(item.id)}
              className={`h-10 rounded-[9px] px-3 text-[12px] font-semibold ${filter === item.id ? "bg-[#fafafa]" : "text-black/45"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="hidden h-12 rounded-[10px] bg-[#222] px-5 text-[14px] font-semibold text-white sm:block"
        >
          Ajouter une idée
        </button>
      </OverlayTop>
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-black/[0.07] px-4 py-3 md:hidden">
        {ideaModes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilter(item.id)}
            className={`h-9 rounded-[9px] px-3 text-[12px] font-semibold ${filter === item.id ? "bg-[#f3f3f3]" : "text-black/45"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {ideas.map((idea) => (
          <button
            key={idea.id}
            type="button"
            onClick={() => onOpen(idea)}
            className="grid min-h-[74px] w-full border-b border-black/[0.07] text-left md:grid-cols-[199px_minmax(0,1fr)]"
          >
            <span className="flex items-center justify-center gap-3 px-5">
              <Grip size={15} className="text-[#d9d9d9]" />
              <span className="font-serif text-[16px]">
                {modeLabel(idea.mode)}
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-4 px-5 py-3 md:border-l md:border-black/[0.07]">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold leading-5 text-black/65">
                  {idea.title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] leading-5 text-black/40">
                  {idea.content}
                </span>
                <span className="mt-0.5 block text-[10px] text-black/30">
                  {getRelativeDate(idea.createdAt)}
                </span>
              </span>
              {idea.approved ? (
                <span
                  title="Idée validée"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ebffe8] text-[#37982a]"
                >
                  <Check size={17} />
                </span>
              ) : null}
              <span className="grid size-9 shrink-0 place-items-center rounded-[6px] border border-black/10 text-[#525866]">
                <ExternalLink size={17} />
              </span>
            </span>
          </button>
        ))}
        {!ideas.length ? (
          <div className="grid min-h-[300px] place-items-center text-center text-[12px] text-black/40">
            Aucune idée dans cette catégorie.
          </div>
        ) : null}
      </div>
      <footer className="flex shrink-0 items-center justify-between border-t border-black/[0.07] bg-white p-5 sm:px-9">
        <button
          type="button"
          onClick={onClose}
          className="flex h-12 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold"
        >
          <ArrowLeft size={17} />
          Retour
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="h-12 rounded-[10px] bg-[#222] px-5 text-[14px] font-semibold text-white sm:hidden"
        >
          Ajouter une idée
        </button>
      </footer>
    </>
  );
}

function IdeaForm({
  mode,
  title,
  text,
  onMode,
  onTitle,
  onText,
  onSubmit,
  onBack,
  onClose,
}: {
  mode: IdeaMode;
  title: string;
  text: string;
  onMode: (mode: IdeaMode) => void;
  onTitle: (title: string) => void;
  onText: (text: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <OverlayTop title="Ajouter une idée" onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-12">
        <div className="grid gap-5 sm:grid-cols-[1fr_240px]">
          <label className="block text-[12px] font-semibold text-black/45">
            Titre
            <input
              autoFocus
              value={title}
              onChange={(event) => onTitle(event.target.value)}
              placeholder="Titre de l’idée"
              className="mt-2 h-12 w-full rounded-[10px] border border-black/10 px-4 text-[14px] outline-none focus:border-black/25"
            />
          </label>
          <label className="block text-[12px] font-semibold text-black/45">
            Catégorie
            <select
              value={mode}
              onChange={(event) => onMode(event.target.value as IdeaMode)}
              className="mt-2 h-12 w-full rounded-[10px] border border-black/10 bg-white px-4 text-[14px] outline-none"
            >
              {ideaModes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-6 block text-[12px] font-semibold text-black/45">
          Informations sur l’idée
          <textarea
            value={text}
            onChange={(event) => onText(event.target.value)}
            placeholder="Décris précisément l’idée, l’angle, les questions à traiter et les informations utiles pour les agents IA…"
            className="mt-2 min-h-[220px] w-full resize-none rounded-[14px] border border-black/10 p-5 text-[15px] leading-7 text-black/70 outline-none focus:border-black/25"
          />
        </label>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-black/[0.07] p-5 sm:px-12">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold"
        >
          <ArrowLeft size={17} />
          Retour aux idées
        </button>
        <button
          type="submit"
          disabled={!title.trim() || !text.trim()}
          className="h-12 rounded-[10px] bg-[#222] px-7 text-[14px] font-semibold text-white disabled:opacity-35"
        >
          Ajouter l’idée
        </button>
      </footer>
    </form>
  );
}

function IdeaDetail({
  idea,
  onSave,
  onProduce,
  onBack,
  onClose,
}: {
  idea: EditorialIdea;
  onSave: (idea: EditorialIdea) => void;
  onProduce: (idea: EditorialIdea) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(idea.title);
  const [content, setContent] = useState(idea.content);
  const [mode, setMode] = useState<IdeaMode>(idea.mode);
  const hasChanges =
    title.trim() !== idea.title ||
    content.trim() !== idea.content ||
    mode !== idea.mode;
  const currentIdea = (approved: boolean): EditorialIdea => ({
    ...idea,
    title: title.trim(),
    content: content.trim(),
    mode,
    approved,
  });
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave(currentIdea(hasChanges ? false : idea.approved));
  }
  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <OverlayTop title="Modifier l’idée" onClose={onClose}>
        {idea.approved ? (
          <span className="hidden items-center gap-2 text-[12px] font-semibold text-[#37982a] sm:flex">
            <CheckCircle2 size={16} />
            Validée
          </span>
        ) : null}
      </OverlayTop>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-12">
        <div className="grid gap-5 sm:grid-cols-[1fr_240px]">
          <label className="block text-[12px] font-semibold text-black/45">
            Titre
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 h-12 w-full rounded-[10px] border border-black/10 px-4 text-[14px] outline-none focus:border-black/25"
            />
          </label>
          <label className="block text-[12px] font-semibold text-black/45">
            Catégorie
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as IdeaMode)}
              className="mt-2 h-12 w-full rounded-[10px] border border-black/10 bg-white px-4 text-[14px] outline-none"
            >
              {ideaModes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-6 block text-[12px] font-semibold text-black/45">
          Informations sur l’idée
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="mt-2 min-h-[220px] w-full resize-none rounded-[14px] border border-black/10 p-5 text-[15px] leading-7 text-black/70 outline-none focus:border-black/25"
          />
        </label>
      </div>
      <footer className="flex shrink-0 justify-between border-t border-black/[0.07] p-5 sm:px-12">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold"
        >
          <ArrowLeft size={17} />
          Retour aux idées
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={!title.trim() || !content.trim()}
            className="h-12 rounded-[10px] bg-[#f3f3f3] px-5 text-[14px] font-semibold text-[#222] disabled:opacity-35"
          >
            Enregistrer
          </button>
          {idea.approved && !hasChanges ? (
            <button
              type="button"
              onClick={() => onProduce(currentIdea(true))}
              className="flex h-12 items-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222_100%)] px-6 text-[14px] font-semibold text-white shadow-sm"
            >
              <Sparkles size={16} />
              Lancer la production
            </button>
          ) : (
            <button
              type="button"
              disabled={!title.trim() || !content.trim()}
              onClick={() => onSave(currentIdea(true))}
              className="flex h-12 items-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222_100%)] px-6 text-[14px] font-semibold text-white shadow-sm disabled:opacity-35"
            >
              <Check size={16} />
              Valider l’idée
            </button>
          )}
        </div>
      </footer>
    </form>
  );
}

function ProductionOverlay({
  production,
  onRetry,
  onOpenArticle,
  onBack,
  onClose,
}: {
  production: ProductionState;
  onRetry: () => void;
  onOpenArticle: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const running = Object.values(production.statuses).includes("running");
  const completed = production.statuses.write === "completed";
  const phases: Array<{
    id: ProductionPhase;
    title: string;
    description: string;
  }> = [
    {
      id: "research",
      title: "1. Recherche",
      description:
        "Analyse des statistiques, de l’intention et des informations utiles.",
    },
    {
      id: "outline",
      title: "2. Structure",
      description:
        "Construction du plan SEO, des sections et du maillage éditorial.",
    },
    {
      id: "images",
      title: "3. Images et quiz",
      description:
        "Résolution de l’image principale obligatoire, des visuels utiles et du quiz facultatif.",
    },
    {
      id: "write",
      title: "4. Rédaction",
      description:
        "Rédaction finale et assemblage du brouillon dans le CMS Articles.",
    },
  ];

  return (
    <>
      <OverlayTop title="Production de l’article" onClose={onClose}>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${production.executionMode === "test" ? "bg-[#eef4ff] text-[#355b91]" : "bg-[#ebffe8] text-[#2f7a25]"}`}
          >
            {production.executionMode === "test"
              ? "Mode test"
              : "Mode classique"}
          </span>
          <ModePill mode={production.idea.mode} />
        </div>
      </OverlayTop>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-12">
        <div className="rounded-[18px] border border-black/[0.06] bg-[#fafafa] p-5">
          <p className="font-serif text-[21px] leading-tight">
            {production.idea.title}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-black/45">
            {production.executionMode === "test"
              ? "Le modèle économique Ling 2.6 Flash exécute toutes les étapes et les images sont choisies aléatoirement dans Assets, sans génération d’image."
              : "Les modèles classiques exécutent toutes les étapes et génèrent une seule proposition pour chaque image demandée."}{" "}
            Le brouillon reste non publié après la production.
          </p>
        </div>
        <div className="mt-6 grid gap-3">
          {phases.map((phase) => (
            <ProductionStep
              key={phase.id}
              title={phase.title}
              description={phase.description}
              status={production.statuses[phase.id]}
            />
          ))}
        </div>
        {production.error ? (
          <div className="mt-5 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-[14px] border border-[#e1957e]/35 bg-[#fff4f0] p-4 font-mono text-[11px] leading-5 text-[#8c3e2a]">
            {production.error}
          </div>
        ) : null}
        {completed ? (
          <div className="mt-5 rounded-[14px] border border-[#4ac872]/25 bg-[#f2fff6] p-4 text-[12px] leading-5 text-[#246d3b]">
            {production.warning ||
              "Le brouillon a été ajouté au CMS Articles. Il attend ta validation manuelle."}
          </div>
        ) : null}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-black/[0.07] bg-white p-5 sm:px-12">
        <button
          type="button"
          onClick={onBack}
          disabled={running}
          className="flex h-12 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold disabled:opacity-35"
        >
          <ArrowLeft size={17} />
          Retour aux idées
        </button>
        {production.error ? (
          <button
            type="button"
            onClick={onRetry}
            className="h-12 rounded-[10px] bg-[#222] px-6 text-[14px] font-semibold text-white"
          >
            Réessayer
          </button>
        ) : null}
        {completed ? (
          <button
            type="button"
            onClick={onOpenArticle}
            className="flex h-12 items-center gap-2 rounded-[10px] bg-[#222] px-6 text-[14px] font-semibold text-white"
          >
            <ExternalLink size={17} />
            Ouvrir le brouillon
          </button>
        ) : null}
        {running ? (
          <span className="flex items-center gap-2 text-[12px] font-medium text-black/45">
            <LoaderCircle size={16} className="animate-spin" />
            Production en cours…
          </span>
        ) : null}
      </footer>
    </>
  );
}

function ProductionStep({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: ProductionPhaseStatus;
}) {
  const icon =
    status === "running" ? (
      <LoaderCircle size={19} className="animate-spin" />
    ) : status === "completed" ? (
      <Check size={19} />
    ) : status === "error" ? (
      <X size={19} />
    ) : (
      <span className="size-2 rounded-full bg-current" />
    );
  const color =
    status === "completed"
      ? "bg-[#ebffe8] text-[#37982a]"
      : status === "error"
        ? "bg-[#fff0ec] text-[#b85d45]"
        : status === "running"
          ? "bg-[#222] text-white"
          : "bg-[#f3f3f3] text-black/25";
  return (
    <div
      className={`flex items-center gap-4 rounded-[16px] border p-4 transition ${status === "running" ? "border-black/15 bg-white shadow-sm" : "border-black/[0.05] bg-white"}`}
    >
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-full ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="mt-1 text-[11px] leading-5 text-black/45">
          {description}
        </p>
      </div>
    </div>
  );
}

function ArticleOverlay({
  page,
  performance,
  onOpen,
  onClose,
}: {
  page: SitePage;
  performance?: PagePerformanceMetrics;
  onOpen: (view: OverlayView) => void;
  onClose: () => void;
}) {
  const fields = getArticleFields(page);
  const hasInternalStatistics = Boolean(
    performance?.internalTracking.pageViews,
  );
  const hasStatistics = Boolean(
    hasInternalStatistics ||
    (performance &&
      (performance.googleAnalytics.sessions ||
        performance.googleAnalytics.pageViews ||
        performance.searchConsole.impressions ||
        performance.searchConsole.clicks)),
  );
  const statisticsDetail = hasInternalStatistics
    ? `${formatMetric(performance?.internalTracking.pageViews ?? 0)} vues · ${formatMetric(performance?.internalTracking.uniqueVisitors ?? 0)} visiteurs uniques`
    : hasStatistics
      ? `${formatMetric(performance?.googleAnalytics.pageViews ?? 0)} vues GA4 · ${formatMetric(performance?.searchConsole.impressions ?? 0)} impressions`
      : "Aucune donnée enregistrée";
  return (
    <>
      <OverlayTop title={getTitle(page)} onClose={onClose}>
        <span className="hidden text-[13px] font-medium text-black/45 md:block">
          {fields?.readingTime || "Production terminée"}
        </span>
      </OverlayTop>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:px-9 sm:py-8">
        <div className="grid gap-4">
          <ArticleFolder
            icon={<Images size={22} />}
            title="Images"
            onClick={() => onOpen("images")}
            preview={getHero(page)}
          />
          <ArticleFolder
            icon={<BarChart3 size={22} />}
            title="Statistiques"
            detail={statisticsDetail}
            onClick={() => onOpen("statistics")}
          />
          <ArticleFolder
            icon={<FolderSearch2 size={22} />}
            title="Dossier de recherche"
            onClick={() => onOpen("research")}
          />
          <ArticleFolder
            icon={<Bot size={22} />}
            title="Structure de l’article"
            onClick={() => onOpen("outline")}
          />
          <ArticleFolder
            icon={<FilePenLine size={22} />}
            title="Rédaction finale"
            onClick={() => onOpen("writing")}
          />
          {page.editorial?.quiz || fields?.quizzes[0] ? (
            <ArticleFolder
              icon={<Sparkles size={22} />}
              title="Quiz interactif"
              onClick={() => onOpen("quiz")}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

function StatisticsOverlay({
  page,
  performance,
  analytics,
  onBack,
  onClose,
}: {
  page: SitePage;
  performance?: PagePerformanceMetrics;
  analytics: EditorialPerformanceSnapshot;
  onBack: () => void;
  onClose: () => void;
}) {
  const internalMetrics = performance
    ? ([
        [
          "Pages vues",
          formatMetric(performance.internalTracking.pageViews),
          "Toutes les consultations de cette page",
        ],
        [
          "Visiteurs uniques",
          formatMetric(performance.internalTracking.uniqueVisitors),
          "Visiteurs anonymes distincts",
        ],
        [
          "Temps total",
          `${formatMetric(performance.internalTracking.totalEngagementSeconds)} s`,
          "Temps actif cumulé sur cette page",
        ],
        [
          "Temps moyen",
          `${formatMetric(performance.internalTracking.averageEngagementSeconds)} s`,
          "Temps actif moyen par consultation",
        ],
      ] as const)
    : [];
  const googleMetrics = performance
    ? ([
        [
          "Sessions",
          formatMetric(performance.googleAnalytics.sessions),
          "Visites enregistrées par GA4",
        ],
        [
          "Vues GA4",
          formatMetric(performance.googleAnalytics.pageViews),
          "Affichages mesurés par Google Analytics",
        ],
        [
          "Impressions Google",
          formatMetric(performance.searchConsole.impressions),
          "Affichages dans les résultats Google",
        ],
        [
          "Clics Google",
          formatMetric(performance.searchConsole.clicks),
          "Clics depuis les résultats Google",
        ],
        [
          "CTR",
          `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(performance.searchConsole.ctr * 100)} %`,
          "Taux de clic Search Console",
        ],
        [
          "Position moyenne",
          performance.searchConsole.position
            ? new Intl.NumberFormat("fr-FR", {
                maximumFractionDigits: 1,
              }).format(performance.searchConsole.position)
            : "—",
          "Position moyenne dans Google",
        ],
      ] as const)
    : [];
  const hasInternalData = Boolean(
    performance?.internalTracking.pageViews ||
    performance?.internalTracking.uniqueVisitors ||
    performance?.internalTracking.totalEngagementSeconds,
  );
  const hasGoogleData = Boolean(
    performance &&
    (performance.googleAnalytics.sessions ||
      performance.googleAnalytics.pageViews ||
      performance.searchConsole.impressions ||
      performance.searchConsole.clicks),
  );
  return (
    <>
      <OverlayTop
        title={`Statistiques · ${getTitle(page)}`}
        onClose={onClose}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-9">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-black/[0.06] bg-[#fafafa] px-4 py-3">
          <div>
            <p className="text-[12px] font-semibold">{page.slug}</p>
            <p className="mt-1 text-[10px] text-black/40">
              Dernière donnée : {formatAnalyticsDate(analytics.updatedAt)}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] text-black/45 shadow-sm">
            Depuis l’activation
          </span>
        </div>
        <section className="mt-6">
          <h3 className="font-serif text-[20px]">Tracking direct du site</h3>
          <p className="mt-1 text-[10px] text-black/40">
            Mesure anonyme intégrée au site, sans dépendre de GA4.
          </p>
          {hasInternalData ? (
            <StatisticsGrid metrics={internalMetrics} />
          ) : (
            <div className="mt-4 rounded-[14px] border border-dashed border-black/10 p-8 text-center">
              <BarChart3 size={24} className="mx-auto text-black/15" />
              <p className="mt-3 text-[12px] text-black/45">
                Aucune visite enregistrée depuis l’activation du tracking.
              </p>
            </div>
          )}
        </section>
        <section className="mt-8">
          <h3 className="font-serif text-[20px]">
            Google Analytics et Search Console
          </h3>
          {hasGoogleData ? (
            <StatisticsGrid metrics={googleMetrics} />
          ) : (
            <p className="mt-4 rounded-[14px] bg-[#fafafa] p-5 text-[11px] text-black/40">
              Données Google facultatives : le tracking direct fonctionne même
              sans GA4.
            </p>
          )}
        </section>
      </div>
      <footer className="shrink-0 border-t border-black/[0.07] bg-white p-5 sm:px-9">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold"
        >
          <ArrowLeft size={18} />
          Retour à l’article
        </button>
      </footer>
    </>
  );
}

function StatisticsGrid({
  metrics,
}: {
  metrics: ReadonlyArray<readonly [string, string, string]>;
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(([label, value, description]) => (
        <article
          key={label}
          className="rounded-[14px] border border-black/[0.06] bg-white p-4"
        >
          <p className="text-[10px] font-medium text-black/40">{label}</p>
          <p className="mt-3 font-serif text-[25px] leading-none">{value}</p>
          <p className="mt-3 text-[9px] leading-4 text-black/35">
            {description}
          </p>
        </article>
      ))}
    </div>
  );
}

function QuizOverlay({
  page,
  onBack,
  onClose,
}: {
  page: SitePage;
  onBack: () => void;
  onClose: () => void;
}) {
  const quiz = page.editorial?.quiz ?? getArticleFields(page)?.quizzes[0];
  return (
    <>
      <OverlayTop title={`Quiz · ${getTitle(page)}`} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f5] p-4 sm:p-8">
        {quiz ? (
          <ArticleQuiz quiz={quiz} />
        ) : (
          <EmptyPhase text="Aucun quiz n’a été généré pour cet article." />
        )}
      </div>
      <footer className="shrink-0 border-t border-black/[0.07] bg-white p-5 sm:px-9">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold"
        >
          <ArrowLeft size={18} />
          Retour à l’article
        </button>
      </footer>
    </>
  );
}

function ArticleFolder({
  icon,
  title,
  detail,
  onClick,
  preview,
}: {
  icon: ReactNode;
  title: string;
  detail?: string;
  onClick: () => void;
  preview?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-20 w-full items-center gap-5 rounded-[20px] border border-black/[0.04] bg-[#fafafa]/30 px-7 text-left transition hover:border-black/10 hover:bg-[#fafafa]"
    >
      <span className="relative grid size-10 shrink-0 place-items-center text-[#aeaeae]">
        {preview ? (
          <>
            <span className="absolute left-0 h-9 w-8 -rotate-6 overflow-hidden rounded-[4px] border-2 border-white bg-[#ddd] shadow">
              <Image
                src={preview}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </span>
            <span className="absolute right-0 h-9 w-8 rotate-6 overflow-hidden rounded-[4px] border-2 border-white bg-[#ddd] shadow">
              <Image
                src={preview}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </span>
          </>
        ) : (
          icon
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-[18px]">{title}</span>
        {detail ? (
          <span className="mt-1 block truncate text-[10px] text-black/35">
            {detail}
          </span>
        ) : null}
      </span>
      <ExternalLink size={17} className="ml-auto shrink-0 text-black/25" />
    </button>
  );
}

function ImagesOverlay({
  page,
  onBack,
  onClose,
}: {
  page: SitePage;
  onBack: () => void;
  onClose: () => void;
}) {
  const fields = getArticleFields(page);
  const images = [
    ...(fields?.heroImageUrl
      ? [
          {
            url: fields.heroImageUrl,
            title: "Image principale",
            alt:
              fields.heroImageAlt ||
              page.editorial?.article?.heroImageAlt ||
              getTitle(page),
          },
        ]
      : []),
    ...(fields?.blocks.flatMap((block, index) =>
      block.kind === "image"
        ? [{ url: block.imageUrl, title: `Image ${index + 1}`, alt: block.alt }]
        : [],
    ) ?? []),
  ].filter(
    (image, index, all) =>
      all.findIndex((candidate) => candidate.url === image.url) === index,
  );
  return (
    <>
      <OverlayTop title={`Images · ${getTitle(page)}`} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-9">
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image) => (
            <article key={image.url} className="min-w-0">
              <div className="relative aspect-square overflow-hidden rounded-[16px] border-[3px] border-white bg-[#dedede] shadow-[0_13px_5px_rgba(0,0,0,.01),0_7px_4px_rgba(0,0,0,.02),0_3px_3px_rgba(0,0,0,.03),0_1px_2px_rgba(0,0,0,.04)]">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <h3 className="mt-4 font-serif text-[20px]">{image.title}</h3>
              <p className="mt-2 text-[11px] font-medium leading-4 text-black/45">
                Alt : {image.alt}
              </p>
              <p className="mt-1 text-[11px] text-black/35">
                Ajoutée{" "}
                {getRelativeDate(page.editorial?.createdAt).toLowerCase()}
              </p>
            </article>
          ))}
          {!images.length ? (
            <p className="col-span-full py-20 text-center text-[13px] text-black/40">
              Aucune image générée pour cet article.
            </p>
          ) : null}
        </div>
      </div>
      <footer className="shrink-0 bg-gradient-to-t from-white via-white to-white/20 p-5 sm:px-9">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold"
        >
          <ArrowLeft size={18} />
          Retour à l’article
        </button>
      </footer>
    </>
  );
}

function PhaseOverlay({
  kind,
  page,
  onBack,
  onClose,
}: {
  kind: "research" | "outline" | "writing";
  page: SitePage;
  onBack: () => void;
  onClose: () => void;
}) {
  const research = page.editorial?.research;
  const outline = page.editorial?.outline;
  const article = page.editorial?.article;
  const fields = getArticleFields(page);
  const title =
    kind === "research"
      ? "Dossier de recherche"
      : kind === "outline"
        ? "Structure de l’article"
        : "Rédaction finale";
  return (
    <>
      <OverlayTop title={`${title} · ${getTitle(page)}`} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-9">
        {kind === "research" ? (
          research ? (
            <div className="grid gap-7 text-[14px] leading-7 text-black/65">
              <TextSection title="Résumé" text={research.summary} />
              <div className="grid gap-4 md:grid-cols-3">
                <TextSection
                  title="Intention de recherche"
                  text={research.searchIntent}
                />
                <TextSection title="Audience" text={research.audience} />
                <TextSection title="Angle éditorial" text={research.angle} />
              </div>
              {research.performanceAnalysis ? (
                <>
                  <TextSection
                    title={`Analyse des anciennes pages · ${research.performanceAnalysis.dataStatus === "connected" ? "données connectées" : research.performanceAnalysis.dataStatus === "partial" ? "données partielles" : "données absentes"}`}
                    text={research.performanceAnalysis.summary}
                  />
                  <ListSection
                    title="Constats issus des performances"
                    items={research.performanceAnalysis.mainFindings}
                  />
                  <ListSection
                    title="Pages qui ont bien fonctionné"
                    items={research.performanceAnalysis.winningPages.map(
                      (item) => `${item.path}\n${item.reason}`,
                    )}
                  />
                  <ListSection
                    title="Pages faibles ou sous-exploitées"
                    items={research.performanceAnalysis.weakPages.map(
                      (item) => `${item.path}\n${item.reason}`,
                    )}
                  />
                  <ListSection
                    title="Opportunités Search Console"
                    items={research.performanceAnalysis.seoOpportunities.map(
                      (item) => `${item.path}\n${item.opportunity}`,
                    )}
                  />
                  <ListSection
                    title="Formats et angles à réutiliser"
                    items={research.performanceAnalysis.contentPatterns}
                  />
                </>
              ) : null}
              <ListSection
                title="Faits et sources transmis à l’agent de structure"
                items={research.facts.map(
                  (fact) =>
                    `${fact.claim}\n${fact.sourceTitle} — ${fact.sourceUrl}`,
                )}
              />
              <ListSection
                title="Questions à traiter"
                items={research.questions}
              />
              <ListSection title="Mots-clés" items={research.keywords} inline />
              <ListSection title="Précautions" items={research.safetyNotes} />
            </div>
          ) : (
            <EmptyPhase text="Aucun dossier de recherche n’a été conservé pour cet article." />
          )
        ) : null}
        {kind === "outline" ? (
          outline ? (
            <div className="grid gap-7 text-[14px] leading-7 text-black/65">
              <TextSection title="Titre proposé" text={outline.title} />
              <TextSection title="Résumé" text={outline.excerpt} />
              <div className="grid gap-4 md:grid-cols-4">
                <TextSection title="Catégorie" text={outline.category} />
                <TextSection title="Slug" text={outline.slug} />
                <TextSection
                  title="Temps de lecture"
                  text={outline.readingTime}
                />
                <TextSection
                  title="Alt de l’image"
                  text={outline.heroImageAlt}
                />
              </div>
              <section>
                <h3 className="font-serif text-[20px] text-[#1c1c1c]">
                  Plan transmis à l’agent de rédaction
                </h3>
                <div className="mt-4 grid gap-3">
                  {outline.sections.map((section, index) => (
                    <div
                      key={`${section.title}-${index}`}
                      className="rounded-[14px] border border-black/[0.06] bg-[#fafafa] p-5"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-black/35">
                        {section.level} · Partie {index + 1}
                      </p>
                      <h4 className="mt-2 font-serif text-[18px] text-[#1c1c1c]">
                        {section.title}
                      </h4>
                      <p className="mt-2">{section.purpose}</p>
                      <ul className="mt-3 list-disc pl-5">
                        {section.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <EmptyPhase text="Aucune structure n’a été conservée pour cet article." />
          )
        ) : null}
        {kind === "writing" ? (
          <WritingContent page={page} article={article} fields={fields} />
        ) : null}
      </div>
      <footer className="shrink-0 border-t border-black/[0.07] p-5 sm:px-9">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold"
        >
          <ArrowLeft size={18} />
          Retour à l’article
        </button>
      </footer>
    </>
  );
}

function WritingContent({
  page,
  article,
  fields,
}: {
  page: SitePage;
  article: GeneratedArticle | undefined;
  fields: ArticleDetailFields | null;
}) {
  const blocks = fields?.blocks ?? [];
  if (!blocks.length)
    return (
      <EmptyPhase text="Aucune rédaction finale n’a été conservée pour cet article." />
    );
  return (
    <article className="mx-auto max-w-[820px]">
      <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-black/35">
        Texte final transmis au CMS
      </p>
      <h2 className="mt-3 font-serif text-[30px] leading-tight">
        {article?.title ?? getTitle(page)}
      </h2>
      <p className="mt-4 text-[15px] leading-7 text-black/55">
        {article?.excerpt ?? fields?.subtitle}
      </p>
      <div className="mt-8">
        {blocks.map((block, index) =>
          block.kind === "heading" ? (
            block.level === "h3" ? (
              <h4 key={index} className="mb-3 mt-7 text-[17px] font-semibold">
                {block.text}
              </h4>
            ) : (
              <h3 key={index} className="mb-3 mt-9 font-serif text-[24px]">
                {block.text}
              </h3>
            )
          ) : block.kind === "paragraph" ? (
            <p key={index} className="mb-5 text-[15px] leading-8 text-black/65">
              {block.text}
            </p>
          ) : block.kind === "table" ? (
            <section key={index} className="my-7 overflow-hidden rounded-[18px] border border-black/10">
              <h3 className="bg-[#003441] px-5 py-4 font-serif text-[18px] text-white">
                {block.title}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-[13px] text-black/60">
                  <thead className="bg-[#003441]/[0.06] text-[#003441]">
                    <tr>
                      {block.columns.map((column, columnIndex) => (
                        <th key={`${column}-${columnIndex}`} className="px-5 py-4 font-semibold">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-black/[0.06]">
                        {row.map((cell, cellIndex) => (
                          <td key={`${cell}-${cellIndex}`} className="px-5 py-4">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : block.kind === "cards" ? (
            <section key={index} className="my-7">
              {block.title ? <h3 className="mb-4 font-serif text-[20px]">{block.title}</h3> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {block.cards.map((card, cardIndex) => (
                  <div
                    key={`${card.title}-${cardIndex}`}
                    className={`rounded-[16px] border p-5 ${block.variant === "yellow" ? "border-[#d59e1e]/25 bg-[#fff7cf]" : "border-black/[0.07] bg-[#fafafa]"}`}
                  >
                    <h4 className="text-[15px] font-semibold text-[#003441]">{card.title}</h4>
                    <p className="mt-2 text-[13px] leading-6 text-black/55">{card.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : block.kind === "callout" ? (
            <aside key={index} className="my-7 rounded-[16px] border border-[#d59e1e]/25 bg-[#fff7cf] p-5">
              {block.title ? <h3 className="text-[16px] font-semibold text-[#003441]">{block.title}</h3> : null}
              <p className="mt-2 text-[14px] leading-7 text-black/60">{block.text}</p>
            </aside>
          ) : block.kind === "image" ? (
            <figure key={index} className="my-7">
              <div
                className="aspect-[16/9] rounded-[18px] bg-cover bg-center"
                style={{ backgroundImage: `url(${block.imageUrl})` }}
                role="img"
                aria-label={block.alt}
              />
              {block.caption ? <figcaption className="mt-2 text-center text-[12px] text-black/40">{block.caption}</figcaption> : null}
            </figure>
          ) : block.kind === "quiz" ? (
            <div key={index} className="my-7 rounded-[16px] border border-[#003441]/10 bg-[#f1f7f6] p-5 text-[14px] font-semibold text-[#003441]">
              Quiz interactif intégré à l’article
            </div>
          ) : block.kind === "link" ? (
            <p key={index} className="mb-5 text-[15px] leading-8 text-black/65">
              {block.text}{" "}<span className="font-semibold text-[#003441]">{block.label}</span>
            </p>
          ) : null,
        )}
      </div>
    </article>
  );
}

function TextSection({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-[14px] border border-black/[0.06] bg-[#fafafa] p-5">
      <h3 className="font-serif text-[18px] text-[#1c1c1c]">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap">{text}</p>
    </section>
  );
}

function ListSection({
  title,
  items,
  inline = false,
}: {
  title: string;
  items: string[];
  inline?: boolean;
}) {
  return (
    <section>
      <h3 className="font-serif text-[20px] text-[#1c1c1c]">{title}</h3>
      <div className={`mt-3 ${inline ? "flex flex-wrap gap-2" : "grid gap-2"}`}>
        {items.map((item, index) =>
          inline ? (
            <span
              key={`${item}-${index}`}
              className="rounded-full bg-[#ededed] px-3 py-1 text-[12px] text-black/55"
            >
              {item}
            </span>
          ) : (
            <p
              key={`${item}-${index}`}
              className="whitespace-pre-wrap rounded-[12px] border border-black/[0.06] bg-[#fafafa] px-4 py-3"
            >
              {item}
            </p>
          ),
        )}
      </div>
    </section>
  );
}

function EmptyPhase({ text }: { text: string }) {
  return (
    <div className="grid min-h-[280px] place-items-center text-center">
      <div>
        <Sparkles size={24} className="mx-auto text-black/15" />
        <p className="mt-3 text-[13px] text-black/40">{text}</p>
      </div>
    </div>
  );
}
