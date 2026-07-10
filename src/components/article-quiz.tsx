"use client";

import { useState } from "react";
import type { ReusableQuiz } from "@/lib/site-template";

export function ArticleQuiz({ quiz }: { quiz: ReusableQuiz }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const question = quiz.questions[step] ?? quiz.questions[0];
  const total = Math.max(quiz.questions.length, 1);
  const progress = complete ? 100 : Math.round(((step + 1) / total) * 100);

  return (
    <div className="rounded-[21px] bg-[#003441] px-6 py-14 text-white md:px-12 lg:px-[51px] lg:py-[98px]">
      <div className="mx-auto max-w-[820px] text-center">
        <h2 className="typo-h3 text-white">{quiz.title}</h2>
        <p className="typo-body-small mt-4 text-white">{quiz.subtitle}</p>
      </div>

      <div className="mx-auto mt-14 max-w-[786px]">
        <div className="typo-body-small flex items-center justify-between text-white/60">
          <span>
            Question {complete ? total : step + 1} sur {total}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[#00d494] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[945px] rounded-3xl bg-[#063f4d] p-6 md:p-12">
        {complete ? (
          <div className="grid gap-5">
            <h3 className="typo-h4 text-white">{quiz.resultTitle}</h3>
            <p className="typo-body-medium text-white/78">{quiz.resultText}</p>
            <a
              href="/contact"
              className="site-cta site-cta-primary cta-roll mt-2 w-fit rounded-full text-[#00d494]"
            >
              Nous contacter
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            <h3 className="typo-h5 text-white">{question.question}</h3>
            <div className="grid gap-4">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelected(option)}
                  className={`typo-body-small rounded-2xl border px-8 py-4 text-left transition ${
                    selected === option
                      ? "border-[#00d494] bg-white/[0.09] text-white"
                      : "border-white/[0.07] bg-white/[0.03] text-white hover:bg-white/[0.07]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                if (step + 1 >= quiz.questions.length) {
                  setComplete(true);
                  return;
                }

                setStep((current) => current + 1);
                setSelected(null);
              }}
              className="site-cta site-cta-primary cta-roll w-fit rounded-full text-[#00d494] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {quiz.nextLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
