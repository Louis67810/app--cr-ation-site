import "server-only";

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
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("La clé OPENROUTER_API_KEY n’est pas configurée sur cette machine.");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Atelier Site Builder — Pipeline éditorial",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_CONTENT_MODEL ?? "openai/gpt-4.1-mini",
      temperature: input.research ? 0.25 : 0.4,
      max_tokens: input.maxTokens ?? 3600,
      ...(input.research
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

export async function researchTopic(input: {
  mode: EditorialMode;
  topic: string;
  projectName: string;
  source?: string;
}) {
  const sourceContext = input.source
    ? `Source imposée par l’utilisateur (URL ou transcription) :\n${input.source.slice(0, 12000)}`
    : "Aucune source imposée : effectue une recherche web indépendante.";

  const result = (await askOpenRouter({
    schemaName: "landscaper_research_brief",
    research: true,
    maxTokens: 3000,
    system: "Tu es l’agent de recherche d’une rédaction française spécialisée dans le paysage et le jardin. Tu ne rédiges pas l’article. Tu construis un dossier factuel, sourcé et exploitable. N’invente jamais d’URL, de chiffre, d’étude ou de citation.",
    prompt: `${modeInstructions[input.mode]}\n\nProjet : ${input.projectName}\nSujet : ${input.topic}\n\n${sourceContext}\n\nTrouve des sources fiables et variées. Chaque fait doit être formulé avec prudence et associé à une URL réellement consultée. Prépare aussi les questions auxquelles l’article doit répondre, les mots-clés naturels et les précautions éventuelles.`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "searchIntent", "audience", "angle", "facts", "questions", "keywords", "safetyNotes"],
      properties: {
        summary: { type: "string" },
        searchIntent: { type: "string" },
        audience: { type: "string" },
        angle: { type: "string" },
        facts: {
          type: "array",
          minItems: 4,
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
      },
    },
  })) as ResearchBrief;

  if (!result.summary?.trim() || !Array.isArray(result.facts) || result.facts.length < 3) {
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
