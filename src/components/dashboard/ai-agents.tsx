"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Bot, Check, CheckCircle2, Circle, ExternalLink, FilePenLine, Laptop, Link2, LoaderCircle, Search, ShieldCheck, Sparkles, TrendingUp, Video } from "lucide-react";
import type { DashboardProject } from "@/components/dashboard/dashboard-shell";
import type { ArticleOutline, EditorialMode, GeneratedArticle, ResearchBrief } from "@/lib/editorial-pipeline";

type ModeDefinition = {
  id: EditorialMode;
  name: string;
  eyebrow: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  Icon: typeof Search;
  color: string;
};

const modes: ModeDefinition[] = [
  { id: "seo", name: "SEO evergreen", eyebrow: "Intention de recherche", description: "Construit un article durable autour d’une question réellement recherchée par les clients d’un paysagiste.", inputLabel: "Sujet de l’article", placeholder: "Ex. Quand et comment tailler une haie de laurier ?", Icon: Search, color: "#00bbfe" },
  { id: "youtube", name: "Veille YouTube", eyebrow: "Tutoriels populaires", description: "Recherche des tutoriels et sources utiles, puis produit un article original sans recopier la vidéo.", inputLabel: "Recherche YouTube", placeholder: "Ex. refaire une pelouse abîmée", Icon: Video, color: "#ff4d4f" },
  { id: "trends", name: "Tendances", eyebrow: "Sujets du moment", description: "Analyse les préoccupations saisonnières : météo, sécheresse, maladies, ravageurs et questions émergentes.", inputLabel: "Zone ou thème à surveiller", placeholder: "Ex. Dordogne, maladies des rosiers, canicule", Icon: TrendingUp, color: "#ff9f43" },
  { id: "editorial", name: "Fiabilité", eyebrow: "Qualité éditoriale", description: "Renforce la vérification des faits, la prudence des conseils et la qualité des sources utilisées.", inputLabel: "Sujet à vérifier", placeholder: "Ex. traiter naturellement le mildiou des tomates", Icon: ShieldCheck, color: "#35b77a" },
];

const pipelineSteps = [
  { id: "research", label: "Recherche", description: "Sources, faits et intention", Icon: Search },
  { id: "outline", label: "Structure", description: "Titre, angle et plan H2/H3", Icon: Bot },
  { id: "write", label: "Rédaction", description: "Article final et brouillon CMS", Icon: FilePenLine },
] as const;

type PipelinePhase = "idle" | "research" | "outline" | "write" | "done";
type GeneratedDraft = { title: string; slug: string; sourceUrl?: string | null; agentName: string };

function subscribeToLocation() {
  return () => undefined;
}

