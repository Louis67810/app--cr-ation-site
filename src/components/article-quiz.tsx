"use client";

import Image from "next/image";
import { Check, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReusableQuiz } from "@/lib/site-template";

type QuizOption = Exclude<ReusableQuiz["questions"][number]["options"][number], string>;

function normalizeOption(option: string | QuizOption, questionIndex: number, optionIndex: number): QuizOption {
  return typeof option === "string"
    ? { id: `q${questionIndex + 1}-o${optionIndex + 1}`, label: option }
    : option;
}

export function ArticleQuiz({ quiz }: { quiz: ReusableQuiz }) {
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [resultId, setResultId] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const question = quiz.questions[step] ?? quiz.questions[0];
  const options = useMemo(
    () => question?.options.map((option, index) => normalizeOption(option, step, index)) ?? [],
    [question, step],
  );
  const selected = options.find((option) => option.id === selectedId) ?? null;
  const total = Math.max(quiz.questions.length, 1);
  const progress = complete ? 100 : Math.round(((step + 1) / total) * 100);
  const result = quiz.results?.find((candidate) => candidate.id === resultId) ?? quiz.results?.[0];
  const visualChoices = options.some((option) => option.imageUrl || option.imagePrompt);

  function chooseResult(nextScores: Record<string, number>, directResultId?: string) {
    if (directResultId && quiz.results?.some((candidate) => candidate.id === directResultId)) return directResultId;
    const ranked = Object.entries(nextScores).sort((a, b) => b[1] - a[1]);
    return ranked.find(([id]) => quiz.results?.some((candidate) => candidate.id === id))?.[0] ?? quiz.results?.[0]?.id ?? null;
  }

  function continueQuiz() {
    if (!selected) return;
    const nextScores = { ...scores };
    for (const [category, value] of Object.entries(selected.scores ?? {})) {
      nextScores[category] = (nextScores[category] ?? 0) + value;
    }
    if (selected.category) nextScores[selected.category] = (nextScores[selected.category] ?? 0) + 1;
    setScores(nextScores);

    const nextIndex = selected.nextQuestionId
      ? quiz.questions.findIndex((candidate) => candidate.id === selected.nextQuestionId)
      : step + 1;
    if (selected.resultId || nextIndex < 0 || nextIndex >= quiz.questions.length) {
      setResultId(chooseResult(nextScores, selected.resultId));
      setComplete(true);
      return;
    }
    setStep(nextIndex);
    setSelectedId(null);
  }

  function restart() {
    setStep(0);
    setSelectedId(null);
    setScores({});
    setResultId(null);
    setComplete(false);
  }

  if (!question) return null;

  return (
    <div className="rounded-[21px] bg-[var(--site-primary)] px-6 py-14 text-white md:px-12 lg:px-[51px] lg:py-[82px]">
      <div className="mx-auto max-w-[820px] text-center">
        <h2 className="typo-h3 text-white">{quiz.title}</h2>
        <p className="typo-body-small mt-4 text-white/78">{quiz.subtitle}</p>
      </div>

      <div className="mx-auto mt-12 max-w-[786px]">
        <div className="typo-body-small flex items-center justify-between text-white/60">
          <span>Question {complete ? total : step + 1} sur {total}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-[var(--site-accent)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[945px] rounded-3xl bg-[#063f4d] p-5 md:p-10">
        {complete ? (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(220px,.72fr)] md:items-center">
            <div>
              {result?.category ? <span className="inline-flex rounded-full bg-[color:color-mix(in_srgb,var(--site-accent)_15%,transparent)] px-3 py-1 text-[12px] font-semibold text-[var(--site-accent)]">{result.category}</span> : null}
              <h3 className="typo-h4 mt-3 text-white">{result?.title ?? quiz.resultTitle}</h3>
              <p className="typo-body-medium mt-4 text-white/78">{result?.text ?? quiz.resultText}</p>
              {result?.description ? <p className="typo-body-small mt-3 text-white/60">{result.description}</p> : null}
              {result?.recommendations?.length ? <ul className="mt-5 grid gap-2 text-[14px] text-white/75">{result.recommendations.map((recommendation) => <li key={recommendation} className="flex gap-2"><Check size={17} className="mt-0.5 shrink-0 text-[var(--site-accent)]" />{recommendation}</li>)}</ul> : null}
              <div className="mt-7 flex flex-wrap gap-3"><a href={result?.cta?.href ?? quiz.cta.href} className="site-cta site-cta-primary cta-roll w-fit rounded-full text-[#00d494]">{result?.cta?.label ?? quiz.cta.label}</a><button type="button" onClick={restart} className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[13px] font-semibold text-white/75 transition hover:bg-white/[0.06]"><RotateCcw size={15} />Recommencer</button></div>
            </div>
            {result?.imageUrl ? <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-white/[0.06]"><Image src={result.imageUrl} alt={result.imageAlt ?? result.title} fill unoptimized className="object-cover" /></div> : null}
          </div>
        ) : (
          <div className="grid gap-7">
            <div><h3 className="typo-h5 text-white">{question.question}</h3>{question.subtitle ? <p className="mt-2 text-[14px] text-white/55">{question.subtitle}</p> : null}</div>
            <div className={`grid gap-4 ${visualChoices ? "md:grid-cols-2" : ""}`}>
              {options.map((option) => <button key={option.id} type="button" onClick={() => setSelectedId(option.id)} className={`group overflow-hidden rounded-[20px] border text-left transition ${selectedId === option.id ? "border-[var(--site-accent)] bg-white/[0.1]" : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07]"}`}>
                {option.imageUrl ? <span className="relative block aspect-[16/10] overflow-hidden bg-white/[0.05]"><Image src={option.imageUrl} alt={option.imageAlt ?? option.label} fill unoptimized className="object-cover transition duration-500 group-hover:scale-[1.025]" /><span className={`absolute right-4 top-4 grid size-7 place-items-center rounded-full border backdrop-blur ${selectedId === option.id ? "border-[var(--site-accent)] bg-[var(--site-accent)] text-[var(--site-primary)]" : "border-white/40 bg-black/20 text-transparent"}`}><Check size={16} /></span></span> : null}
                <span className="block px-6 py-5"><span className="typo-body-small block text-white">{option.label}</span>{option.description ? <span className="mt-2 block text-[13px] leading-5 text-white/55">{option.description}</span> : null}</span>
              </button>)}
            </div>
            <button type="button" disabled={!selected} onClick={continueQuiz} className="site-cta site-cta-primary cta-roll w-fit rounded-full text-[#00d494] disabled:cursor-not-allowed disabled:opacity-45">{quiz.nextLabel}</button>
          </div>
        )}
      </div>
    </div>
  );
}
