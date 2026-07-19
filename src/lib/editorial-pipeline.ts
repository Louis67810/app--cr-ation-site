import "server-only";
import type { ReusableQuiz } from "@/lib/site-template";
import type { EditorialPerformanceSnapshot } from "@/lib/editorial-performance";

export type EditorialMode = "seo" | "youtube" | "trends" | "editorial";

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

export type ArticleOutline = {
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  heroImageAlt: string;
  readingTime: string;
  sections: Array<{
    level: "h2" | "h3";
    title: string;
    purpose: string;
    points: string[];
  }>;
};

export type GeneratedArticle = {
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  heroImageAlt: string;
  readingTime: string;
  blocks: Array<{ kind: "heading" | "paragraph"; level?: "h2" | "h3"; text: string }>;
};

const modeInstructions: Record<EditorialMode, string> = {
  seo: "Cherche un angle evergreen qui répond précisément à une intention de recherche utile aux clients d’un paysagiste.",
  youtube: "Cherche les meilleurs tutoriels et sources autour du sujet. Une vidéo peut inspirer l’angle, mais aucune formulation ne doit être copiée.",
  trends: "Cherche les signaux récents, la saison, la météo et les préoccupations qui progressent, sans transformer un signal faible en certitude.",
  editorial: "Privilégie la vérification des faits, les recommandations prudentes, la sécurité et les sources professionnelles ou institutionnelles.",
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
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("La clé OPENROUTER_API_KEY n’est pas configurée sur cette machine.");

  const demoMode = process.env.AI_DEMO_MODE === "true";
  const model = demoMode
    ? process.env.OPENROUTER_DEMO_MODEL ?? "qwen/qwen3-4b:free"
    : input.model ?? process.env.OPENROUTER_CONTENT_MODEL ?? "openai/gpt-4.1-mini";
  const webSearchEnabled = input.research && (!demoMode || process.env.OPENROUTER_DEMO_WEB_SEARCH === "true");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Atelier Site Builder — Pipeline éditorial",
    },
    body: JSON.stringify({
      model,
      temperature: input.research ? 0.25 : 0.4,
      max_tokens: input.maxTokens ?? 3600,
      ...(webSearchEnabled
        ? { tools: [{ type: "openrouter:web_search", engine: "auto", max_total_results: 7, search_context_size: "high" }] }
        : {}),
      response_format: {
        type: "json_schema",
        json_schema: { name: input.schemaName, strict: true, schema: input.schema },
      },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenRouter a refusé la phase (${response.status})${detail ? ` : ${detail.slice(0, 220)}` : "."}`);
  }

  const result = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter n’a retourné aucun résultat pour cette phase.");
  return JSON.parse(cleanJson(content)) as unknown;
}

type RawGeneratedQuiz = Omit<ReusableQuiz, "questions"> & {
  placementAfterHeading: string;
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
  placementAfterHeading: string;
};

export async function generateArticleQuiz(input: {
  topic: string;
  projectName: string;
  outline: ArticleOutline;
  article: GeneratedArticle;
}) {
  const raw = await askOpenRouter({
    schemaName: "interactive_article_quiz",
    model: process.env.OPENROUTER_QUIZ_MODEL ?? process.env.OPENROUTER_CONTENT_MODEL,
    maxTokens: 4200,
    system: "Tu es un concepteur senior d'expériences interactives et de quiz de recommandation pour des articles web. Tu transformes le contenu d'un article en outil réellement utile à la décision. Tu ne rédiges pas de code React : tu produis une configuration JSON exacte pour le moteur de quiz existant.",
    prompt: `Projet : ${input.projectName}\nSujet : ${input.topic}\n\nStructure :\n${JSON.stringify(input.outline)}\n\nArticle final :\n${JSON.stringify(input.article)}\n\nCrée un quiz interactif directement lié au problème du lecteur. Choisis le mécanisme le plus pertinent : visual-preference pour comparer des styles en images, diagnostic pour qualifier une situation, recommendation pour proposer une solution, ou branching pour un parcours conditionnel. Le quiz doit aider à décider et conduire naturellement vers un CTA. Prévois 3 à 6 questions et 2 à 5 résultats distincts. Pour visual-preference, crée exactement deux options illustrées par question. Pour les autres mécanismes, utilise 2 à 4 options. Chaque option peut pondérer plusieurs résultats, diriger vers une autre question ou déclencher un résultat direct. Fournis pour chaque choix visuel un alt précis et un prompt d'image réaliste sans texte ni logo. Les identifiants sont courts, uniques et en kebab-case. nextQuestionId et resultId sont des chaînes vides quand ils ne sont pas utilisés. Le placement doit correspondre exactement au titre d'un H2 de l'article. N'invente aucun chiffre ni promesse commerciale.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "title", "subtitle", "mode", "nextLabel", "resultTitle", "resultText", "cta", "placementAfterHeading", "questions", "results"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        mode: { type: "string", enum: ["visual-preference", "diagnostic", "recommendation", "branching"] },
        nextLabel: { type: "string" },
        resultTitle: { type: "string" },
        resultText: { type: "string" },
        cta: {
          type: "object",
          additionalProperties: false,
          required: ["label", "href"],
          properties: { label: { type: "string" }, href: { type: "string" } },
        },
        placementAfterHeading: { type: "string" },
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
                  required: ["id", "label", "description", "imageAlt", "imagePrompt", "category", "weights", "nextQuestionId", "resultId"],
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
                        properties: { resultId: { type: "string" }, value: { type: "number" } },
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
            required: ["id", "category", "title", "text", "description", "imageAlt", "imagePrompt", "recommendations", "cta"],
            properties: {
              id: { type: "string" },
              category: { type: "string" },
              title: { type: "string" },
              text: { type: "string" },
              description: { type: "string" },
              imageAlt: { type: "string" },
              imagePrompt: { type: "string" },
              recommendations: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
              cta: {
                type: "object",
                additionalProperties: false,
                required: ["label", "href"],
                properties: { label: { type: "string" }, href: { type: "string" } },
              },
            },
          },
        },
      },
    },
  }) as RawGeneratedQuiz;

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
        scores: Object.fromEntries(option.weights.map((weight) => [weight.resultId, weight.value])),
        nextQuestionId: option.nextQuestionId || undefined,
        resultId: option.resultId || undefined,
      })),
    })),
  };
  delete (quiz as ReusableQuiz & { placementAfterHeading?: string }).placementAfterHeading;
  return { quiz, placementAfterHeading: raw.placementAfterHeading } satisfies GeneratedQuizPlan;
}

