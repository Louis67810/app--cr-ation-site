"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FilePenLine,
  Grip,
  Link2,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { DashboardProject } from "@/components/dashboard/dashboard-shell";
import type { ArticleOutline, EditorialMode, GeneratedArticle, ResearchBrief } from "@/lib/editorial-pipeline";
import type { ArticleDetailFields, EditorialPageStatus, SitePage } from "@/lib/site-template";

type PipelinePhase = "idle" | "research" | "outline" | "write" | "done";
type GeneratedDraft = { title: string; slug: string; sourceUrl?: string | null; agentName: string };

const modes: Array<{ id: EditorialMode; label: string }> = [
  { id: "seo", label: "SEO evergreen" },
  { id: "youtube", label: "Veille YouTube" },
  { id: "trends", label: "Tendances" },
  { id: "editorial", label: "Fiabilité éditoriale" },
];

const statusLabels: Record<EditorialPageStatus, string> = {
  pending: "À valider",
  approved: "Validé",
  rejected: "Refusé",
};

function getArticleFields(page: SitePage | null | undefined) {
  const section = page?.sections.find((candidate) => candidate.type === "article-detail");
  return section?.type === "article-detail" ? section.fields as ArticleDetailFields : null;
}

function getArticlePages(pages: SitePage[]) {
  return pages.filter((page) => page.slug.startsWith("/blog/") && page.slug !== "/blog");
}

function getTitle(page: SitePage) {
  return getArticleFields(page)?.title || page.title.replace(/^Article\s*-\s*/i, "");
}

function getCategory(page: SitePage, pages: SitePage[]) {
  if (page.editorial?.category) return page.editorial.category;
  for (const candidate of pages) {
    for (const section of candidate.sections) {
      if (section.type !== "blog-index" && section.type !== "blog-advice") continue;
      const post = section.fields.posts.find((item) => item.href === page.slug);
      if (post?.category) return post.category;
    }
  }
  return "Conseils";
}

function getStatus(page: SitePage): EditorialPageStatus {
  return page.editorial?.status ?? "pending";
}

function getRelativeDate(page: SitePage) {
  const raw = page.editorial?.updatedAt ?? page.editorial?.createdAt;
  if (!raw) return "Date inconnue";
  const days = Math.max(0, Math.floor((Date.now() - new Date(raw).getTime()) / 86_400_000));
  if (days === 0) return "Aujourd’hui";
  if (days === 1) return "Il y a 1j";
  return `Il y a ${days}j`;
}

function getHero(page: SitePage) {
  return getArticleFields(page)?.heroImageUrl ?? "";
}

