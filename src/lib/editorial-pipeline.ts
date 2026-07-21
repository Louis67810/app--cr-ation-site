import "server-only";
import type { ReusableQuiz } from "@/lib/site-template";
import type { EditorialPerformanceSnapshot } from "@/lib/editorial-performance";
import { loadRuntimeSkill } from "@/lib/ai-runtime-skills";
import {
  ARTICLE_CATEGORIES,
  isArticleCategory,
  normalizeArticleCategory,
} from "@/lib/article-categories";

const OPENROUTER_TEST_MODEL = "inclusionai/ling-2.6-flash";
const OPENROUTER_TEST_FALLBACK_MODEL = "qwen/qwen3.5-flash-02-23";

export type EditorialMode = "seo" | "youtube" | "trends" | "editorial";
export type EditorialExecutionMode = "test" | "classic";

export type ResearchBrief = {
  topic: string;
  summary: string;
  searchIntent: string;
  audience: string;
  angle: string;
  facts: Array<{ claim: string; sourceTitle: string; sourceUrl: string }>;
  questions: string[];
  keywords: string[];
  safetyNotes: string[];
  performanceAnalysis: {
    dataStatus: "connected" | "partial" | "missing";
    summary: string;
    mainFindings: string[];
    winningPages: Array<{ path: string; reason: string }>;
    weakPages: Array<{ path: string; reason: string }>;
    seoOpportunities: Array<{ path: string; opportunity: string }>;
    contentPatterns: string[];
  };
};

export type ArticleSectionFormat = "prose" | "table" | "cards" | "callout";
export type ArticleComponentVariant =
  | "default"
  | "comparison"
  | "yellow"
  | "outlined"
  | "highlight"
  | "quote"
  | "solution";

export type ArticleImageRequest = {
  id: string;
  kind: "hero" | "inline";
  afterSectionId: string;
  purpose: string;
  prompt: string;
  alt: string;
  caption: string;
  aspectRatio: "16:9" | "4:3" | "1:1";
};

export type ArticleQuizRequest = {
  enabled: boolean;
  afterSectionId: string;
  goal: string;
  format: "visual-preference" | "diagnostic" | "recommendation" | "branching";
  resultCategories: string[];
  ctaLabel: string;
};

export type ResolvedArticleImage = ArticleImageRequest & {
  url: string;
  generated: boolean;
};

export type ArticleOutline = {
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  heroImageAlt: string;
  readingTime: string;
  sections: Array<{
    id: string;
    level: "h2" | "h3";
    title: string;
    purpose: string;
    points: string[];
    format: ArticleSectionFormat;
    componentVariant: ArticleComponentVariant;
    componentInstruction: string;
  }>;
  imageRequests: ArticleImageRequest[];
  quizRequest: ArticleQuizRequest;
};

export type GeneratedArticle = {
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  heroImageAlt: string;
  readingTime: string;
  sections: Array<{
    sectionId: string;
    paragraphs: string[];
    tableTitle: string;
    tableColumns: string[];
    tableRows: string[][];
    cardsTitle: string;
    cards: Array<{ icon: string; title: string; text: string }>;
    calloutTitle: string;
    calloutText: string;
  }>;
};

function topicTerms(value: string) {
  const ignored = new Set([
    "avec",
    "dans",
    "des",
    "les",
    "pour",
    "quel",
    "quelle",
    "comment",
    "votre",
    "vous",
    "une",
    "sur",
    "son",
    "ses",
    "jardin",
  ]);
  return new Set(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 2 && !ignored.has(term)),
  );
}

function isTopicTooSimilar(candidate: string, existing: string) {
  const candidateTerms = topicTerms(candidate);
  const existingTerms = topicTerms(existing);
  if (!candidateTerms.size || !existingTerms.size) return false;
  const common = [...candidateTerms].filter((term) => existingTerms.has(term));
  return (
    candidate.trim().toLowerCase() === existing.trim().toLowerCase() ||
    (common.length >= 2 &&
      common.length / Math.min(candidateTerms.size, existingTerms.size) >= 0.72)
  );
}

function validateResearchBrief(value: unknown, excludedTopics: string[] = []) {
  const result = value as Partial<ResearchBrief> | null;
  const errors: string[] = [];
  if (!result?.topic?.trim()) errors.push("topic est vide");
  if (!result?.summary?.trim()) errors.push("summary est vide");
  if (!Array.isArray(result?.facts)) errors.push("facts doit etre une liste");
  if (!result?.performanceAnalysis)
    errors.push("performanceAnalysis est manquant");
  if (
    result?.topic &&
    excludedTopics.some((topic) => isTopicTooSimilar(result.topic!, topic))
  )
    errors.push(
      `topic est trop proche d'un article existant; choisir un problème et un angle réellement nouveaux parmi les sujets interdits : ${excludedTopics.join(" | ")}`,
    );
  return errors;
}

