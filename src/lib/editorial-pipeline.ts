import "server-only";
import type { ReusableQuiz } from "@/lib/site-template";
import type { EditorialPerformanceSnapshot } from "@/lib/editorial-performance";
import { loadRuntimeSkill } from "@/lib/ai-runtime-skills";

export type EditorialMode = "seo" | "youtube" | "trends" | "editorial";
export type EditorialExecutionMode = "test" | "classic";

export type ResearchBrief = {
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
  return content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
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
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey)
    throw new Error(
      "La clé OPENROUTER_API_KEY n’est pas configurée sur cette machine.",
    );

  const testMode = input.executionMode === "test";
  const model = testMode
    ? (process.env.OPENROUTER_DEMO_MODEL ?? "qwen/qwen3-4b:free")
    : (input.model ??
      process.env.OPENROUTER_CONTENT_MODEL ??
      "openai/gpt-4.1-mini");
  const webSearchEnabled =
    input.research &&
    (!testMode || process.env.OPENROUTER_DEMO_WEB_SEARCH === "true");
  let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Atelier Site Builder — Pipeline éditorial",
    },
    body: JSON.stringify({
      model,
      temperature: input.research ? 0.25 : 0.4,
      max_tokens: input.maxTokens ?? 3600,
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
      response_format: {
        type: "json_schema",
        json_schema: {
          name: input.schemaName,
          strict: true,
          schema: input.schema,
        },
      },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
    }),
  });

  if (!response.ok && testMode) {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: input.research ? 0.25 : 0.4,
        max_tokens: input.maxTokens ?? 3600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt },
        ],
      }),
    });
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `OpenRouter a refusé la phase (${response.status})${detail ? ` : ${detail.slice(0, 220)}` : "."}`,
    );
  }

  const result = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = result.choices?.[0]?.message?.content;
  if (!content)
    throw new Error("OpenRouter n’a retourné aucun résultat pour cette phase.");
  return JSON.parse(cleanJson(content)) as unknown;
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
  performance: EditorialPerformanceSnapshot;
}) {
  const skill = await loadRuntimeSkill("article-research");
  const sourceContext = input.source
    ? `Source imposée par l’utilisateur (URL ou transcription) :\n${input.source.slice(0, 12000)}`
    : process.env.AI_DEMO_MODE !== "false" &&
        process.env.OPENROUTER_DEMO_WEB_SEARCH !== "true"
      ? "Mode démo sans recherche web : utilise uniquement les données historiques transmises et indique clairement les informations externes manquantes."
      : "Aucune source imposée : effectue une recherche web indépendante.";

  const result = (await askOpenRouter({
    schemaName: "landscaper_research_brief",
    research: true,
    executionMode: input.executionMode,
    maxTokens: 3000,
    system: `${skill}\n\nTu es l’agent de recherche d’une rédaction française spécialisée dans le paysage et le jardin.`,
    prompt: `${modeInstructions[input.mode]}\n\nProjet : ${input.projectName}\nSujet : ${input.topic}\n\n${sourceContext}\n\nDONNÉES HISTORIQUES RÉELLES DU SITE :\n${JSON.stringify(input.performance)}\n\nCommence par comparer les anciennes pages sans inventer de données. Une page récente ou sans données ne doit jamais être déclarée faible. Croise Google Analytics 4 et Google Search Console lorsqu'ils sont présents : trafic et engagement d'un côté, impressions, clics, CTR et position de l'autre. Utilise les pages gagnantes, faibles et les opportunités SEO pour choisir l'angle du nouveau contenu. Puis complète par des sources web fiables si l'outil de recherche est disponible. Chaque fait externe doit être associé à une URL réellement consultée. Si aucune recherche web n'est disponible, n'invente aucune URL et utilise un tableau facts vide. Prépare aussi les questions auxquelles l’article doit répondre, les mots-clés naturels et les précautions éventuelles.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
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
    system: `${skill}\n\nTu es l’architecte éditorial d’un blog de paysagiste français.`,
    prompt: `Sujet : ${input.topic}\n\nDossier de recherche validé :\n${JSON.stringify(input.research)}\n\nConstruis un titre clair, un résumé de 140 à 220 caractères et un plan H2/H3 détaillé pour un article de 900 à 1400 mots. Chaque grande partie est un H2 avec le style de section du builder ; les H3 sont réservés aux sous-parties du H2 précédent. Chaque titre est un bloc distinct des paragraphes. Chaque section reçoit un identifiant kebab-case, un objectif, des points précis, un format et une instruction de composant. Demande exactement une image hero et au maximum trois images inline. Une image inline doit référencer un sectionId existant. Décide si un quiz apporte une vraie aide au lecteur ; sinon retourne enabled=false et des champs vides. Le slug ne contient que des lettres ASCII, chiffres et tirets.`,
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
        category: { type: "string" },
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
    maxTokens: 4800,
    system: `${skill}\n\nTu es le rédacteur final d’un blog de paysagiste français. Le texte est concret, original, fluide et compréhensible, sans bourrage de mots-clés.`,
    prompt: `Sujet : ${input.topic}\n\nPlan éditorial verrouillé :\n${JSON.stringify(input.outline)}\n\nImages déjà résolues :\n${JSON.stringify(input.images)}\n\nQuiz déjà résolu :\n${JSON.stringify(input.quizPlan ?? null)}\n\nRédige maintenant l’article complet de 900 à 1400 mots. Retourne exactement une entrée par sectionId, dans le même ordre que le plan. Les titres, images et quiz seront assemblés par le code : ne les répète pas. Pour format=prose, remplis paragraphs et laisse les composants vides. Pour table, cards ou callout, rédige aussi le composant demandé tout en conservant au moins un paragraphe d’introduction.`,
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
        category: { type: "string" },
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
