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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function unwrapCopy(value: unknown) {
  const root = asRecord(value);
  for (const key of ["servicePage", "page", "content", "data", "result"]) {
    const nested = asRecord(root[key]);
    if (Object.keys(nested).length) return nested;
  }
  return root;
}

function normalizeCopy(
  value: unknown,
  template: ServicePageTextTemplate,
) {
  const raw = unwrapCopy(value);
  const nestedHero = asRecord(raw.hero);
  const nestedBenefits = asRecord(raw.benefits);
  const nestedFaq = asRecord(raw.faq);
  const nestedBenefitItems = Array.isArray(nestedBenefits.items)
    ? nestedBenefits.items.map(asRecord)
    : [];
  const nestedFaqItems = Array.isArray(nestedFaq.items)
    ? nestedFaq.items.map(asRecord)
    : [];
  const copy = {
    pageTitle: stringValue(raw.pageTitle),
    slugSuggestion: stringValue(raw.slugSuggestion),
    hero: {
      title:
        stringValue(raw.heroTitle) || stringValue(nestedHero.title),
      subtitle:
        stringValue(raw.heroSubtitle) || stringValue(nestedHero.subtitle),
    },
    testimonialsTitle: stringValue(raw.testimonialsTitle),
    benefits: {
      title:
        stringValue(raw.benefitsTitle) || stringValue(nestedBenefits.title),
      items: template.benefits.map((_, index) => ({
        title:
          stringValue(raw[`benefit${index + 1}Title`]) ||
          stringValue(nestedBenefitItems[index]?.title),
        description:
          stringValue(raw[`benefit${index + 1}Description`]) ||
          stringValue(nestedBenefitItems[index]?.description),
      })),
    },
    faq: {
      title: stringValue(raw.faqTitle) || stringValue(nestedFaq.title),
      items: template.faqItems.map((_, index) => ({
        question:
          stringValue(raw[`faq${index + 1}Question`]) ||
          stringValue(nestedFaqItems[index]?.question),
        answer:
          stringValue(raw[`faq${index + 1}Answer`]) ||
          stringValue(nestedFaqItems[index]?.answer),
      })),
    },
  };
  return {
    ...copy,
    slugSuggestion: copy.slugSuggestion
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72),
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
  const required = [
    "pageTitle",
    "slugSuggestion",
    "heroTitle",
    "heroSubtitle",
    "testimonialsTitle",
    "benefitsTitle",
    "faqTitle",
    ...input.template.benefits.flatMap((_, index) => [
      `benefit${index + 1}Title`,
      `benefit${index + 1}Description`,
    ]),
    ...input.template.faqItems.flatMap((_, index) => [
      `faq${index + 1}Question`,
      `faq${index + 1}Answer`,
    ]),
  ];
  const schema = {
    type: "object",
    additionalProperties: false,
    required,
    properties: Object.fromEntries(
      required.map((key) => [key, { type: "string" }]),
    ),
  };

  const fieldGuide = {
      pageTitle: { type: "string" },
      slugSuggestion: { type: "string" },
      heroTitle: { type: "string" },
      heroSubtitle: { type: "string" },
      testimonialsTitle: { type: "string" },
      benefitsTitle: { type: "string" },
      benefitFields: input.template.benefits.map((_, index) => ({
        title: `benefit${index + 1}Title`,
        description: `benefit${index + 1}Description`,
      })),
      faqTitle: { type: "string" },
      faqFields: input.template.faqItems.map((_, index) => ({
        question: `faq${index + 1}Question`,
        answer: `faq${index + 1}Answer`,
      })),
  };

  return (await askOpenRouter({
    schemaName: "locked_service_page_copy",
    schema,
    executionMode: input.executionMode,
    maxTokens: 2400,
    system: `${skill}\n\nTu travailles pour le projet « ${input.projectName} ».`,
    prompt: [
      `Prestation à rédiger : ${input.serviceName}`,
      `Informations fournies par l'utilisateur : ${input.brief}`,
      "",
      "Le modèle ci-dessous est verrouillé. Il sert uniquement de contexte éditorial.",
      JSON.stringify(input.template, null, 2),
      "",
      "Remplis exactement les clés PLATES suivantes, sans objet imbriqué et sans liste :",
      JSON.stringify(fieldGuide, null, 2),
      "",
      `Il faut exactement ${benefitCount} bénéfices et ${faqCount} questions fréquentes.`,
      "Chaque réponse de FAQ doit rester concise : 2 à 4 phrases.",
      "Ne recopie pas mécaniquement les anciens textes : adapte chaque champ à la nouvelle prestation.",
      "Réponds uniquement avec le JSON complet demandé.",
    ].join("\n"),
    normalize: (value) => normalizeCopy(value, input.template),
    validate: (value) => validateCopy(value, input.template),
  })) as GeneratedServicePageCopy;
}
