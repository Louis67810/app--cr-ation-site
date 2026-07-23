import "server-only";

import { loadRuntimeSkill } from "@/lib/ai-runtime-skills";
import {
  askOpenRouter,
  type EditorialExecutionMode,
} from "@/lib/editorial-pipeline";

export type ServicePageTextTemplate = {
  pageTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  testimonialsTitle: string;
  benefitsTitle: string;
  benefits: Array<{ title: string; description: string }>;
  faqTitle: string;
  faqItems: Array<{ question: string; answer: string }>;
};

export type GeneratedServicePageCopy = {
  pageTitle: string;
  slugSuggestion: string;
  hero: {
    title: string;
    subtitle: string;
  };
  testimonialsTitle: string;
  benefits: {
    title: string;
    items: Array<{ title: string; description: string }>;
  };
  faq: {
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
};

function nonEmpty(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateCopy(
  value: unknown,
  template: ServicePageTextTemplate,
) {
  const copy = value as Partial<GeneratedServicePageCopy> | null;
  const errors: string[] = [];
  if (!nonEmpty(copy?.pageTitle)) errors.push("pageTitle est vide");
  if (!nonEmpty(copy?.slugSuggestion)) errors.push("slugSuggestion est vide");
  if (!nonEmpty(copy?.hero?.title)) errors.push("hero.title est vide");
  if (!nonEmpty(copy?.hero?.subtitle)) errors.push("hero.subtitle est vide");
  if (!nonEmpty(copy?.testimonialsTitle))
    errors.push("testimonialsTitle est vide");
  if (!nonEmpty(copy?.benefits?.title))
    errors.push("benefits.title est vide");
  if (
    !Array.isArray(copy?.benefits?.items) ||
    copy.benefits.items.length !== template.benefits.length
  )
    errors.push(
      `benefits.items doit contenir exactement ${template.benefits.length} éléments`,
    );
  else if (
    copy.benefits.items.some(
      (item) => !nonEmpty(item?.title) || !nonEmpty(item?.description),
    )
  )
    errors.push("chaque bénéfice doit avoir un titre et une description");
  if (!nonEmpty(copy?.faq?.title)) errors.push("faq.title est vide");
  if (
    !Array.isArray(copy?.faq?.items) ||
    copy.faq.items.length !== template.faqItems.length
  )
    errors.push(
      `faq.items doit contenir exactement ${template.faqItems.length} éléments`,
    );
  else if (
    copy.faq.items.some(
      (item) => !nonEmpty(item?.question) || !nonEmpty(item?.answer),
    )
  )
    errors.push("chaque FAQ doit avoir une question et une réponse");
  return errors;
}

function normalizeCopy(value: unknown) {
  const copy = value as GeneratedServicePageCopy;
  return {
    ...copy,
    pageTitle: copy.pageTitle?.trim(),
    slugSuggestion: copy.slugSuggestion
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72),
    hero: {
      title: copy.hero?.title?.trim(),
      subtitle: copy.hero?.subtitle?.trim(),
    },
    testimonialsTitle: copy.testimonialsTitle?.trim(),
    benefits: {
      title: copy.benefits?.title?.trim(),
      items: copy.benefits?.items?.map((item) => ({
        title: item.title?.trim(),
        description: item.description?.trim(),
      })),
    },
    faq: {
      title: copy.faq?.title?.trim(),
      items: copy.faq?.items?.map((item) => ({
        question: item.question?.trim(),
        answer: item.answer?.trim(),
      })),
    },
  };
}

export async function generateServicePageCopy(input: {
  serviceName: string;
  brief: string;
  projectName: string;
  executionMode: EditorialExecutionMode;
  template: ServicePageTextTemplate;
}) {
  const skill = await loadRuntimeSkill("service-page-writing");
  const benefitCount = input.template.benefits.length;
  const faqCount = input.template.faqItems.length;
  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "pageTitle",
      "slugSuggestion",
      "hero",
      "testimonialsTitle",
      "benefits",
      "faq",
    ],
    properties: {
      pageTitle: { type: "string" },
      slugSuggestion: { type: "string" },
      hero: {
        type: "object",
        additionalProperties: false,
        required: ["title", "subtitle"],
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
        },
      },
      testimonialsTitle: { type: "string" },
      benefits: {
        type: "object",
        additionalProperties: false,
        required: ["title", "items"],
        properties: {
          title: { type: "string" },
          items: {
            type: "array",
            minItems: benefitCount,
            maxItems: benefitCount,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "description"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
              },
            },
          },
        },
      },
      faq: {
        type: "object",
        additionalProperties: false,
        required: ["title", "items"],
        properties: {
          title: { type: "string" },
          items: {
            type: "array",
            minItems: faqCount,
            maxItems: faqCount,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["question", "answer"],
              properties: {
                question: { type: "string" },
                answer: { type: "string" },
              },
            },
          },
        },
      },
    },
  };

  return (await askOpenRouter({
    schemaName: "locked_service_page_copy",
    schema,
    executionMode: input.executionMode,
    maxTokens: 3600,
    system: `${skill}\n\nTu travailles pour le projet « ${input.projectName} ».`,
    prompt: [
      `Prestation à rédiger : ${input.serviceName}`,
      `Informations fournies par l'utilisateur : ${input.brief}`,
      "",
      "Le modèle ci-dessous est verrouillé. Il indique uniquement le nombre et la nature des champs à remplir.",
      JSON.stringify(input.template, null, 2),
      "",
      `Conserve exactement ${benefitCount} bénéfices et ${faqCount} questions fréquentes.`,
      "Ne recopie pas mécaniquement les anciens textes : adapte chaque champ à la nouvelle prestation.",
      "Réponds uniquement avec le JSON complet demandé.",
    ].join("\n"),
    normalize: normalizeCopy,
    validate: (value) => validateCopy(value, input.template),
  })) as GeneratedServicePageCopy;
}