export async function researchTopic(input: {
  mode: EditorialMode;
  topic: string;
  projectName: string;
  source?: string;
  performance: EditorialPerformanceSnapshot;
}) {
  const sourceContext = input.source
    ? `Source imposée par l’utilisateur (URL ou transcription) :\n${input.source.slice(0, 12000)}`
    : process.env.AI_DEMO_MODE === "true" && process.env.OPENROUTER_DEMO_WEB_SEARCH !== "true"
      ? "Mode démo sans recherche web : utilise uniquement les données historiques transmises et indique clairement les informations externes manquantes."
      : "Aucune source imposée : effectue une recherche web indépendante.";

  const result = (await askOpenRouter({
    schemaName: "landscaper_research_brief",
    research: true,
    maxTokens: 3000,
    system: "Tu es l’agent de recherche d’une rédaction française spécialisée dans le paysage et le jardin. Tu ne rédiges pas l’article. Tu construis un dossier factuel, sourcé et exploitable. N’invente jamais d’URL, de chiffre, d’étude ou de citation.",
    prompt: `${modeInstructions[input.mode]}\n\nProjet : ${input.projectName}\nSujet : ${input.topic}\n\n${sourceContext}\n\nDONNÉES HISTORIQUES RÉELLES DU SITE :\n${JSON.stringify(input.performance)}\n\nCommence par comparer les anciennes pages sans inventer de données. Une page récente ou sans données ne doit jamais être déclarée faible. Croise Analytics, Search Console et AgenceFlow lorsqu'ils sont présents. Utilise les pages gagnantes, faibles et les opportunités SEO pour choisir l'angle du nouveau contenu. Puis complète par des sources web fiables si l'outil de recherche est disponible. Chaque fait externe doit être associé à une URL réellement consultée. Si aucune recherche web n'est disponible, n'invente aucune URL et utilise un tableau facts vide. Prépare aussi les questions auxquelles l’article doit répondre, les mots-clés naturels et les précautions éventuelles.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "searchIntent", "audience", "angle", "facts", "questions", "keywords", "safetyNotes", "performanceAnalysis"],
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
        questions: { type: "array", minItems: 3, maxItems: 8, items: { type: "string" } },
        keywords: { type: "array", minItems: 4, maxItems: 12, items: { type: "string" } },
        safetyNotes: { type: "array", maxItems: 6, items: { type: "string" } },
        performanceAnalysis: {
          type: "object",
          additionalProperties: false,
          required: ["dataStatus", "summary", "mainFindings", "winningPages", "weakPages", "seoOpportunities", "contentPatterns"],
          properties: {
            dataStatus: { type: "string", enum: ["connected", "partial", "missing"] },
            summary: { type: "string" },
            mainFindings: { type: "array", maxItems: 8, items: { type: "string" } },
            winningPages: {
              type: "array", maxItems: 8, items: { type: "object", additionalProperties: false, required: ["path", "reason"], properties: { path: { type: "string" }, reason: { type: "string" } } },
            },
            weakPages: {
              type: "array", maxItems: 8, items: { type: "object", additionalProperties: false, required: ["path", "reason"], properties: { path: { type: "string" }, reason: { type: "string" } } },
            },
            seoOpportunities: {
              type: "array", maxItems: 8, items: { type: "object", additionalProperties: false, required: ["path", "opportunity"], properties: { path: { type: "string" }, opportunity: { type: "string" } } },
            },
            contentPatterns: { type: "array", maxItems: 8, items: { type: "string" } },
          },
        },
      },
    },
  })) as ResearchBrief;

  if (!result.summary?.trim() || !Array.isArray(result.facts) || !result.performanceAnalysis) {
    throw new Error("Le dossier de recherche est incomplet.");
  }
  return result;
}

export async function structureArticle(input: { topic: string; research: ResearchBrief }) {
  const result = (await askOpenRouter({
    schemaName: "landscaper_article_outline",
    system: "Tu es l’architecte éditorial d’un blog de paysagiste français. Tu ne rédiges pas encore l’article. Tu transformes un dossier de recherche en plan logique, utile, sans répétition et adapté à l’intention de recherche.",
    prompt: `Sujet : ${input.topic}\n\nDossier de recherche :\n${JSON.stringify(input.research)}\n\nConstruis un titre clair, un résumé de 140 à 220 caractères et un plan H2/H3 détaillé pour un article de 900 à 1400 mots. Chaque section doit avoir un objectif et des points précis à traiter. Le slug ne contient que des lettres ASCII, chiffres et tirets.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "excerpt", "category", "slug", "heroImageAlt", "readingTime", "sections"],
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
            required: ["level", "title", "purpose", "points"],
            properties: {
              level: { type: "string", enum: ["h2", "h3"] },
              title: { type: "string" },
              purpose: { type: "string" },
              points: { type: "array", minItems: 1, maxItems: 6, items: { type: "string" } },
            },
          },
        },
      },
    },
  })) as ArticleOutline;

  if (!result.title?.trim() || !Array.isArray(result.sections) || result.sections.length < 4) {
    throw new Error("Le plan éditorial est incomplet.");
  }
  return result;
}

