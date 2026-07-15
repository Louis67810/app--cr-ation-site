"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, ExternalLink, LoaderCircle, Search, ShieldCheck, Sparkles, TrendingUp, Video } from "lucide-react";
import type { DashboardProject } from "@/components/dashboard/dashboard-shell";

type AgentId = "seo" | "youtube" | "trends" | "editorial";

type AgentDefinition = {
  id: AgentId;
  name: string;
  eyebrow: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  Icon: typeof Search;
  color: string;
};

const agents: AgentDefinition[] = [
  { id: "seo", name: "Rédacteur SEO", eyebrow: "Contenu evergreen", description: "Crée un article utile et durable à partir d’un sujet classique recherché par les clients d’un paysagiste.", inputLabel: "Sujet de l’article", placeholder: "Ex. Quand et comment tailler une haie de laurier ?", Icon: Search, color: "#00bbfe" },
  { id: "youtube", name: "Veille YouTube", eyebrow: "Tutoriels populaires", description: "Repère un tutoriel populaire, en extrait les idées utiles et produit un article original sans recopier la vidéo.", inputLabel: "Recherche YouTube", placeholder: "Ex. refaire une pelouse abîmée", Icon: Video, color: "#ff4d4f" },
  { id: "trends", name: "Veille tendances", eyebrow: "Sujets du moment", description: "Recherche les préoccupations qui progressent : maladies, météo, sécheresse, ravageurs et questions saisonnières.", inputLabel: "Zone ou thème à surveiller", placeholder: "Ex. Dordogne, maladies des rosiers, canicule", Icon: TrendingUp, color: "#ff9f43" },
  { id: "editorial", name: "Contrôleur éditorial", eyebrow: "Qualité & fiabilité", description: "Produit un article avec vérification des faits, structure SEO, intention de recherche et recommandations prudentes.", inputLabel: "Sujet à vérifier", placeholder: "Ex. traiter naturellement le mildiou des tomates", Icon: ShieldCheck, color: "#35b77a" },
];

type GeneratedDraft = { title: string; slug: string; sourceUrl?: string | null; agentName: string };