function validateArticleOutline(value: unknown) {
  const result = value as Partial<ArticleOutline> | null;
  const errors: string[] = [];
  if (!result?.title?.trim()) errors.push("title est vide");
  if (!result?.excerpt?.trim()) errors.push("excerpt est vide");
  if (!isArticleCategory(result?.category))
    errors.push(`category doit être l'une de : ${ARTICLE_CATEGORIES.join(", ")}`);
  if (!result?.slug?.trim()) errors.push("slug est vide");
  if (!result?.readingTime?.trim()) errors.push("readingTime est vide");
  if (!Array.isArray(result?.sections) || result.sections.length < 4) {
    errors.push("sections doit contenir au moins quatre sections");
    return errors;
  }

  const ids = result.sections.map((section) => section?.id).filter(Boolean);
  const sectionIds = new Set(ids);
  if (sectionIds.size !== result.sections.length)
    errors.push("chaque section doit avoir un id unique non vide");
  if (
    result.sections.some(
      (section) =>
        !section?.title?.trim() ||
        !Array.isArray(section.points) ||
        section.points.length === 0,
    )
  )
    errors.push("chaque section doit avoir un titre et au moins un point");
  const componentSections = result.sections.filter(
    (section) => section.format !== "prose",
  );
  if (componentSections.length < 2)
    errors.push(
      "le plan doit contenir au moins deux sections avec de vrais composants parmi table, cards et callout",
    );
  if (
    componentSections.some(
      (section) => !section.componentInstruction?.trim(),
    )
  )
    errors.push("chaque composant doit avoir une instruction détaillée");

  const imageRequests = Array.isArray(result.imageRequests)
    ? result.imageRequests
    : [];
  const heroCount = imageRequests.filter(
    (image) => image?.kind === "hero",
  ).length;
  if (heroCount !== 1)
    errors.push("imageRequests doit contenir exactement une image hero");
  if (
    imageRequests.some(
      (image) =>
        image?.kind === "inline" && !sectionIds.has(image.afterSectionId),
    )
  )
    errors.push("chaque image inline doit viser un sectionId existant");
  if (
    result.quizRequest?.enabled &&
    !sectionIds.has(result.quizRequest.afterSectionId)
  )
    errors.push("le quiz doit viser un sectionId existant");
  if (!result.quizRequest) errors.push("quizRequest est manquant");
  return errors;
}

function normalizeArticleOutline(value: unknown) {
  const result = value as Partial<ArticleOutline> | null;
  if (!result || !Array.isArray(result.sections) || result.sections.length === 0)
    return value;

  const usedIds = new Set<string>();
  const idMap = new Map<string, string>();
  const sections = result.sections.map((section, index) => {
    const originalId = section?.id?.trim() || `section-${index + 1}`;
    let id = originalId;
    let suffix = 2;
    while (usedIds.has(id)) id = `${originalId}-${suffix++}`;
    usedIds.add(id);
    if (!idMap.has(originalId)) idMap.set(originalId, id);
    const componentVariant: ArticleComponentVariant =
      section.componentVariant ??
      (section.format === "table"
        ? "comparison"
        : section.format === "cards"
          ? "default"
          : section.format === "callout"
            ? "highlight"
            : "default");
    return { ...section, id, componentVariant };
  });
  const fallbackSectionId =
    sections.find((section) => section.level === "h2")?.id ?? sections[0].id;
  const requestedImages = Array.isArray(result.imageRequests)
    ? result.imageRequests
    : [];
  const firstHero = requestedImages.find((image) => image?.kind === "hero");
  const heroSource = firstHero ?? requestedImages[0];
  const hero: ArticleImageRequest = {
    id: heroSource?.id?.trim() || "hero-image",
    kind: "hero",
    afterSectionId: "",
    purpose:
      heroSource?.purpose?.trim() || "Illustrer le sujet principal de l'article",
    prompt:
      heroSource?.prompt?.trim() ||
      `Photographie editoriale premium illustrant ${result.title ?? "le sujet de l'article"}`,
    alt:
      heroSource?.alt?.trim() ||
      result.heroImageAlt?.trim() ||
      result.title?.trim() ||
      "Illustration principale de l'article",
    caption: heroSource?.caption?.trim() || "",
    aspectRatio: "16:9",
  };
  const inlineImages = requestedImages
    .filter((image) => image !== firstHero && image !== heroSource)
    .filter((image) => image?.kind === "inline")
    .slice(0, 3)
    .map((image, index) => ({
      ...image,
      id: image.id?.trim() || `inline-image-${index + 1}`,
      kind: "inline" as const,
      afterSectionId:
        idMap.get(image.afterSectionId) ??
        (usedIds.has(image.afterSectionId)
          ? image.afterSectionId
          : fallbackSectionId),
    }));
  const quizRequest: ArticleQuizRequest = result.quizRequest
    ? {
        ...result.quizRequest,
        afterSectionId: result.quizRequest.enabled
          ? (idMap.get(result.quizRequest.afterSectionId) ??
            (usedIds.has(result.quizRequest.afterSectionId)
              ? result.quizRequest.afterSectionId
              : fallbackSectionId))
          : "",
      }
    : {
        enabled: false,
        afterSectionId: "",
        goal: "",
        format: "recommendation",
        resultCategories: [],
        ctaLabel: "",
      };

  return {
    ...result,
    category: normalizeArticleCategory(result.category, result.title),
    sections,
    imageRequests: [hero, ...inlineImages],
    quizRequest,
  };
}