function getLocalSnapshot() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export function AiAgents({ project }: { project: DashboardProject }) {
  const [selectedId, setSelectedId] = useState<EditorialMode>("seo");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<GeneratedDraft[]>([]);
  const [researchResult, setResearchResult] = useState<ResearchBrief | null>(null);
  const [outlineResult, setOutlineResult] = useState<ArticleOutline | null>(null);
  const [articleResult, setArticleResult] = useState<GeneratedArticle | null>(null);
  const [draftResult, setDraftResult] = useState<GeneratedDraft | null>(null);
  const [failedPhase, setFailedPhase] = useState<Exclude<PipelinePhase, "idle" | "done"> | null>(null);
  const isLocal = useSyncExternalStore(subscribeToLocation, getLocalSnapshot, () => null);
  const selected = modes.find((mode) => mode.id === selectedId) ?? modes[0];
  const running = phase !== "idle" && phase !== "done";

  async function callPhase<T>(body: Record<string, unknown>) {
    const response = await fetch("/api/ai-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        mode: selected.id,
        topic: topic.trim(),
        source: source.trim() || undefined,
        projectKey: project.key,
        projectOwnerId: project.ownerId,
      }),
    });
    const result = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Une phase du pipeline a échoué.");
    return result;
  }

  async function runPipeline(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim() || running) return;
    setMessage("");
    setResearchResult(null);
    setOutlineResult(null);
    setArticleResult(null);
    setDraftResult(null);
    setFailedPhase(null);
    let activePhase: Exclude<PipelinePhase, "idle" | "done"> = "research";
    try {
      setPhase("research");
      const researchResult = await callPhase<{ research: ResearchBrief }>({ phase: "research" });
      setResearchResult(researchResult.research);

      activePhase = "outline";
      setPhase("outline");
      const outlineResult = await callPhase<{ outline: ArticleOutline }>({ phase: "outline", research: researchResult.research });
      setOutlineResult(outlineResult.outline);

      activePhase = "write";
      setPhase("write");
      const writeResult = await callPhase<{ article: GeneratedArticle; draft: GeneratedDraft; warning?: string }>({ phase: "write", research: researchResult.research, outline: outlineResult.outline });
      if (!writeResult.draft) throw new Error("Le brouillon final n’a pas été retourné.");

      setArticleResult(writeResult.article);
      setDraftResult(writeResult.draft);
      setDrafts((current) => [writeResult.draft, ...current]);
      setMessage(writeResult.warning ?? "Le brouillon a été ajouté au CMS Articles.");
      setTopic("");
      setSource("");
      setPhase("done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Le pipeline éditorial a échoué.");
      setFailedPhase(activePhase);
      setPhase("idle");
    }
  }

  const phaseIndex = phase === "done" ? pipelineSteps.length : pipelineSteps.findIndex((step) => step.id === phase);

  return (
    <div className="pb-8 font-[var(--font-inter)] sm:pb-16">
      <header className="max-w-3xl">
        <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-[9px] bg-[#eef9ff] text-[#008fc5]"><Sparkles size={16} /></span><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-black/35">Atelier IA</span></div>
        <h1 className="mt-4 font-serif text-[27px] leading-tight tracking-[-0.05em] sm:text-[32px]">Une chaîne éditoriale en trois agents</h1>
        <p className="mt-2 text-[13px] font-medium leading-5 text-black/55 sm:text-[14px]">Un clic lance la recherche, la structuration puis la rédaction. Seul le brouillon final est enregistré dans le CMS de {project.name}.</p>
      </header>

      <div className={`mt-6 flex items-start gap-3 rounded-[12px] border px-4 py-3 ${isLocal ? "border-[#bde8cf] bg-[#f1fbf5]" : "border-[#eadfbf] bg-[#fffaf0]"}`}>
        <Laptop size={18} className={`mt-0.5 shrink-0 ${isLocal ? "text-[#258653]" : "text-[#9a711d]"}`} />
        <div>
          <p className="text-[11px] font-semibold">{isLocal ? "Exécution locale active" : "Exécution hébergée"}</p>
          <p className="mt-0.5 text-[10px] leading-4 text-black/50">{isLocal ? "Les trois agents tournent sur ce PC. Supabase sert uniquement à charger le projet et sauvegarder le brouillon final." : "Cette page est ouverte sur Vercel. Pour faire travailler votre PC, lancez npm run local puis ouvrez l’atelier sur localhost:3000."}</p>
        </div>
      </div>

      <section className="mt-5 grid gap-2 rounded-[14px] border border-[#e3e6e8] bg-white p-3 sm:grid-cols-3 sm:p-4">
        {pipelineSteps.map((step, index) => {
          const active = step.id === phase;
          const complete = phase === "done" || (phaseIndex >= 0 && index < phaseIndex);
          return <div key={step.id} className={`flex items-center gap-3 rounded-[10px] px-3 py-3 transition ${active ? "bg-[#f0f9fd]" : "bg-[#f8f8f7]"}`}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${complete ? "bg-[#2b8a57] text-white" : active ? "bg-[#008fc5] text-white" : "bg-white text-black/35"}`}>{complete ? <Check size={15} /> : active ? <LoaderCircle size={15} className="animate-spin" /> : <step.Icon size={15} />}</span>
            <span><strong className="block text-[11px]">{index + 1}. {step.label}</strong><span className="mt-0.5 block text-[9px] text-black/40">{step.description}</span></span>
          </div>;
        })}
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {modes.map((mode) => {
          const active = selectedId === mode.id;
          return <button key={mode.id} type="button" disabled={running} onClick={() => { setSelectedId(mode.id); setMessage(""); if (phase === "done") setPhase("idle"); }} aria-pressed={active} className={`${active ? "border-black/20 bg-white shadow-[0_12px_32px_rgba(0,0,0,.08)]" : "border-[#e8ecee] bg-[#f9f9f9] hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"} min-h-[180px] rounded-[14px] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60`}>
            <span className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-[10px] bg-white shadow-sm" style={{ color: mode.color }}><mode.Icon size={19} /></span>{active ? <CheckCircle2 size={17} className="text-black/55" /> : <Circle size={17} className="text-black/15" />}</span>
            <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[.12em] text-black/35">{mode.eyebrow}</span>
            <strong className="mt-1.5 block font-serif text-[20px] font-normal">{mode.name}</strong>
            <span className="mt-2 block text-[11px] leading-[1.55] text-black/45">{mode.description}</span>
          </button>;
        })}
      </div>

      <section className="mt-5 overflow-hidden rounded-[14px] border border-[#e3e6e8] bg-white shadow-[0_12px_35px_rgba(0,0,0,.05)]">
        <div className="flex items-center gap-3 border-b border-black/[0.07] p-4 sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#f5f5f5]" style={{ color: selected.color }}><selected.Icon size={19} /></span><div><h2 className="font-serif text-[21px]">Lancer le pipeline {selected.name}</h2><p className="mt-0.5 text-[10px] text-black/40">Trois agents successifs · un brouillon non publié</p></div></div>
        <form onSubmit={runPipeline} className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.45fr)]">
          <div>
            <label htmlFor="ai-topic" className="text-[11px] font-semibold text-black/60">{selected.inputLabel}</label>
            <textarea id="ai-topic" value={topic} disabled={running} onChange={(event) => setTopic(event.target.value)} rows={4} maxLength={600} placeholder={selected.placeholder} className="mt-2 w-full resize-y rounded-[10px] border border-black/10 bg-[#fbfbfb] px-3 py-3 text-[13px] leading-5 outline-none focus:border-black/25 disabled:opacity-60" />
            <label htmlFor="ai-source" className="mt-4 block text-[11px] font-semibold text-black/60">Source, lien ou transcription <span className="font-normal text-black/35">(facultatif)</span></label>
            <textarea id="ai-source" value={source} disabled={running} onChange={(event) => setSource(event.target.value)} rows={3} maxLength={12000} placeholder="Collez une URL ou une transcription pour imposer une source au premier agent." className="mt-2 w-full resize-y rounded-[10px] border border-black/10 bg-[#fbfbfb] px-3 py-3 text-[12px] leading-5 outline-none focus:border-black/25 disabled:opacity-60" />
          </div>
          <div className="flex flex-col rounded-[11px] bg-[#f7f7f6] p-4">
            <div className="flex items-start gap-2.5"><Bot size={17} className="mt-0.5 shrink-0 text-black/45" /><p className="text-[11px] leading-5 text-black/50">Le premier agent rassemble les sources. Le deuxième transforme la recherche en plan. Le troisième rédige uniquement à partir de ce dossier et ajoute le résultat au CMS.</p></div>
            <button type="submit" disabled={!topic.trim() || running} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232,#222)] px-5 text-[13px] font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-40 xl:mt-auto">{running ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}{phase === "research" ? "Recherche en cours…" : phase === "outline" ? "Structure en cours…" : phase === "write" ? "Rédaction en cours…" : "Lancer les 3 agents"}</button>
          </div>
        </form>
        {message ? <div aria-live="polite" className="border-t border-black/[0.07] px-4 py-3 text-[11px] leading-5 text-black/55 sm:px-5">{message}</div> : null}
      </section>

      <section className="mt-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="font-serif text-[23px]">Détail de toutes les étapes</h2><p className="mt-1 text-[11px] text-black/40">Les résultats restent visibles au fur et à mesure de l’avancement.</p></div>
          <span className="text-[10px] font-medium text-black/35">Recherche → Structure → Rédaction</span>
        </div>

        <div className="mt-4 grid gap-4">
          <article className={`overflow-hidden rounded-[14px] border bg-white ${phase === "research" ? "border-[#7bcbea] shadow-[0_10px_30px_rgba(0,143,197,.09)]" : failedPhase === "research" ? "border-red-200" : "border-[#e3e6e8]"}`}>
            <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3.5 sm:px-5">
              <span className={`grid size-9 place-items-center rounded-full ${researchResult ? "bg-[#2b8a57] text-white" : phase === "research" ? "bg-[#008fc5] text-white" : failedPhase === "research" ? "bg-red-50 text-red-500" : "bg-[#f4f4f3] text-black/35"}`}>{researchResult ? <Check size={15} /> : phase === "research" ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />}</span>
              <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-black/35">Étape 1</p><h3 className="font-serif text-[19px]">Dossier de recherche</h3></div>
              <span className="rounded-full bg-[#f5f5f4] px-2.5 py-1 text-[9px] font-semibold text-black/45">{researchResult ? "Terminée" : phase === "research" ? "En cours" : failedPhase === "research" ? "Erreur" : "En attente"}</span>
            </div>
            {researchResult ? <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_.8fr]">
              <div>
                <p className="text-[13px] leading-6 text-black/65">{researchResult.summary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-[10px] bg-[#f7f7f6] p-3"><span className="text-[9px] font-semibold uppercase tracking-[.1em] text-black/35">Intention</span><p className="mt-1 text-[11px] leading-5 text-black/60">{researchResult.searchIntent}</p></div><div className="rounded-[10px] bg-[#f7f7f6] p-3"><span className="text-[9px] font-semibold uppercase tracking-[.1em] text-black/35">Angle retenu</span><p className="mt-1 text-[11px] leading-5 text-black/60">{researchResult.angle}</p></div></div>
                <h4 className="mt-5 text-[11px] font-semibold">Faits à intégrer</h4>
                <ul className="mt-2 grid gap-2">{researchResult.facts.map((fact, index) => <li key={`${fact.sourceUrl}-${index}`} className="rounded-[9px] border border-black/[0.06] p-3"><p className="text-[11px] leading-5 text-black/60">{fact.claim}</p><a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-[#087da7] hover:underline"><Link2 size={10} />{fact.sourceTitle || fact.sourceUrl}<ExternalLink size={9} /></a></li>)}</ul>
              </div>
              <div>
                <div className="rounded-[10px] bg-[#f7f7f6] p-4"><h4 className="text-[11px] font-semibold">Questions auxquelles répondre</h4><ol className="mt-2 grid gap-1.5">{researchResult.questions.map((question, index) => <li key={question} className="flex gap-2 text-[10px] leading-4 text-black/55"><span className="font-semibold text-black/30">{index + 1}.</span>{question}</li>)}</ol></div>
                <div className="mt-3 rounded-[10px] bg-[#f7f7f6] p-4"><h4 className="text-[11px] font-semibold">Mots-clés naturels</h4><div className="mt-2 flex flex-wrap gap-1.5">{researchResult.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-white px-2 py-1 text-[9px] text-black/50">{keyword}</span>)}</div></div>
                {researchResult.safetyNotes.length ? <div className="mt-3 rounded-[10px] border border-[#eadfbf] bg-[#fffaf0] p-4"><h4 className="text-[11px] font-semibold text-[#795b1f]">Points de vigilance</h4><ul className="mt-2 grid gap-1.5">{researchResult.safetyNotes.map((note) => <li key={note} className="text-[10px] leading-4 text-black/55">• {note}</li>)}</ul></div> : null}
              </div>
            </div> : <div className="px-4 py-7 text-center text-[11px] text-black/35 sm:px-5">Le dossier sourcé apparaîtra ici dès que le premier agent aura terminé.</div>}
          </article>

          <article className={`overflow-hidden rounded-[14px] border bg-white ${phase === "outline" ? "border-[#7bcbea] shadow-[0_10px_30px_rgba(0,143,197,.09)]" : failedPhase === "outline" ? "border-red-200" : "border-[#e3e6e8]"}`}>
            <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3.5 sm:px-5"><span className={`grid size-9 place-items-center rounded-full ${outlineResult ? "bg-[#2b8a57] text-white" : phase === "outline" ? "bg-[#008fc5] text-white" : failedPhase === "outline" ? "bg-red-50 text-red-500" : "bg-[#f4f4f3] text-black/35"}`}>{outlineResult ? <Check size={15} /> : phase === "outline" ? <LoaderCircle size={15} className="animate-spin" /> : <Bot size={15} />}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-black/35">Étape 2</p><h3 className="font-serif text-[19px]">Structure de l’article</h3></div><span className="rounded-full bg-[#f5f5f4] px-2.5 py-1 text-[9px] font-semibold text-black/45">{outlineResult ? "Terminée" : phase === "outline" ? "En cours" : failedPhase === "outline" ? "Erreur" : "En attente"}</span></div>
            {outlineResult ? <div className="p-4 sm:p-5"><div className="max-w-3xl"><span className="text-[9px] font-semibold uppercase tracking-[.1em] text-black/35">Titre proposé</span><h4 className="mt-1 font-serif text-[22px] leading-tight">{outlineResult.title}</h4><p className="mt-2 text-[11px] leading-5 text-black/50">{outlineResult.excerpt}</p><div className="mt-3 flex flex-wrap gap-2 text-[9px] text-black/45"><span className="rounded-full bg-[#f5f5f4] px-2.5 py-1">{outlineResult.category}</span><span className="rounded-full bg-[#f5f5f4] px-2.5 py-1">{outlineResult.readingTime}</span><span className="rounded-full bg-[#f5f5f4] px-2.5 py-1">/{outlineResult.slug}</span></div></div><ol className="mt-5 grid gap-2">{outlineResult.sections.map((section, index) => <li key={`${section.title}-${index}`} className="grid gap-2 rounded-[10px] border border-black/[0.06] p-3 sm:grid-cols-[70px_minmax(0,1fr)]"><span className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#008fc5]">{section.level} · {index + 1}</span><div><p className="text-[12px] font-semibold">{section.title}</p><p className="mt-1 text-[10px] leading-4 text-black/45">{section.purpose}</p><div className="mt-2 flex flex-wrap gap-1.5">{section.points.map((point) => <span key={point} className="rounded-full bg-[#f6f6f5] px-2 py-1 text-[9px] text-black/45">{point}</span>)}</div></div></li>)}</ol></div> : <div className="px-4 py-7 text-center text-[11px] text-black/35 sm:px-5">Le titre et le plan H2/H3 apparaîtront ici après la recherche.</div>}
          </article>

          <article className={`overflow-hidden rounded-[14px] border bg-white ${phase === "write" ? "border-[#7bcbea] shadow-[0_10px_30px_rgba(0,143,197,.09)]" : failedPhase === "write" ? "border-red-200" : "border-[#e3e6e8]"}`}>
            <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3.5 sm:px-5"><span className={`grid size-9 place-items-center rounded-full ${articleResult ? "bg-[#2b8a57] text-white" : phase === "write" ? "bg-[#008fc5] text-white" : failedPhase === "write" ? "bg-red-50 text-red-500" : "bg-[#f4f4f3] text-black/35"}`}>{articleResult ? <Check size={15} /> : phase === "write" ? <LoaderCircle size={15} className="animate-spin" /> : <FilePenLine size={15} />}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-black/35">Étape 3</p><h3 className="font-serif text-[19px]">Rédaction finale</h3></div><span className="rounded-full bg-[#f5f5f4] px-2.5 py-1 text-[9px] font-semibold text-black/45">{articleResult ? "Terminée" : phase === "write" ? "En cours" : failedPhase === "write" ? "Erreur" : "En attente"}</span></div>
            {articleResult ? <div className="p-4 sm:p-5"><div className="flex flex-col gap-3 border-b border-black/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-3xl"><h4 className="font-serif text-[24px] leading-tight">{articleResult.title}</h4><p className="mt-2 text-[11px] leading-5 text-black/50">{articleResult.excerpt}</p></div>{draftResult ? <Link href={`/dashboard?project=${encodeURIComponent(project.key)}&tab=cms`} className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-black px-3 text-[10px] font-semibold text-white">Ouvrir dans le CMS<ExternalLink size={11} /></Link> : null}</div><div className="mx-auto mt-5 max-w-3xl">{articleResult.blocks.map((block, index) => block.kind === "heading" ? block.level === "h3" ? <h6 key={index} className="mb-2 mt-5 text-[14px] font-semibold">{block.text}</h6> : <h5 key={index} className="mb-2 mt-7 font-serif text-[20px]">{block.text}</h5> : <p key={index} className="mb-3 text-[12px] leading-6 text-black/65">{block.text}</p>)}</div></div> : <div className="px-4 py-7 text-center text-[11px] text-black/35 sm:px-5">Le texte complet et son accès au CMS apparaîtront ici après validation du plan.</div>}
          </article>
        </div>
      </section>

      {drafts.length ? <section className="mt-8"><div className="flex items-end justify-between gap-3"><div><h2 className="font-serif text-[23px]">Brouillons créés</h2><p className="mt-1 text-[11px] text-black/40">Disponibles immédiatement dans la collection Articles.</p></div><Link href={`/dashboard?project=${encodeURIComponent(project.key)}&tab=cms`} className="flex items-center gap-1.5 text-[11px] font-semibold text-black/55 hover:text-black">Ouvrir le CMS<ExternalLink size={13} /></Link></div><div className="mt-4 overflow-hidden rounded-[13px] border border-[#e8ecee] bg-white">{drafts.map((draft) => <div key={draft.slug} className="flex flex-col gap-2 border-b border-black/[0.06] px-4 py-3 last:border-0 min-[460px]:flex-row min-[460px]:items-center"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef9ff] text-[#008fc5]"><Sparkles size={14} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{draft.title}</p><p className="mt-0.5 text-[10px] text-black/40">{draft.agentName} · 3 phases terminées</p></div>{draft.sourceUrl ? <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="ml-10 flex items-center gap-1 text-[10px] text-black/45 hover:text-black min-[460px]:ml-0">Source<ExternalLink size={11} /></a> : null}</div>)}</div></section> : null}
    </div>
  );
}
