"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { LeadQualifier } from "@/lib/site-template";

function FieldVisualLabel({ label }: { label: string }) {
  const required = label.includes("*");
  const cleanLabel = label.replace("*", "").trimEnd();

  return (
    <span className="pointer-events-none absolute left-5 top-4 text-[14px] font-bold leading-[25px] text-black transition-opacity peer-focus:opacity-0 peer-[:not(:placeholder-shown)]:opacity-0">
      {cleanLabel}
      {required ? <span className="text-[#E73E13]">*</span> : null}
    </span>
  );
}

export function ArticleLeadQualifier({ qualifier }: { qualifier: LeadQualifier }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStepId, setCurrentStepId] = useState(qualifier.steps[0]?.id ?? "");
  const [submitted, setSubmitted] = useState(false);

  const currentIndex = qualifier.steps.findIndex((step) => step.id === currentStepId);
  const isFormStep = currentStepId === "form" || currentIndex < 0;
  const currentStep = isFormStep ? undefined : qualifier.steps[currentIndex];
  const activeAnswer = currentStep ? answers[currentStep.id] : "";
  const visibleStepCount = Math.min(qualifier.steps.length, 3);
  const progressIndex = isFormStep
    ? visibleStepCount - 1
    : Math.min(Math.max(currentIndex, 0), visibleStepCount - 1);
  const canContinue = isFormStep || Boolean(activeAnswer);

  const selectedSummary = useMemo(
    () =>
      qualifier.steps
        .map((step) => {
          const value = answers[step.id];
          const option = step.options.find((item) => item.value === value);
          return option?.label;
        })
        .filter(Boolean)
        .join(" / "),
    [answers, qualifier.steps],
  );

  function goNext() {
    if (!currentStep) return;

    const selectedOption = currentStep.options.find(
      (option) => option.value === activeAnswer,
    );
    const nextId =
      selectedOption?.nextStepId ?? qualifier.steps[currentIndex + 1]?.id ?? "form";

    setCurrentStepId(nextId);
  }

  function goBack() {
    if (isFormStep) {
      setCurrentStepId(qualifier.steps.at(-1)?.id ?? "");
      return;
    }

    if (currentIndex > 0) {
      setCurrentStepId(qualifier.steps[currentIndex - 1].id);
    }
  }

  return (
    <section id="qualification" className="scroll-mt-24 bg-[#f6f6f4] px-5 py-16 font-[var(--font-inter)] md:px-10 md:py-24 xl:px-20">
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-5 overflow-hidden rounded-[52px] border border-black/16 bg-white p-5 lg:flex-row">
        <div className="relative z-10 flex min-h-[620px] w-full max-w-[888px] flex-col items-start gap-12 px-6 py-10 md:p-11 lg:min-h-[846px]">
          <div className="flex items-start gap-2">
            {Array.from({ length: visibleStepCount }).map((_, index) => {
              const active = index <= progressIndex;

              return (
                <span
                  key={index}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-[16px] font-medium leading-[231%] tracking-[0.03em] ${
                    active
                      ? "border-black/[0.09] bg-white text-black opacity-100"
                      : "border-black/[0.09] bg-black/[0.05] text-black opacity-35"
                  }`}
                >
                  {index + 1}
                </span>
              );
            })}
          </div>

          {submitted ? (
            <div className="grid max-w-[798px] gap-6">
              <h2 className="typo-h2 text-black">{qualifier.successTitle}</h2>
              <p className="typo-body-medium text-black/68">{qualifier.successText}</p>
              {selectedSummary ? (
                <p className="typo-body-small rounded-2xl bg-[#f6f6f4] px-5 py-4 text-black/64">
                  Qualification : {selectedSummary}
                </p>
              ) : null}
            </div>
          ) : isFormStep ? (
            <form
              className="grid w-full max-w-[798px] gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="grid gap-3">
                <p className="typo-body-small text-[var(--site-primary)]">Dernière étape</p>
                <h2 className="typo-h3 text-black">{qualifier.form.title}</h2>
                {selectedSummary ? (
                  <p className="typo-body-small text-black/64">
                    Qualification : {selectedSummary}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {qualifier.form.fields.map((field) => {
                  const multiline = field.type === "textarea";
                  const className =
                    "w-full rounded-lg border border-black/[0.08] bg-[#fbfbfb] px-5 py-4 text-[14px] font-bold leading-[25px] text-black outline-none placeholder:text-black/50 focus:border-[var(--site-primary)]";

                  return multiline ? (
                    <label key={field.label} className="relative block md:col-span-2">
                      <textarea
                        aria-label={field.label}
                        required={field.label.includes("*")}
                        placeholder=" "
                        className={`${className} peer min-h-[128px] resize-y`}
                      />
                      <FieldVisualLabel label={field.label} />
                    </label>
                  ) : (
                    <label key={field.label} className="relative block">
                      <input
                        aria-label={field.label}
                        required={field.label.includes("*")}
                        type={field.type}
                        placeholder=" "
                        className={`${className} peer`}
                      />
                      <FieldVisualLabel label={field.label} />
                    </label>
                  );
                })}
              </div>
              <button
                type="submit"
                className="site-cta site-cta-primary cta-roll mt-3 w-full rounded-full text-[#00d494]"
              >
                {qualifier.submitLabel}
              </button>
              <button
                type="button"
                onClick={goBack}
                className="typo-body-small w-fit text-black/60 underline underline-offset-4"
              >
                Revenir aux questions
              </button>
            </form>
          ) : currentStep ? (
            <>
              <h2 className="typo-h2 max-w-[798px] text-black">{currentStep.title}</h2>
              <div className="grid w-full max-w-[800px] gap-4 md:grid-cols-2">
                {currentStep.options.map((option) => {
                  const selected = activeAnswer === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [currentStep.id]: option.value,
                        }))
                      }
                      className={`relative min-h-[360px] overflow-hidden rounded-3xl border text-left backdrop-blur-[17px] transition md:min-h-[444px] ${
                        selected
                          ? "border-white/12 bg-[#12424e] text-white"
                          : "border-black/12 bg-white text-black hover:border-[var(--site-primary)]"
                      }`}
                    >
                      <div className="absolute inset-x-0 top-[88px] flex justify-center">
                        <Image
                          src={option.imageUrl}
                          alt={option.imageSlotLabel}
                          width={212}
                          height={212}
                          className="h-[212px] w-[212px] object-contain"
                          draggable={false}
                        />
                      </div>
                      <div
                        className={`absolute inset-x-0 bottom-0 flex h-[59px] items-center justify-center border-t px-8 ${
                          selected
                            ? "border-white/[0.05] bg-[#174e5c] text-white"
                            : "border-black/[0.05] bg-black/[0.03] text-black"
                        }`}
                      >
                        <span className="typo-body-small font-medium">{option.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canContinue}
                  className="site-cta site-cta-primary cta-roll rounded-full text-[#00d494] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Suivant
                </button>
                {currentIndex > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="typo-body-small text-black/60 underline underline-offset-4"
                  >
                    Retour
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <div className="ml-auto hidden min-h-[520px] w-full items-center justify-center rounded-[32px] bg-[#fbfbfb] p-8 lg:flex lg:min-h-[846px] lg:w-[564px] lg:shrink-0">
          <Image
            src={qualifier.sideImageUrl}
            alt={qualifier.sideImageAlt}
            width={720}
            height={720}
            className="h-full max-h-[720px] w-full object-contain"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