function countWords(values: string[]) {
  return values
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function validateGeneratedArticle(value: unknown, outline: ArticleOutline) {
  const result = value as Partial<GeneratedArticle> | null;
  const expectedIds = outline.sections.map((section) => section.id);
  const errors: string[] = [];
  if (!result?.title?.trim()) errors.push("title est vide");
  if (!result?.excerpt?.trim()) errors.push("excerpt est vide");
  if (!isArticleCategory(result?.category))
    errors.push(`category doit être l'une de : ${ARTICLE_CATEGORIES.join(", ")}`);
  if (result?.category !== outline.category)
    errors.push("category doit être identique à celle du plan verrouillé");
  if (!Array.isArray(result?.sections)) {
    errors.push("sections doit etre une liste");
    return errors;
  }
  const actualIds = result.sections.map((section) => section?.sectionId);
  if (actualIds.length !== expectedIds.length)
    errors.push("la redaction doit contenir exactement une entree par section");
  if (actualIds.some((id, index) => id !== expectedIds[index]))
    errors.push(
      `les sectionId doivent respecter cet ordre exact : ${expectedIds.join(", ")}`,
    );
  if (
    result.sections.some(
      (section) => !Array.isArray(section?.paragraphs),
    )
  )
    errors.push("chaque section redigee doit contenir paragraphs");
  if (
    result.sections.some(
      (section) =>
        !Array.isArray(section?.paragraphs) ||
        countWords(section.paragraphs) < 45,
    )
  )
    errors.push(
      "chaque section doit contenir au moins 45 mots de paragraphes utiles",
    );

  const contentBySection = new Map(
    result.sections.map((section) => [section.sectionId, section]),
  );
  for (const section of outline.sections) {
    const content = contentBySection.get(section.id);
    if (!content) continue;
    if (
      section.format === "table" &&
      (!Array.isArray(content.tableColumns) ||
        content.tableColumns.length < 2 ||
        !Array.isArray(content.tableRows) ||
        content.tableRows.length < 2 ||
        content.tableRows.some(
          (row) => row.length !== content.tableColumns.length,
        ))
    )
      errors.push(
        `la section ${section.id} doit fournir un tableau complet avec au moins deux colonnes et deux lignes`,
      );
    if (
      section.format === "cards" &&
      (!Array.isArray(content.cards) || content.cards.length < 2)
    )
      errors.push(
        `la section ${section.id} doit fournir au moins deux cartes complètes`,
      );
    if (section.format === "callout" && !content.calloutText?.trim())
      errors.push(
        `la section ${section.id} doit fournir le texte de l'encadré`,
      );
  }

  const totalWords = countWords(
    result.sections.flatMap((section) => [
      ...(section.paragraphs ?? []),
      section.tableTitle ?? "",
      ...(section.tableColumns ?? []),
      ...(section.tableRows?.flat() ?? []),
      section.cardsTitle ?? "",
      ...(section.cards?.flatMap((card) => [card.title, card.text]) ?? []),
      section.calloutTitle ?? "",
      section.calloutText ?? "",
    ]),
  );
  if (totalWords < 850)
    errors.push(
      `l'article est trop court (${totalWords} mots); produire au moins 850 mots utiles`,
    );
  return errors;
}

function normalizeGeneratedArticle(value: unknown, expectedIds: string[]) {
  const result = value as Partial<GeneratedArticle> | null;
  if (!result || !Array.isArray(result.sections)) return value;
  const sectionsById = new Map(
    result.sections.map((section) => [section.sectionId, section]),
  );
  if (
    sectionsById.size !== expectedIds.length ||
    expectedIds.some((id) => !sectionsById.has(id))
  )
    return value;
  return {
    ...result,
    category: normalizeArticleCategory(result.category, result.title),
    sections: expectedIds.map((id) => sectionsById.get(id)),
  };
}

const modeInstructions: Record<EditorialMode, string> = {
  seo: "Cherche un angle evergreen qui répond précisément à une intention de recherche utile aux clients d’un paysagiste.",
  youtube:
    "Cherche les meilleurs tutoriels et sources autour du sujet. Une vidéo peut inspirer l’angle, mais aucune formulation ne doit être copiée.",
  trends:
    "Cherche les signaux récents, la saison, la météo et les préoccupations qui progressent, sans transformer un signal faible en certitude.",
  editorial:
    "Privilégie la vérification des faits, les recommandations prudentes, la sécurité et les sources professionnelles ou institutionnelles.",
};

function cleanJson(content: string) {
  const cleaned = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  return firstBrace >= 0 && lastBrace > firstBrace
    ? cleaned.slice(firstBrace, lastBrace + 1)
    : cleaned;
}

type OpenRouterResult = {
  id?: string;
  model?: string;
  provider?: string;
  error?: unknown;
  usage?: unknown;
  choices?: Array<{
    finish_reason?: string | null;
    native_finish_reason?: string | null;
    error?: unknown;
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
      refusal?: string | null;
      reasoning?: string | null;
    };
  }>;
};

function getOpenRouterContent(result: OpenRouterResult) {
  const rawContent = result.choices?.[0]?.message?.content;
  if (typeof rawContent === "string") return rawContent;
  if (Array.isArray(rawContent))
    return rawContent.map((part) => part.text ?? "").join("");
  return "";
}

function describeOpenRouterResult(
  result: OpenRouterResult,
  requestedModel: string,
  label: string,
) {
  const choice = result.choices?.[0];
  const content = getOpenRouterContent(result);
  return [
    `${label} :`,
    `- modele demande : ${requestedModel}`,
    `- modele retourne : ${result.model ?? "absent"}`,
    `- fournisseur : ${result.provider ?? "absent"}`,
    `- identifiant : ${result.id ?? "absent"}`,
    `- nombre de choix : ${result.choices?.length ?? 0}`,
    `- raison d'arret : ${choice?.finish_reason ?? "absente"}`,
    `- raison fournisseur : ${choice?.native_finish_reason ?? "absente"}`,
    `- longueur du contenu : ${content.length}`,
    `- refus : ${choice?.message?.refusal ?? "aucun"}`,
    `- erreur globale : ${result.error ? JSON.stringify(result.error) : "aucune"}`,
    `- erreur du choix : ${choice?.error ? JSON.stringify(choice.error) : "aucune"}`,
    `- usage : ${result.usage ? JSON.stringify(result.usage) : "absent"}`,
  ].join("\n");
}

async function readOpenRouterResult(
  response: Response,
  requestedModel: string,
  label: string,
) {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as OpenRouterResult;
  } catch (error) {
    throw new Error(
      `OpenRouter a retourne une reponse non JSON.\n${label}\n- modele : ${requestedModel}\n- statut HTTP : ${response.status}\n- corps : ${raw.slice(0, 2000) || "vide"}`,
      { cause: error },
    );
  }
}