export async function writeArticle(input: { topic: string; research: ResearchBrief; outline: ArticleOutline }) {
  const result = (await askOpenRouter({
    schemaName: "landscaper_article",
    maxTokens: 4800,
    system: "Tu es le rédacteur final d’un blog de paysagiste français. Tu suis strictement le dossier de recherche et le plan validé. Le texte est concret, original, fluide et compréhensible, sans bourrage de mots-clés. N’ajoute aucun fait, chiffre, étude ou citation absent du dossier.",
    prompt: `Sujet : ${input.topic}\n\nDossier de recherche :\n${JSON.stringify(input.research)}\n\nPlan éditorial :\n${JSON.stringify(input.outline)}\n\nRédige maintenant l’article complet de 900 à 1400 mots. Respecte le titre, le résumé, le slug et l’ordre du plan. Utilise des titres H2/H3 et des paragraphes substantiels. Ne mets pas de Markdown dans les textes et ne produis que le JSON demandé.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "excerpt", "category", "slug", "heroImageAlt", "readingTime", "blocks"],
      properties: {
        title: { type: "string" },
        excerpt: { type: "string" },
        category: { type: "string" },
        slug: { type: "string" },
        heroImageAlt: { type: "string" },
        readingTime: { type: "string" },
        blocks: {
          type: "array",
          minItems: 8,
          maxItems: 22,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["kind", "text"],
            properties: {
              kind: { type: "string", enum: ["heading", "paragraph"] },
              level: { type: "string", enum: ["h2", "h3"] },
              text: { type: "string" },
            },
          },
        },
      },
    },
  })) as GeneratedArticle;

  if (!result.title?.trim() || !result.excerpt?.trim() || !Array.isArray(result.blocks) || result.blocks.length < 6) {
    throw new Error("L’article rédigé est incomplet.");
  }
  return result;
}