export function AiAgents({ project }: { project: DashboardProject }) {
  const [pages, setPages] = useState(project.pages);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [mode, setMode] = useState<EditorialMode>("seo");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [message, setMessage] = useState("");
  const [researchResult, setResearchResult] = useState<ResearchBrief | null>(null);
  const [outlineResult, setOutlineResult] = useState<ArticleOutline | null>(null);
  const [articleResult, setArticleResult] = useState<GeneratedArticle | null>(null);
  const [failedPhase, setFailedPhase] = useState<Exclude<PipelinePhase, "idle" | "done"> | null>(null);
  const [savingPageId, setSavingPageId] = useState<string | null>(null);
  const articles = useMemo(() => getArticlePages(pages), [pages]);
  const running = phase !== "idle" && phase !== "done";

  async function callPhase<T>(body: Record<string, unknown>) {
    const response = await fetch("/api/ai-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, mode, topic: topic.trim(), source: source.trim() || undefined, projectKey: project.key, projectOwnerId: project.ownerId }),
    });
    const result = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Une étape de génération a échoué.");
    return result;
  }

  async function generatePages(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim() || running) return;
    setSelectedId("__live__");
    setMessage("");
    setResearchResult(null);
    setOutlineResult(null);
    setArticleResult(null);
    setFailedPhase(null);
    let current: Exclude<PipelinePhase, "idle" | "done"> = "research";
    try {
      setPhase("research");
      const research = await callPhase<{ research: ResearchBrief }>({ phase: "research" });
      setResearchResult(research.research);
      current = "outline";
      setPhase("outline");
      const outline = await callPhase<{ outline: ArticleOutline }>({ phase: "outline", research: research.research });
      setOutlineResult(outline.outline);
      current = "write";
      setPhase("write");
      const written = await callPhase<{ article: GeneratedArticle; page?: SitePage; draft: GeneratedDraft; warning?: string }>({ phase: "write", research: research.research, outline: outline.outline });
      setArticleResult(written.article);
      if (written.page) {
        setPages((existing) => [written.page as SitePage, ...existing.filter((page) => page.id !== written.page?.id)]);
        setSelectedId(written.page.id);
      }
      setMessage(written.warning ?? "La page article a été générée.");
      setPhase("done");
      setShowGenerator(false);
      setTopic("");
      setSource("");
    } catch (error) {
      setFailedPhase(current);
      setPhase("idle");
      setMessage(error instanceof Error ? error.message : "La génération a échoué.");
    }
  }

  async function setEditorialStatus(page: SitePage, status: EditorialPageStatus) {
    if (savingPageId) return;
    setSavingPageId(page.id);
    setMessage("");
    try {
      const response = await fetch("/api/ai-agents/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey: project.key, projectOwnerId: project.ownerId, pageId: page.id, status }),
      });
      const result = await response.json() as { updatedAt?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Le statut n’a pas pu être enregistré.");
      setPages((existing) => existing.map((candidate) => candidate.id === page.id ? {
        ...candidate,
        editorial: {
          status,
          mode: candidate.editorial?.mode ?? "editorial",
          category: candidate.editorial?.category ?? getCategory(candidate, existing),
          createdAt: candidate.editorial?.createdAt ?? new Date().toISOString(),
          updatedAt: result.updatedAt ?? new Date().toISOString(),
          research: candidate.editorial?.research,
          outline: candidate.editorial?.outline,
          article: candidate.editorial?.article,
        },
      } : candidate));
      setMessage(status === "approved" ? `« ${getTitle(page)} » a été validé.` : `« ${getTitle(page)} » a été refusé.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Le statut n’a pas pu être enregistré.");
    } finally {
      setSavingPageId(null);
    }
  }

  function exportCsv() {
    const rows = [["Type", "Page", "Catégorie", "Statut", "URL"], ...articles.map((page) => ["Page article", getTitle(page), getCategory(page, pages), statusLabels[getStatus(page)], page.slug])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pages-articles.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <div className="-mx-3 -mt-3 min-h-[1004px] bg-white font-[var(--font-inter)] text-[#1c1c1c] sm:-mx-6 sm:-mt-6">
    <header className="flex min-h-[148px] flex-col justify-center gap-5 px-6 py-8 sm:px-[clamp(32px,5.75vw,71px)] lg:flex-row lg:items-center lg:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-black/30">Agents IA · SEO</p><h1 className="mt-2 font-serif text-[32px] leading-none">Pages générées</h1></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={exportCsv} className="flex h-12 min-w-[127px] items-center justify-center gap-2 rounded-[9px] bg-[#f3f3f3] px-5 text-[14px] font-semibold tracking-[-.02em] text-[#222]"><Download size={15} />Export CSV</button>
        <button type="button" onClick={() => setShowGenerator((current) => !current)} className="flex h-12 min-w-[154px] items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222_100%)] px-5 text-[14px] font-semibold tracking-[-.02em] text-[#fcfcfc] shadow-[0_2px_4px_-1px_rgba(13,13,13,.5),0_0_0_1px_#333,inset_0_.5px_1px_rgba(255,255,255,.15),inset_0_-1px_1.2px_.35px_#121212]"><Plus size={16} />Générer des pages</button>
      </div>
    </header>

    {showGenerator ? <form onSubmit={generatePages} className="mx-6 mb-6 grid gap-3 rounded-[12px] border border-black/[0.07] bg-[#fafafa] p-4 sm:mx-[clamp(32px,5.75vw,71px)] lg:grid-cols-[180px_1fr_1fr_170px] lg:items-end"><label className="grid gap-1.5 text-[10px] font-semibold text-black/50">Agent<select value={mode} disabled={running} onChange={(event) => setMode(event.target.value as EditorialMode)} className="h-11 rounded-[8px] border border-black/10 bg-white px-3 text-[11px] outline-none">{modes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="grid gap-1.5 text-[10px] font-semibold text-black/50">Sujet<input value={topic} disabled={running} onChange={(event) => setTopic(event.target.value)} placeholder="Idée de l’article" className="h-11 rounded-[8px] border border-black/10 bg-white px-3 text-[11px] outline-none" /></label><label className="grid gap-1.5 text-[10px] font-semibold text-black/50">Source facultative<input value={source} disabled={running} onChange={(event) => setSource(event.target.value)} placeholder="Lien ou transcription" className="h-11 rounded-[8px] border border-black/10 bg-white px-3 text-[11px] outline-none" /></label><button type="submit" disabled={!topic.trim() || running} className="flex h-11 items-center justify-center gap-2 rounded-[9px] bg-[#222] text-[11px] font-semibold text-white disabled:opacity-40">{running ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}{phase === "research" ? "Recherche…" : phase === "outline" ? "Structure…" : phase === "write" ? "Rédaction…" : "Lancer les agents"}</button></form> : null}
    {message ? <p aria-live="polite" className="mx-6 mb-4 rounded-[8px] bg-[#f6f6f4] px-4 py-2 text-[10px] text-black/55 sm:mx-[clamp(32px,5.75vw,71px)]">{message}</p> : null}

    <section className="border-t border-black/[0.07]">
      {(running || selectedId === "__live__") ? <GeneratedRow label="Page article" title={topic || outlineResult?.title || articleResult?.title || "Nouvelle page SEO"} category={outlineResult?.category || "En génération"} status="pending" date={phase === "research" ? "Recherche" : phase === "outline" ? "Structure" : phase === "write" ? "Rédaction" : "Terminée"} hero="" loading={running} selected={selectedId === "__live__"} onOpen={() => setSelectedId(selectedId === "__live__" ? null : "__live__")} /> : null}
      {articles.map((page) => <div key={page.id}>
        <GeneratedRow label="Page article" title={getTitle(page)} category={getCategory(page, pages)} status={getStatus(page)} date={getRelativeDate(page)} hero={getHero(page)} loading={savingPageId === page.id} selected={selectedId === page.id} onApprove={() => setEditorialStatus(page, "approved")} onReject={() => setEditorialStatus(page, "rejected")} onOpen={() => setSelectedId(selectedId === page.id ? null : page.id)} />
        {selectedId === page.id ? <div className="border-b border-black/[0.07] bg-[#fafafa] px-4 py-5 sm:px-[clamp(24px,4vw,52px)]"><WorkflowDetails research={page.editorial?.research ?? null} outline={page.editorial?.outline ?? null} article={page.editorial?.article ?? null} fields={getArticleFields(page)} phase="done" failedPhase={null} /></div> : null}
      </div>)}
      {selectedId === "__live__" ? <div className="border-b border-black/[0.07] bg-[#fafafa] px-4 py-5 sm:px-[clamp(24px,4vw,52px)]"><WorkflowDetails research={researchResult} outline={outlineResult} article={articleResult} fields={null} phase={phase} failedPhase={failedPhase} /></div> : null}
      {!articles.length && !running ? <div className="grid min-h-[300px] place-items-center text-center"><div><FilePenLine size={28} className="mx-auto text-black/15" /><p className="mt-3 text-[12px] text-black/40">Aucune page article générée.</p></div></div> : null}
    </section>
  </div>;
}

function GeneratedRow({ label, title, category, status, date, hero, loading, selected, onApprove, onReject, onOpen }: { label: string; title: string; category: string; status: EditorialPageStatus; date: string; hero: string; loading: boolean; selected: boolean; onApprove?: () => void; onReject?: () => void; onOpen: () => void }) {
  const approved = status === "approved";
  return <div className={`grid min-h-[74px] border-b border-black/[0.07] bg-white transition md:grid-cols-[199px_minmax(0,1fr)] ${selected ? "bg-[#fcfcfb]" : ""}`}>
    <div className="flex items-center justify-center gap-3 px-5 py-3 md:border-r md:border-black/[0.07]"><Grip size={15} className="text-[#d9d9d9]" /><div><p className="font-serif text-[16px] leading-none">{label}</p><p className="mt-1 text-[9px] text-black/35">{category}</p></div></div>
    <div className="flex flex-col gap-3 px-4 py-3 sm:px-[21px] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-[45px] w-[62px] shrink-0 rounded-[6px] border border-black/[0.07] bg-[#d9d9d9] bg-cover bg-center" style={hero ? { backgroundImage: `url("${hero.replaceAll('"', '%22')}")` } : undefined} />
        <div className="min-w-0"><p className="truncate text-[14px] font-medium leading-5 text-black/60">{title}</p><div className="mt-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-[5px] text-[11px] leading-4 ${status === "approved" ? "bg-[#ebffe8] text-[#37982a]" : "bg-[#fbc5c5] text-[#570000]"}`}>{statusLabels[status]}</span><span className="text-[12px] leading-5 text-black/55">{date}</span></div></div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        {approved ? <span className="grid size-8 place-items-center rounded-full bg-[#ebffe8] text-[#37982a]"><CheckCircle2 size={18} /></span> : <div className="flex items-center gap-2"><button type="button" disabled={loading} onClick={onApprove} className="flex h-9 min-w-[68px] items-center justify-center rounded-[27px] border border-black/[0.08] bg-[#4ac872] px-3 text-[14px] text-white shadow-[0_7px_4px_rgba(0,0,0,.02),0_3px_3px_rgba(0,0,0,.03),0_1px_2px_rgba(0,0,0,.03)] [text-shadow:0_1px_0_rgba(0,0,0,.25)] disabled:opacity-50">{loading ? <LoaderCircle size={13} className="animate-spin" /> : "Valider"}</button><button type="button" disabled={loading} onClick={onReject} className="flex h-9 min-w-[74px] items-center justify-center rounded-[27px] border border-black/[0.08] bg-[#e1957e] px-3 text-[14px] text-white shadow-[0_7px_4px_rgba(0,0,0,.02),0_3px_3px_rgba(0,0,0,.03),0_1px_2px_rgba(0,0,0,.03)] [text-shadow:0_1px_0_rgba(0,0,0,.25)] disabled:opacity-50">Refuser</button></div>}
        <button type="button" onClick={onOpen} aria-label={selected ? "Fermer le détail" : "Ouvrir le détail"} className="grid size-[36px] place-items-center rounded-[6px] border border-black/10 bg-white text-[#525866]"><ExternalLink size={18} /></button>
      </div>
    </div>
  </div>;
}

function WorkflowDetails({ research, outline, article, fields, phase, failedPhase }: { research: ResearchBrief | null; outline: ArticleOutline | null; article: GeneratedArticle | null; fields: ArticleDetailFields | null; phase: PipelinePhase; failedPhase: Exclude<PipelinePhase, "idle" | "done"> | null }) {
  const blocks = article?.blocks ?? fields?.blocks.filter((block) => block.kind === "heading" || block.kind === "paragraph") ?? [];
  return <div className="mx-auto grid max-w-[1050px] gap-3"><h2 className="font-serif text-[22px]">Détail de la production</h2>
    <DetailFolder title="Recherche" icon={<Search size={15} />} active={phase === "research"} failed={failedPhase === "research"} complete={Boolean(research)}>{research ? <div className="grid gap-4 lg:grid-cols-[1fr_.75fr]"><div><p className="text-[12px] leading-6 text-black/65">{research.summary}</p><h4 className="mt-4 text-[10px] font-semibold uppercase tracking-[.1em] text-black/35">Faits et sources</h4><div className="mt-2 grid gap-2">{research.facts.map((fact, index) => <div key={`${fact.sourceUrl}-${index}`} className="rounded-[8px] border border-black/[0.07] bg-white p-3"><p className="text-[10px] leading-5 text-black/60">{fact.claim}</p><a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-[9px] text-[#347b51]"><Link2 size={10} />{fact.sourceTitle}<ExternalLink size={9} /></a></div>)}</div></div><div className="grid content-start gap-2"><Info title="Intention" text={research.searchIntent} /><Info title="Angle" text={research.angle} /><Info title="Questions" text={research.questions.map((question, index) => `${index + 1}. ${question}`).join("\n")} /></div></div> : <Empty loading={phase === "research"} text="Aucun dossier de recherche enregistré." />}</DetailFolder>
    <DetailFolder title="Structure" icon={<Bot size={15} />} active={phase === "outline"} failed={failedPhase === "outline"} complete={Boolean(outline)}>{outline ? <div><h3 className="font-serif text-[20px]">{outline.title}</h3><p className="mt-2 text-[10px] leading-5 text-black/50">{outline.excerpt}</p><ol className="mt-4 grid gap-2">{outline.sections.map((section, index) => <li key={`${section.title}-${index}`} className="grid gap-2 rounded-[8px] border border-black/[0.07] bg-white p-3 sm:grid-cols-[55px_1fr]"><span className="text-[9px] font-semibold text-[#347b51]">{section.level} · {index + 1}</span><div><p className="text-[11px] font-semibold">{section.title}</p><p className="mt-1 text-[9px] text-black/45">{section.purpose}</p></div></li>)}</ol></div> : <Empty loading={phase === "outline"} text="Aucun plan éditorial enregistré." />}</DetailFolder>
    <DetailFolder title="Rédaction" icon={<FilePenLine size={15} />} active={phase === "write"} failed={failedPhase === "write"} complete={Boolean(blocks.length)}>{blocks.length ? <div className="mx-auto max-w-3xl">{blocks.map((block, index) => block.kind === "heading" ? block.level === "h3" ? <h4 key={index} className="mb-2 mt-5 text-[13px] font-semibold">{block.text}</h4> : <h3 key={index} className="mb-2 mt-6 font-serif text-[19px]">{block.text}</h3> : block.kind === "paragraph" ? <p key={index} className="mb-3 text-[11px] leading-6 text-black/60">{block.text}</p> : null)}</div> : <Empty loading={phase === "write"} text="Le texte final n’est pas encore disponible." />}</DetailFolder>
  </div>;
}

function DetailFolder({ title, icon, active, failed, complete, children }: { title: string; icon: React.ReactNode; active: boolean; failed: boolean; complete: boolean; children: React.ReactNode }) {
  return <section className={`overflow-hidden rounded-[10px] border bg-white ${active ? "border-[#4ac872]" : failed ? "border-[#e1957e]" : "border-black/[0.07]"}`}><header className="flex h-12 items-center gap-2 border-b border-black/[0.07] px-4"><span className={`grid size-7 place-items-center rounded-[7px] ${complete ? "bg-[#ebffe8] text-[#37982a]" : active ? "bg-[#4ac872] text-white" : failed ? "bg-[#fbc5c5] text-[#570000]" : "bg-[#f3f3f3] text-black/35"}`}>{active ? <LoaderCircle size={14} className="animate-spin" /> : failed ? <X size={14} /> : complete ? <Check size={14} /> : icon}</span><h3 className="font-serif text-[16px]">{title}</h3><span className="ml-auto text-[9px] text-black/35">{active ? "En cours" : failed ? "Erreur" : complete ? "Terminé" : "En attente"}</span></header><div className="bg-[#fafafa] p-4">{children}</div></section>;
}

function Info({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[8px] bg-white p-3"><p className="text-[9px] font-semibold uppercase tracking-[.1em] text-black/35">{title}</p><p className="mt-1 whitespace-pre-line text-[9px] leading-4 text-black/55">{text}</p></div>;
}

function Empty({ loading, text }: { loading: boolean; text: string }) {
  return <div className="grid min-h-20 place-items-center text-center">{loading ? <LoaderCircle size={16} className="animate-spin text-[#37982a]" /> : <p className="text-[9px] text-black/35">{text}</p>}</div>;
}