async function askOpenRouter(input: {
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  prompt: string;
  research?: boolean;
  maxTokens?: number;
  model?: string;
  executionMode: EditorialExecutionMode;
  normalize?: (value: unknown) => unknown;
  validate?: (value: unknown) => string[];
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey)
    throw new Error(
      "La clé OPENROUTER_API_KEY n’est pas configurée sur cette machine.",
    );

  const testMode = input.executionMode === "test";
  let model = testMode
    ? OPENROUTER_TEST_MODEL
    : (input.model ??
      process.env.OPENROUTER_CONTENT_MODEL ??
      "openai/gpt-4.1-mini");
  const webSearchEnabled =
    input.research &&
    (!testMode || process.env.OPENROUTER_DEMO_WEB_SEARCH === "true");
  const sendRequest = (
    selectedModel: string,
    strictSchema: boolean,
    repairAttempt = 0,
    repairReason = "",
    previousContent = "",
  ) =>
    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-OpenRouter-Title": "Atelier Site Builder - Editorial Pipeline",
      },
      body: JSON.stringify({
        model: selectedModel,
        temperature: input.research ? 0.25 : 0.4,
        max_tokens:
          repairAttempt > 0
            ? Math.max(input.maxTokens ?? 3600, 6000)
            : (input.maxTokens ?? 3600),
        ...(webSearchEnabled
          ? {
              tools: [
                {
                  type: "openrouter:web_search",
                  engine: "auto",
                  max_total_results: 7,
                  search_context_size: "high",
                },
              ],
            }
          : {}),
        response_format: strictSchema
          ? {
              type: "json_schema",
              json_schema: {
                name: input.schemaName,
                strict: true,
                schema: input.schema,
              },
            }
          : { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          {
            role: "user",
            content:
              repairAttempt > 0
                ? `${input.prompt}\n\nIMPORTANT : une reponse precedente etait invalide. Corrige le document fourni ci-dessous sans changer inutilement son contenu. Renvoie le document JSON complet depuis le debut, compact, sans markdown. Ferme obligatoirement toutes les chaines, listes et accolades. N'ajoute aucun texte avant ou apres le JSON. Corrige imperativement ces erreurs : ${repairReason}\n\nDOCUMENT PRECEDENT A CORRIGER :\n${previousContent.slice(0, 28000)}`
                : input.prompt,
          },
        ],
      }),
    });

  const httpDiagnostics: string[] = [];
  const wait = (durationMs: number) =>
    new Promise((resolve) => setTimeout(resolve, durationMs));
  const sendWithRateLimitRecovery = async (
    strictSchema: boolean,
    repairAttempt = 0,
    repairReason = "",
    previousContent = "",
    label = "Requête",
  ) => {
    let response = await sendRequest(
      model,
      strictSchema,
      repairAttempt,
      repairReason,
      previousContent,
    );
    if (response.status !== 429) return response;

    const firstDetail = await response.text();
    httpDiagnostics.push(
      `${label} limitée par le fournisseur :\n- modèle : ${model}\n- statut HTTP : 429\n- détails : ${firstDetail.slice(0, 1200) || "aucun"}\n- action : nouvelle tentative automatique`,
    );
    await wait(1200);
    response = await sendRequest(
      model,
      strictSchema,
      repairAttempt,
      repairReason,
      previousContent,
    );
    if (response.status !== 429 || !testMode) return response;

    const secondDetail = await response.text();
    const fallbackModel =
      process.env.OPENROUTER_TEST_FALLBACK_MODEL ??
      OPENROUTER_TEST_FALLBACK_MODEL;
    httpDiagnostics.push(
      `${label} encore limitée :\n- modèle : ${model}\n- statut HTTP : 429\n- détails : ${secondDetail.slice(0, 1200) || "aucun"}\n- action : bascule automatique vers ${fallbackModel}`,
    );
    model = fallbackModel;
    return sendRequest(
      model,
      strictSchema,
      repairAttempt,
      repairReason,
      previousContent,
    );
  };

  let response = await sendWithRateLimitRecovery(
    true,
    0,
    "",
    "",
    "Tentative initiale",
  );

  if (!response.ok && testMode) {
    const strictDetail = await response.text();
    httpDiagnostics.push(
      `Tentative avec schéma strict :\n- statut HTTP : ${response.status}\n- détails : ${strictDetail.slice(0, 2000) || "aucun"}`,
    );
    response = await sendWithRateLimitRecovery(
      false,
      0,
      "",
      "",
      "Relance initiale sans schéma strict",
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `OpenRouter a refusé la phase.\n- modèle : ${model}\n- schéma : ${input.schemaName}\n- statut HTTP : ${response.status}\n- détails : ${detail.slice(0, 2000) || "aucun"}${httpDiagnostics.length ? `\n\n${httpDiagnostics.join("\n\n")}` : ""}`,
    );
  }

  let result = await readOpenRouterResult(
    response,
    model,
    "Tentative initiale",
  );
  const diagnostics = [
    ...httpDiagnostics,
    describeOpenRouterResult(result, model, "Tentative initiale"),
  ];
  let content = getOpenRouterContent(result);
  if (!content) {
    response = await sendWithRateLimitRecovery(
      false,
      1,
      "choices[0].message.content était vide ou absent",
      "",
      "Relance après contenu vide",
    );
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `OpenRouter n'a retourné aucun contenu et la relance a échoué.\n${diagnostics.join("\n\n")}\n\nRelance sans schéma strict :\n- statut HTTP : ${response.status}\n- détails : ${detail.slice(0, 2000) || "aucun"}`,
      );
    }
    result = await readOpenRouterResult(
      response,
      model,
      "Relance sans schéma strict",
    );
    diagnostics.push(
      describeOpenRouterResult(result, model, "Relance sans schéma strict"),
    );
    content = getOpenRouterContent(result);
  }
  if (!content)
    throw new Error(
      `OpenRouter n'a retourné aucun contenu après deux tentatives.\n${diagnostics.join("\n\n")}`,
    );
  let candidateContent = content;
  for (let parseAttempt = 0; parseAttempt < 3; parseAttempt += 1) {
    let repairReason = "";
    try {
      const parsed = JSON.parse(cleanJson(candidateContent)) as unknown;
      const normalized = input.normalize?.(parsed) ?? parsed;
      const validationErrors = input.validate?.(normalized) ?? [];
      if (validationErrors.length === 0) return normalized;
      repairReason = validationErrors.join("; ");
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      repairReason = `JSON invalide ou tronque : ${error.message}`;
    }

    if (parseAttempt === 2) {
      throw new Error(
        `La phase IA reste invalide après trois tentatives.\n- modèle : ${model}\n- schéma : ${input.schemaName}\n- dernière erreur : ${repairReason}\n\n${diagnostics.join("\n\n")}\n\nClique sur Réessayer : les étapes déjà terminées seront conservées.`,
      );
    }

    response = await sendWithRateLimitRecovery(
      parseAttempt === 0,
      parseAttempt + 1,
      repairReason,
      candidateContent,
      `Réparation ${parseAttempt + 1}`,
    );
    if (!response.ok && parseAttempt === 0) {
      const strictRepairDetail = await response.text();
      diagnostics.push(
        `Réparation ${parseAttempt + 1} avec schéma strict :\n- statut HTTP : ${response.status}\n- détails : ${strictRepairDetail.slice(0, 2000) || "aucun"}`,
      );
      response = await sendWithRateLimitRecovery(
        false,
        parseAttempt + 1,
        repairReason,
        candidateContent,
        `Réparation ${parseAttempt + 1} sans schéma strict`,
      );
    }
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `OpenRouter n'a pas pu réparer la réponse.\n- modèle : ${model}\n- schéma : ${input.schemaName}\n- tentative : ${parseAttempt + 2}\n- statut HTTP : ${response.status}\n- détails : ${detail.slice(0, 2000) || "aucun"}\n\n${diagnostics.join("\n\n")}`,
      );
    }

    const repairedResult = await readOpenRouterResult(
      response,
      model,
      `Réparation ${parseAttempt + 1}`,
    );
    diagnostics.push(
      describeOpenRouterResult(
        repairedResult,
        model,
        `Réparation ${parseAttempt + 1}`,
      ),
    );
    candidateContent = getOpenRouterContent(repairedResult);
    if (!candidateContent)
      throw new Error(
        `OpenRouter n'a retourné aucun contenu pendant la réparation.\n${diagnostics.join("\n\n")}`,
      );
  }

  throw new Error("La phase IA n'a pas produit de JSON exploitable.");
}