export function AiAgents({ project }: { project: DashboardProject }) {
  const [selectedId, setSelectedId] = useState<AgentId>("seo");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<GeneratedDraft[]>([]);
  const selected = agents.find((agent) => agent.id === selectedId) ?? agents[0];

  async function runAgent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim() || running) return;
    setRunning(true);
    setMessage(`${selected.name} analyse le sujet et prépare le brouillon…`);
    try {
      const response = await fetch("/api/ai-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selected.id,
          topic: topic.trim(),
          source: source.trim() || undefined,
          projectKey: project.key,
          projectOwnerId: project.ownerId,
        }),
      });
      const result = await response.json() as { draft?: GeneratedDraft; warning?: string; error?: string };
      if (!response.ok || !result.draft) throw new Error(result.error ?? "La génération a échoué.");
      setDrafts((current) => [result.draft as GeneratedDraft, ...current]);
      setMessage(result.warning ?? "Le brouillon a été ajouté au CMS Articles. Il reste non publié.");
      setTopic("");
      setSource("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La génération a échoué.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="pb-8 font-[var(--font-inter)] sm:pb-16">
      <header className="max-w-3xl">
        <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-[9px] bg-[#eef9ff] text-[#008fc5]"><Sparkles size={16} /></span><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-black/35">Atelier IA</span></div>
        <h1 className="mt-4 font-serif text-[27px] leading-tight tracking-[-0.05em] sm:text-[32px]">Vos agents éditoriaux</h1>
        <p className="mt-2 text-[13px] font-medium leading-5 text-black/55 sm:text-[14px]">Chaque agent travaille uniquement pour {project.name}. Les contenus arrivent en brouillon dans le CMS et nécessitent toujours votre validation avant publication.</p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => {
          const active = selectedId === agent.id;
          return <button key={agent.id} type="button" onClick={() => { setSelectedId(agent.id); setMessage(""); }} aria-pressed={active} className={`${active ? "border-black/20 bg-white shadow-[0_12px_32px_rgba(0,0,0,.08)]" : "border-[#e8ecee] bg-[#f9f9f9] hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"} min-h-[190px] rounded-[14px] border p-4 text-left transition`}>
            <span className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-[10px] bg-white shadow-sm" style={{ color: agent.color }}><agent.Icon size={19} /></span>{active ? <CheckCircle2 size={17} className="text-black/55" /> : null}</span>
            <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[.12em] text-black/35">{agent.eyebrow}</span>
            <strong className="mt-1.5 block font-serif text-[20px] font-normal">{agent.name}</strong>
            <span className="mt-2 block text-[11px] leading-[1.55] text-black/45">{agent.description}</span>
          </button>;
        })}
      </div>

      <section className="mt-5 overflow-hidden rounded-[14px] border border-[#e3e6e8] bg-white shadow-[0_12px_35px_rgba(0,0,0,.05)]">
        <div className="flex items-center gap-3 border-b border-black/[0.07] p-4 sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#f5f5f5]" style={{ color: selected.color }}><selected.Icon size={19} /></span><div><h2 className="font-serif text-[21px]">Lancer {selected.name}</h2><p className="mt-0.5 text-[10px] text-black/40">Création d’un brouillon lié à {project.name}</p></div></div>
        <form onSubmit={runAgent} className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.45fr)]">
          <div>
            <label htmlFor="ai-topic" className="text-[11px] font-semibold text-black/60">{selected.inputLabel}</label>
            <textarea id="ai-topic" value={topic} onChange={(event) => setTopic(event.target.value)} rows={4} maxLength={600} placeholder={selected.placeholder} className="mt-2 w-full resize-y rounded-[10px] border border-black/10 bg-[#fbfbfb] px-3 py-3 text-[13px] leading-5 outline-none focus:border-black/25" />
            {selected.id === "youtube" ? <><label htmlFor="ai-source" className="mt-4 block text-[11px] font-semibold text-black/60">Lien vidéo ou transcription <span className="font-normal text-black/35">(facultatif)</span></label><textarea id="ai-source" value={source} onChange={(event) => setSource(event.target.value)} rows={3} maxLength={12000} placeholder="Collez une URL YouTube ou le texte de la transcription pour imposer une source précise." className="mt-2 w-full resize-y rounded-[10px] border border-black/10 bg-[#fbfbfb] px-3 py-3 text-[12px] leading-5 outline-none focus:border-black/25" /></> : null}
          </div>
          <div className="flex flex-col rounded-[11px] bg-[#f7f7f6] p-4">
            <div className="flex items-start gap-2.5"><Bot size={17} className="mt-0.5 shrink-0 text-black/45" /><p className="text-[11px] leading-5 text-black/50">L’agent génère le titre, le résumé, la structure H2/H3 et le corps de l’article. {selected.id === "youtube" ? "Il crée aussi un visuel original via OpenRouter et l’ajoute dans Assets." : "L’image principale est sélectionnée dans Assets."} Il ne touche pas au site publié.</p></div>
            <button type="submit" disabled={!topic.trim() || running} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232,#222)] px-5 text-[13px] font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-40 xl:mt-auto">{running ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}{running ? "L’agent travaille…" : "Créer le brouillon"}</button>
          </div>
        </form>
        {message ? <div aria-live="polite" className="border-t border-black/[0.07] px-4 py-3 text-[11px] leading-5 text-black/55 sm:px-5">{message}</div> : null}
      </section>

      {drafts.length ? <section className="mt-8"><div className="flex items-end justify-between gap-3"><div><h2 className="font-serif text-[23px]">Brouillons créés</h2><p className="mt-1 text-[11px] text-black/40">Disponibles immédiatement dans la collection Articles.</p></div><Link href={`/dashboard?project=${encodeURIComponent(project.key)}&tab=cms`} className="flex items-center gap-1.5 text-[11px] font-semibold text-black/55 hover:text-black">Ouvrir le CMS<ExternalLink size={13} /></Link></div><div className="mt-4 overflow-hidden rounded-[13px] border border-[#e8ecee] bg-white">{drafts.map((draft) => <div key={draft.slug} className="flex flex-col gap-2 border-b border-black/[0.06] px-4 py-3 last:border-0 min-[460px]:flex-row min-[460px]:items-center"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef9ff] text-[#008fc5]"><Sparkles size={14} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{draft.title}</p><p className="mt-0.5 text-[10px] text-black/40">{draft.agentName} · Brouillon</p></div>{draft.sourceUrl ? <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="ml-10 flex items-center gap-1 text-[10px] text-black/45 hover:text-black min-[460px]:ml-0">Source<ExternalLink size={11} /></a> : null}</div>)}</div></section> : null}
    </div>
  );
}