type RawGeneratedQuiz = Omit<ReusableQuiz, "questions"> & {
  placementAfterSectionId: string;
  questions: Array<{
    id: string;
    question: string;
    subtitle: string;
    options: Array<{
      id: string;
      label: string;
      description: string;
      imageAlt: string;
      imagePrompt: string;
      category: string;
      weights: Array<{ resultId: string; value: number }>;
      nextQuestionId: string;
      resultId: string;
    }>;
  }>;
};

function validateGeneratedQuiz(value: unknown, outline: ArticleOutline) {
  const quiz = value as Partial<RawGeneratedQuiz> | null;
  const errors: string[] = [];
  const sectionIds = new Set(outline.sections.map((section) => section.id));
  if (!quiz?.placementAfterSectionId)
    errors.push("placementAfterSectionId est vide");
  else if (!sectionIds.has(quiz.placementAfterSectionId))
    errors.push("placementAfterSectionId doit viser une section existante");
  if (!Array.isArray(quiz?.questions) || quiz.questions.length < 3)
    errors.push("questions doit contenir au moins trois questions");
  else {
    const questionIds = new Set(quiz.questions.map((question) => question.id));
    if (questionIds.size !== quiz.questions.length)
      errors.push("chaque question doit avoir un id unique");
    if (
      quiz.questions.some(
        (question) =>
          !Array.isArray(question?.options) || question.options.length < 2,
      )
    )
      errors.push("chaque question doit proposer au moins deux options");
    if (
      quiz.questions.some((question) =>
        question.options?.some(
          (option) =>
            option.nextQuestionId &&
            !questionIds.has(option.nextQuestionId),
        ),
      )
    )
      errors.push("chaque nextQuestionId doit viser une question existante");
  }
  if (!Array.isArray(quiz?.results) || quiz.results.length < 2)
    errors.push("results doit contenir au moins deux resultats");
  else {
    const resultIds = new Set(quiz.results.map((result) => result.id));
    if (resultIds.size !== quiz.results.length)
      errors.push("chaque resultat doit avoir un id unique");
    if (
      quiz.questions?.some((question) =>
        question.options?.some(
          (option) =>
            (option.resultId && !resultIds.has(option.resultId)) ||
            option.weights?.some(
              (weight) => !resultIds.has(weight.resultId),
            ),
        ),
      )
    )
      errors.push("les options doivent viser uniquement des resultats existants");
  }
  return errors;
}

function normalizeGeneratedQuiz(value: unknown, outline: ArticleOutline) {
  const quiz = value as Partial<RawGeneratedQuiz> | null;
  if (!quiz) return value;
  const sectionIds = new Set(outline.sections.map((section) => section.id));
  const fallbackSectionId = sectionIds.has(outline.quizRequest.afterSectionId)
    ? outline.quizRequest.afterSectionId
    : outline.sections.at(-1)?.id;
  return {
    ...quiz,
    placementAfterSectionId: sectionIds.has(
      quiz.placementAfterSectionId ?? "",
    )
      ? quiz.placementAfterSectionId
      : fallbackSectionId,
  };
}

export type GeneratedQuizPlan = {
  quiz: ReusableQuiz;
  placementAfterSectionId: string;
};

export async function generateArticleQuiz(input: {
  topic: string;
  projectName: string;
  outline: ArticleOutline;
  executionMode: EditorialExecutionMode;
}) {
  const skill = await loadRuntimeSkill("quiz-generation");
  const raw = (await askOpenRouter({
    schemaName: "interactive_article_quiz",
    model:
      process.env.OPENROUTER_QUIZ_MODEL ?? process.env.OPENROUTER_CONTENT_MODEL,
    maxTokens: 4200,
    executionMode: input.executionMode,
    normalize: (value) => normalizeGeneratedQuiz(value, input.outline),
    validate: (value) => validateGeneratedQuiz(value, input.outline),
    system: `${skill}\n\nTu produis une configuration JSON exacte pour le moteur de quiz existant.`,
    prompt: `Projet : ${input.projectName}\nSujet : ${input.topic}\n\nPlan verrouillé :\n${JSON.stringify(input.outline)}\n\nCrée uniquement le quiz demandé par quizRequest. Respecte exactement son format, son objectif, ses catégories, son CTA et placementAfterSectionId. Les identifiants sont courts, uniques et en kebab-case. nextQuestionId et resultId sont des chaînes vides quand ils ne sont pas utilisés. N'invente aucun chiffre ni promesse commerciale.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "name",
        "title",
        "subtitle",
        "mode",
        "nextLabel",
        "resultTitle",
        "resultText",
        "cta",
        "placementAfterSectionId",
        "questions",
        "results",
      ],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        mode: {
          type: "string",
          enum: [
            "visual-preference",
            "diagnostic",
            "recommendation",
            "branching",
          ],
        },
        nextLabel: { type: "string" },
        resultTitle: { type: "string" },
        resultText: { type: "string" },
        cta: {
          type: "object",
          additionalProperties: false,
          required: ["label", "href"],
          properties: { label: { type: "string" }, href: { type: "string" } },
        },
        placementAfterSectionId: { type: "string" },
        questions: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "question", "subtitle", "options"],
            properties: {
              id: { type: "string" },
              question: { type: "string" },
              subtitle: { type: "string" },
              options: {
                type: "array",
                minItems: 2,
                maxItems: 4,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "id",
                    "label",
                    "description",
                    "imageAlt",
                    "imagePrompt",
                    "category",
                    "weights",
                    "nextQuestionId",
                    "resultId",
                  ],
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    description: { type: "string" },
                    imageAlt: { type: "string" },
                    imagePrompt: { type: "string" },
                    category: { type: "string" },
                    weights: {
                      type: "array",
                      maxItems: 5,
                      items: {
                        type: "object",
                        additionalProperties: false,
                        required: ["resultId", "value"],
                        properties: {
                          resultId: { type: "string" },
                          value: { type: "number" },
                        },
                      },
                    },
                    nextQuestionId: { type: "string" },
                    resultId: { type: "string" },
                  },
                },
              },
            },
          },
        },
        results: {
          type: "array",
          minItems: 2,
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "id",
              "category",
              "title",
              "text",
              "description",
              "imageAlt",
              "imagePrompt",
              "recommendations",
              "cta",
            ],
            properties: {
              id: { type: "string" },
              category: { type: "string" },
              title: { type: "string" },
              text: { type: "string" },
              description: { type: "string" },
              imageAlt: { type: "string" },
              imagePrompt: { type: "string" },
              recommendations: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: { type: "string" },
              },
              cta: {
                type: "object",
                additionalProperties: false,
                required: ["label", "href"],
                properties: {
                  label: { type: "string" },
                  href: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  })) as RawGeneratedQuiz;

  const quiz: ReusableQuiz = {
    ...raw,
    questions: raw.questions.map((question) => ({
      ...question,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        description: option.description,
        imageAlt: option.imageAlt,
        imagePrompt: option.imagePrompt,
        category: option.category,
        scores: Object.fromEntries(
          option.weights.map((weight) => [weight.resultId, weight.value]),
        ),
        nextQuestionId: option.nextQuestionId || undefined,
        resultId: option.resultId || undefined,
      })),
    })),
  };
  delete (quiz as ReusableQuiz & { placementAfterSectionId?: string })
    .placementAfterSectionId;
  return {
    quiz,
    placementAfterSectionId: raw.placementAfterSectionId,
  } satisfies GeneratedQuizPlan;
}

export async function researchTopic(input: {
  mode: EditorialMode;
  executionMode: EditorialExecutionMode;
  topic: string;
  projectName: string;
  source?: string;
  discoverTopic?: boolean;
  performance: EditorialPerformanceSnapshot;
}) {
  const skill = await loadRuntimeSkill("article-research");
  const existingArticles = input.performance.pages.filter((page) =>
    page.path.startsWith("/blog/"),
  );
  const excludedTopics = existingArticles.map((page) => page.title);
  const existingTopicsContext = existingArticles
    .map(
      (page) =>
        `- ${page.title} (${page.path}) : ${page.searchConsole.impressions} impressions, ${page.searchConsole.clicks} clics, ${page.googleAnalytics.pageViews} vues GA4`,
    )
    .join("\n");
  const sourceContext = input.source
    ? `Source imposée par l’utilisateur (URL ou transcription) :\n${input.source.slice(0, 12000)}`
    : input.executionMode === "test" &&
        process.env.OPENROUTER_DEMO_WEB_SEARCH !== "true"
      ? "Mode démo sans recherche web : utilise uniquement les données historiques transmises et indique clairement les informations externes manquantes."
      : "Aucune source imposée : effectue une recherche web indépendante.";

  const result = (await askOpenRouter({
    schemaName: "landscaper_research_brief",
    research: true,
    executionMode: input.executionMode,
    maxTokens: 3000,
    validate: (value) =>
      validateResearchBrief(
        value,
        input.discoverTopic ? excludedTopics : [],
      ),
    system: `${skill}\n\nTu es l’agent de recherche d’une rédaction française spécialisée dans le paysage et le jardin.`,
    prompt: `${modeInstructions[input.mode]}\n\nProjet : ${input.projectName}\n${input.discoverTopic ? "Aucun sujet n'est imposé. Choisis toi-même UN sujet précis, nouveau et utile. Il est interdit de paraphraser, prolonger ou reproduire l'angle d'un article existant. Une page faible ou avec peu d'impressions n'est pas une idée à recréer : elle doit au contraire être exclue des nouveaux sujets. Une page gagnante peut révéler un intérêt général, mais le nouveau sujet doit traiter un autre problème concret, une autre intention et un autre vocabulaire principal." : `Sujet imposé : ${input.topic}`}\n\nARTICLES EXISTANTS INTERDITS COMME SUJETS :\n${existingTopicsContext || "Aucun article existant."}\n\n${sourceContext}\n\nDONNÉES HISTORIQUES RÉELLES DU SITE :\n${JSON.stringify(input.performance)}\n\nCommence par comparer les anciennes pages sans inventer de données. Une page récente ou sans données ne doit jamais être déclarée faible. Croise Google Analytics 4 et Google Search Console lorsqu'ils sont présents : trafic et engagement d'un côté, impressions, clics, CTR et position de l'autre. Utilise les performances uniquement pour identifier des besoins adjacents encore non traités. N'utilise jamais une faible performance pour recréer le même sujet. Puis complète par des sources web fiables si l'outil de recherche est disponible. Chaque fait externe doit être associé à une URL réellement consultée. Si aucune recherche web n'est disponible, n'invente aucune URL et utilise un tableau facts vide. Prépare aussi les questions auxquelles l’article doit répondre, les mots-clés naturels et les précautions éventuelles.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "topic",
        "summary",
        "searchIntent",
        "audience",
        "angle",
        "facts",
        "questions",
        "keywords",
        "safetyNotes",
        "performanceAnalysis",
      ],
      properties: {
        topic: { type: "string" },
        summary: { type: "string" },
        searchIntent: { type: "string" },
        audience: { type: "string" },
        angle: { type: "string" },
        facts: {
          type: "array",
          minItems: 0,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["claim", "sourceTitle", "sourceUrl"],
            properties: {
              claim: { type: "string" },
              sourceTitle: { type: "string" },
              sourceUrl: { type: "string" },
            },
          },
        },
        questions: {
          type: "array",
          minItems: 3,
          maxItems: 8,
          items: { type: "string" },
        },
        keywords: {
          type: "array",
          minItems: 4,
          maxItems: 12,
          items: { type: "string" },
        },
        safetyNotes: { type: "array", maxItems: 6, items: { type: "string" } },
        performanceAnalysis: {
          type: "object",
          additionalProperties: false,
          required: [
            "dataStatus",
            "summary",
            "mainFindings",
            "winningPages",
            "weakPages",
            "seoOpportunities",
            "contentPatterns",
          ],
          properties: {
            dataStatus: {
              type: "string",
              enum: ["connected", "partial", "missing"],
            },
            summary: { type: "string" },
            mainFindings: {
              type: "array",
              maxItems: 8,
              items: { type: "string" },
            },
            winningPages: {
              type: "array",
              maxItems: 8,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["path", "reason"],
                properties: {
                  path: { type: "string" },
                  reason: { type: "string" },
                },
              },
            },
            weakPages: {
              type: "array",
              maxItems: 8,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["path", "reason"],
                properties: {
                  path: { type: "string" },
                  reason: { type: "string" },
                },
              },
            },
            seoOpportunities: {
              type: "array",
              maxItems: 8,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["path", "opportunity"],
                properties: {
                  path: { type: "string" },
                  opportunity: { type: "string" },
                },
              },
            },
            contentPatterns: {
              type: "array",
              maxItems: 8,
              items: { type: "string" },
            },
          },
        },
      },
    },
  })) as ResearchBrief;

  if (
    !result.topic?.trim() ||
    !result.summary?.trim() ||
    !Array.isArray(result.facts) ||
    !result.performanceAnalysis
  ) {
    throw new Error("Le dossier de recherche est incomplet.");
  }
  return result;
}

export async function structureArticle(input: {
  topic: string;
  research: ResearchBrief;
  executionMode: EditorialExecutionMode;
}) {
  const skill = await loadRuntimeSkill("article-structure");
  const result = (await askOpenRouter({
    schemaName: "landscaper_article_outline",
    executionMode: input.executionMode,
    maxTokens: 5200,
    normalize: normalizeArticleOutline,
    validate: validateArticleOutline,
    system: `${skill}\n\nTu es l’architecte éditorial d’un blog de paysagiste français.`,
    prompt: `Sujet : ${input.topic}\n\nDossier de recherche validé :\n${JSON.stringify(input.research)}\n\nConstruis un titre clair, un résumé de 140 à 220 caractères et un plan H2/H3 détaillé pour un article de 900 à 1400 mots. Chaque grande partie est un H2 avec le style de section du builder ; les H3 sont réservés aux sous-parties du H2 précédent. Chaque titre est un bloc distinct des paragraphes. Chaque section reçoit un identifiant kebab-case, un objectif, des points précis, un format, une variante et une instruction de composant. Le plan doit contenir au moins deux vrais composants utiles parmi table, cards et callout, placés dans des sections différentes. Pour cards, utilise toujours default : les cartes à icônes doivent rester blanches. Pour table, choisis default ou comparison. Pour callout, utilise toujours highlight : un encadré d'information avec ampoule et dégradé jaune léger. Pour prose, utilise default. Demande exactement une image hero et au maximum trois images inline. Une image inline doit référencer un sectionId existant. Le quiz est désactivé par défaut. Active-le uniquement si les réponses permettent une recommandation réellement personnalisée fondée sur au moins trois critères distincts ; ne l'active jamais simplement pour rendre l'article interactif. Sinon retourne enabled=false et des champs vides. Le slug ne contient que des lettres ASCII, chiffres et tirets.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "excerpt",
        "category",
        "slug",
        "heroImageAlt",
        "readingTime",
        "sections",
        "imageRequests",
        "quizRequest",
      ],
      properties: {
        title: { type: "string" },
        excerpt: { type: "string" },
        category: { type: "string", enum: [...ARTICLE_CATEGORIES] },
        slug: { type: "string" },
        heroImageAlt: { type: "string" },
        readingTime: { type: "string" },
        sections: {
          type: "array",
          minItems: 4,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "id",
              "level",
              "title",
              "purpose",
              "points",
              "format",
              "componentVariant",
              "componentInstruction",
            ],
            properties: {
              id: { type: "string" },
              level: { type: "string", enum: ["h2", "h3"] },
              title: { type: "string" },
              purpose: { type: "string" },
              points: {
                type: "array",
                minItems: 1,
                maxItems: 6,
                items: { type: "string" },
              },
              format: {
                type: "string",
                enum: ["prose", "table", "cards", "callout"],
              },
              componentVariant: {
                type: "string",
                enum: [
                  "default",
                  "comparison",
                  "yellow",
                  "outlined",
                  "highlight",
                  "quote",
                  "solution",
                ],
              },
              componentInstruction: { type: "string" },
            },
          },
        },
        imageRequests: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "id",
              "kind",
              "afterSectionId",
              "purpose",
              "prompt",
              "alt",
              "caption",
              "aspectRatio",
            ],
            properties: {
              id: { type: "string" },
              kind: { type: "string", enum: ["hero", "inline"] },
              afterSectionId: { type: "string" },
              purpose: { type: "string" },
              prompt: { type: "string" },
              alt: { type: "string" },
              caption: { type: "string" },
              aspectRatio: { type: "string", enum: ["16:9", "4:3", "1:1"] },
            },
          },
        },
        quizRequest: {
          type: "object",
          additionalProperties: false,
          required: [
            "enabled",
            "afterSectionId",
            "goal",
            "format",
            "resultCategories",
            "ctaLabel",
          ],
          properties: {
            enabled: { type: "boolean" },
            afterSectionId: { type: "string" },
            goal: { type: "string" },
            format: {
              type: "string",
              enum: [
                "visual-preference",
                "diagnostic",
                "recommendation",
                "branching",
              ],
            },
            resultCategories: {
              type: "array",
              maxItems: 5,
              items: { type: "string" },
            },
            ctaLabel: { type: "string" },
          },
        },
      },
    },
  })) as ArticleOutline;

  const sectionIds = new Set(result.sections?.map((section) => section.id));
  const heroRequests =
    result.imageRequests?.filter((image) => image.kind === "hero") ?? [];
  const invalidInline = result.imageRequests?.some(
    (image) => image.kind === "inline" && !sectionIds.has(image.afterSectionId),
  );
  const invalidQuiz =
    result.quizRequest?.enabled &&
    !sectionIds.has(result.quizRequest.afterSectionId);
  if (
    !result.title?.trim() ||
    !Array.isArray(result.sections) ||
    result.sections.length < 4 ||
    sectionIds.size !== result.sections.length ||
    heroRequests.length !== 1 ||
    invalidInline ||
    invalidQuiz
  ) {
    throw new Error(
      "Le plan éditorial ou ses emplacements média sont invalides.",
    );
  }
  return result;
}

export async function writeArticle(input: {
  topic: string;
  outline: ArticleOutline;
  images: ResolvedArticleImage[];
  quizPlan?: GeneratedQuizPlan;
  executionMode: EditorialExecutionMode;
}) {
  const skill = await loadRuntimeSkill("article-writing");
  const result = (await askOpenRouter({
    schemaName: "landscaper_article",
    executionMode: input.executionMode,
    maxTokens: 7200,
    normalize: (value) =>
      normalizeGeneratedArticle(
        value,
        input.outline.sections.map((section) => section.id),
      ),
    validate: (value) =>
      validateGeneratedArticle(value, input.outline),
    system: `${skill}\n\nTu es le rédacteur final d’un blog de paysagiste français. Le texte est concret, original, fluide et compréhensible, sans bourrage de mots-clés.`,
    prompt: `Sujet : ${input.topic}\n\nPlan éditorial verrouillé :\n${JSON.stringify(input.outline)}\n\nImages déjà résolues :\n${JSON.stringify(input.images)}\n\nQuiz déjà résolu :\n${JSON.stringify(input.quizPlan ?? null)}\n\nRédige maintenant un article réellement complet de 900 à 1400 mots. Le minimum absolu est 850 mots utiles, composants compris. Retourne exactement une entrée par sectionId, dans le même ordre que le plan. Rédige pour chaque section deux à quatre paragraphes naturels totalisant au moins 45 mots. Les titres, images et quiz seront assemblés par le code : ne les répète pas dans paragraphs. Pour format=prose, remplis paragraphs et laisse les composants vides. Pour format=table, fournis un titre, au moins deux colonnes et au moins deux lignes de même largeur. Pour format=cards, fournis un titre et au moins deux cartes avec icône, titre et texte. Pour format=callout, fournis un titre et un texte d'encadré substantiel. Ne remplace jamais un composant demandé par une simple phrase dans paragraphs.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "excerpt",
        "category",
        "slug",
        "heroImageAlt",
        "readingTime",
        "sections",
      ],
      properties: {
        title: { type: "string" },
        excerpt: { type: "string" },
        category: { type: "string", enum: [...ARTICLE_CATEGORIES] },
        slug: { type: "string" },
        heroImageAlt: { type: "string" },
        readingTime: { type: "string" },
        sections: {
          type: "array",
          minItems: 4,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "sectionId",
              "paragraphs",
              "tableTitle",
              "tableColumns",
              "tableRows",
              "cardsTitle",
              "cards",
              "calloutTitle",
              "calloutText",
            ],
            properties: {
              sectionId: { type: "string" },
              paragraphs: {
                type: "array",
                minItems: 1,
                maxItems: 5,
                items: { type: "string" },
              },
              tableTitle: { type: "string" },
              tableColumns: {
                type: "array",
                maxItems: 6,
                items: { type: "string" },
              },
              tableRows: {
                type: "array",
                maxItems: 10,
                items: {
                  type: "array",
                  maxItems: 6,
                  items: { type: "string" },
                },
              },
              cardsTitle: { type: "string" },
              cards: {
                type: "array",
                maxItems: 6,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["icon", "title", "text"],
                  properties: {
                    icon: { type: "string" },
                    title: { type: "string" },
                    text: { type: "string" },
                  },
                },
              },
              calloutTitle: { type: "string" },
              calloutText: { type: "string" },
            },
          },
        },
      },
    },
  })) as GeneratedArticle;

  const expectedIds = input.outline.sections.map((section) => section.id);
  const actualIds = result.sections?.map((section) => section.sectionId) ?? [];
  if (
    !result.title?.trim() ||
    !result.excerpt?.trim() ||
    !Array.isArray(result.sections) ||
    actualIds.length !== expectedIds.length ||
    actualIds.some((id, index) => id !== expectedIds[index])
  ) {
    throw new Error("La rédaction ne respecte pas la structure verrouillée.");
  }
  return result;
}
