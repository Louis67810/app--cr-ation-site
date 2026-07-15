import { NextResponse } from "next/server";
import { demoArticlePage, demoSitePages } from "@/lib/demo-site";
import { normalizeProjectKey } from "@/lib/project-key";
import { createClient } from "@/lib/supabase/server";
import type { ArticleBlock, ArticleDetailFields, BlogPost, SitePage } from "@/lib/site-template";

export const runtime = "nodejs";
export const maxDuration = 300;

type AgentId = "seo" | "youtube" | "trends" | "editorial";
type GeneratedArticle = {
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  heroImageAlt: string;
  readingTime: string;
  blocks: Array<{ kind: "heading" | "paragraph"; level?: "h2" | "h3"; text: string }>;
};

const agentNames: Record<AgentId, string> = {
  seo: "Rédacteur SEO",
  youtube: "Veille YouTube",
  trends: "Veille tendances",
  editorial: "Contrôleur éditorial",
};

function isAgentId(value: unknown): value is AgentId {
  return value === "seo" || value === "youtube" || value === "trends" || value === "editorial";
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "nouvel-article";
}

function cleanJson(content: string) {
  return content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
}

async function findPopularYoutubeVideo(topic: string) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({ part: "snippet", type: "video", order: "viewCount", maxResults: "5", q: `${topic} jardin tutoriel`, relevanceLanguage: "fr", key });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { next: { revalidate: 3600 } });
  if (!response.ok) return null;
  const data = await response.json() as { items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }> };
  const video = data.items?.find((item) => item.id?.videoId);
  if (!video?.id?.videoId) return null;
  return { url: `https://www.youtube.com/watch?v=${video.id.videoId}`, title: video.snippet?.title ?? topic, channel: video.snippet?.channelTitle ?? "" };
}

async function generateArticle(agentId: AgentId, topic: string, source: string | undefined, youtubeSource: Awaited<ReturnType<typeof findPopularYoutubeVideo>>) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("La clé OPENROUTER_API_KEY n’est pas configurée.");
  const needsResearch = agentId === "trends" || agentId === "editorial" || (agentId === "youtube" && !source);
  const roleInstructions: Record<AgentId, string> = {
    seo: "Rédige un article evergreen qui répond précisément à une intention de recherche classique.",
    youtube: "Transforme les idées utiles de la source en article entièrement original. Ne copie aucune formulation, ne prétends pas avoir vu des éléments absents et cite la vidéo comme inspiration.",
    trends: "Recherche les signaux récents, la saison, la météo et les préoccupations qui progressent. Ne présente jamais une tendance comme certaine sans source fiable.",
    editorial: "Agis comme rédacteur et contrôleur qualité. Vérifie les affirmations, nuance les traitements phytosanitaires et privilégie des recommandations sûres et réalistes.",
  };
  const sourceContext = source
    ? `Source fournie par l’utilisateur (URL ou transcription) :\n${source.slice(0, 12000)}`
    : youtubeSource
      ? `Vidéo populaire trouvée via YouTube Data API : ${youtubeSource.title} — ${youtubeSource.channel} — ${youtubeSource.url}. La transcription n’est pas disponible : n’invente pas son contenu.`
      : "Aucune source imposée.";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://app-cr-ation-site.vercel.app",
      "X-OpenRouter-Title": "Atelier Site Builder — Agents éditoriaux",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_CONTENT_MODEL ?? "openai/gpt-4.1-mini",
      temperature: 0.45,
      max_tokens: 4200,
      ...(needsResearch ? { tools: [{ type: "openrouter:web_search", engine: "auto", max_total_results: 5, search_context_size: "medium" }] } : {}),
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "landscaper_article",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["title", "excerpt", "category", "slug", "heroImageAlt", "readingTime", "blocks"],
            properties: {
              title: { type: "string" }, excerpt: { type: "string" }, category: { type: "string" }, slug: { type: "string" }, heroImageAlt: { type: "string" }, readingTime: { type: "string" },
              blocks: { type: "array", minItems: 7, maxItems: 16, items: { type: "object", additionalProperties: false, required: ["kind", "text"], properties: { kind: { type: "string", enum: ["heading", "paragraph"] }, level: { type: "string", enum: ["h2", "h3"] }, text: { type: "string" } } } },
            },
          },
        },
      },
      messages: [{ role: "system", content: "Tu écris en français pour le blog d’un paysagiste. Le contenu doit être concret, original, compréhensible, sans bourrage de mots-clés. N’invente ni étude, ni chiffre, ni citation. Retourne uniquement le JSON demandé." }, { role: "user", content: `${roleInstructions[agentId]}\n\nSujet : ${topic}\n\n${sourceContext}\n\nCrée un article de 900 à 1400 mots, structuré en paragraphes et titres H2/H3. Le résumé fait 140 à 220 caractères. Le slug ne contient que des lettres ASCII, chiffres et tirets.` }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenRouter a refusé la génération (${response.status})${detail ? ` : ${detail.slice(0, 180)}` : "."}`);
  }
  const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter n’a retourné aucun article.");
  const article = JSON.parse(cleanJson(content)) as GeneratedArticle;
  if (!article.title?.trim() || !article.excerpt?.trim() || !Array.isArray(article.blocks) || article.blocks.length < 3) throw new Error("Le brouillon généré est incomplet.");
  return article;
}

async function generateArticleVisual(article: GeneratedArticle, sourceLabel: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_IMAGE_MODEL ?? "bytedance-seed/seedream-4.5",
      prompt: `Photographie éditoriale réaliste et naturelle pour un article de paysagiste français. Sujet : ${article.heroImageAlt}. Inspiration du tutoriel : ${sourceLabel}. Montrer le geste, les végétaux et les outils de façon crédible, lumière naturelle, composition horizontale, sans texte, sans logo, sans filigrane. Ne pas reproduire une image existante ni le visage d’une personne réelle.`,
      aspect_ratio: "16:9",
      output_format: "webp",
    }),
  });
  if (!response.ok) return null;
  const result = await response.json() as { data?: Array<{ b64_json?: string; media_type?: string }> };
  const image = result.data?.find((item) => item.b64_json);
  if (!image?.b64_json) return null;
  return { bytes: Buffer.from(image.b64_json, "base64"), mediaType: image.media_type ?? "image/webp" };
}

function addArticleToPages(pages: SitePage[], article: GeneratedArticle, heroImageUrl: string) {
  const nextPages = structuredClone(pages);
  const baseSlug = slugify(article.slug || article.title);
  const existingSlugs = new Set(nextPages.map((page) => page.slug));
  let slug = baseSlug;
  let suffix = 2;
  while (existingSlugs.has(`/blog/${slug}`)) slug = `${baseSlug}-${suffix++}`;
  const href = `/blog/${slug}`;
  const sourceTemplate = nextPages.find((page) => page.sections.some((section) => section.type === "article-detail")) ?? structuredClone(demoArticlePage);
  const page = structuredClone(sourceTemplate);
  page.id = `article-${slug}`;
  page.slug = href;
  page.title = `Article - ${article.title.trim()}`;
  const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());
  const detail = page.sections.find((section) => section.type === "article-detail");
  if (!detail || detail.type !== "article-detail") throw new Error("Le modèle d’article est introuvable dans ce projet.");
  const previous = detail.fields as ArticleDetailFields;
  const blocks: ArticleBlock[] = article.blocks.map((block) => block.kind === "heading"
    ? { kind: "heading", level: block.level === "h3" ? "h3" : "h2", text: block.text.trim() }
    : { kind: "paragraph", text: block.text.trim() });
  detail.fields = { ...previous, title: article.title.trim(), subtitle: article.excerpt.trim(), heroImageUrl: heroImageUrl || previous.heroImageUrl, heroImageAlt: article.heroImageAlt?.trim() || article.title.trim(), readingTime: article.readingTime?.trim() || "6 minutes", updatedAt: date, blocks };
  nextPages.push(page);
  const post: BlogPost = { title: article.title.trim(), excerpt: article.excerpt.trim(), category: article.category?.trim() || "Conseils", imageUrl: heroImageUrl || previous.heroImageUrl, href, date };
  for (const currentPage of nextPages) {
    currentPage.sections = currentPage.sections.map((section) => {
      if (section.type !== "blog-index" && section.type !== "blog-advice") return section;
      if (section.fields.posts.some((item) => item.href === href)) return section;
      return { ...section, fields: { ...section.fields, posts: [post, ...section.fields.posts] } } as typeof section;
    });
  }
  return { pages: nextPages, slug, href };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const payload = await request.json() as { agentId?: unknown; topic?: unknown; source?: unknown; projectKey?: unknown; projectOwnerId?: unknown };
  if (!isAgentId(payload.agentId) || typeof payload.topic !== "string" || !payload.topic.trim()) return NextResponse.json({ error: "Agent ou sujet invalide." }, { status: 400 });
  const projectKey = normalizeProjectKey(payload.projectKey);
  const projectOwnerId = typeof payload.projectOwnerId === "string" ? payload.projectOwnerId : userId;
  if (projectOwnerId !== userId) {
    const { data: membership } = await supabase.from("project_members").select("user_id").eq("owner_id", projectOwnerId).eq("project_key", projectKey).eq("user_id", userId).maybeSingle();
    if (!membership) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const { data: projectRow } = await supabase.from("site_projects").select("project_name, pages").eq("owner_id", projectOwnerId).eq("project_key", projectKey).maybeSingle();
  const projectName = projectRow?.project_name ?? "Projet paysagiste";
  const pages = Array.isArray(projectRow?.pages) ? projectRow.pages as SitePage[] : structuredClone(demoSitePages);
  const { data: assetRows } = await supabase.from("project_assets").select("public_url").eq("owner_id", projectOwnerId).eq("project_key", projectKey).order("created_at", { ascending: false }).limit(12);
  const assets = (assetRows ?? []) as Array<{ public_url: string }>;
  let heroImageUrl = assets.length ? assets[Math.floor(Math.random() * assets.length)].public_url : "";
  const source = typeof payload.source === "string" && payload.source.trim() ? payload.source.trim() : undefined;
  const youtubeSource = payload.agentId === "youtube" && !source ? await findPopularYoutubeVideo(payload.topic.trim()) : null;

  try {
    const article = await generateArticle(payload.agentId, payload.topic.trim(), source, youtubeSource);
    let visualWarning = "";
    if (payload.agentId === "youtube") {
      let generatedVisualUsed = false;
      const visual = await generateArticleVisual(article, youtubeSource?.title ?? source?.slice(0, 180) ?? payload.topic.trim());
      if (visual) {
        const extension = visual.mediaType.includes("png") ? "png" : visual.mediaType.includes("jpeg") ? "jpg" : "webp";
        const storagePath = `${projectOwnerId}/${projectKey}/ai-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("project-assets").upload(storagePath, visual.bytes, { contentType: visual.mediaType, upsert: false });
        if (!uploadError) {
          const { data: publicData } = supabase.storage.from("project-assets").getPublicUrl(storagePath);
          const { error: assetError } = await supabase.from("project_assets").insert({ owner_id: projectOwnerId, project_key: projectKey, storage_path: storagePath, public_url: publicData.publicUrl, original_name: `visuel-${slugify(article.title)}.${extension}`, title: article.title.slice(0, 70), alt_text: article.heroImageAlt.slice(0, 240), ai_generated: true, created_by: userId });
          if (!assetError) { heroImageUrl = publicData.publicUrl; generatedVisualUsed = true; }
          else await supabase.storage.from("project-assets").remove([storagePath]);
        }
      }
      if (!generatedVisualUsed) visualWarning = " Le visuel IA n’a pas pu être généré ; une image Assets a été conservée lorsqu’elle était disponible.";
    }
    const updated = addArticleToPages(pages, article, heroImageUrl);
    const values = { project_name: projectName, pages: updated.pages, updated_at: new Date().toISOString() };
    const { error } = projectOwnerId === userId
      ? await supabase.from("site_projects").upsert({ owner_id: userId, project_key: projectKey, ...values }, { onConflict: "owner_id,project_key" })
      : await supabase.from("site_projects").update(values).eq("owner_id", projectOwnerId).eq("project_key", projectKey);
    if (error) throw new Error(error.message);
    await supabase.from("project_activity_events").insert({ owner_id: projectOwnerId, project_key: projectKey, actor_user_id: userId, event_type: "article_created", entity_id: `article-${updated.slug}`, entity_title: article.title, metadata: { slug: updated.href, agent: payload.agentId } });
    const sourceUrl = source?.startsWith("http") ? source.split(/\s/)[0] : youtubeSource?.url ?? null;
    const warning = (payload.agentId === "youtube" && !source && !youtubeSource
      ? "Brouillon créé grâce à la recherche web. Ajoutez YOUTUBE_API_KEY pour sélectionner automatiquement les tutoriels selon leur popularité, ou collez une transcription pour une adaptation précise."
      : "Le brouillon a été ajouté au CMS Articles. Vérifiez-le avant publication.") + visualWarning;
    return NextResponse.json({ draft: { title: article.title, slug: updated.slug, sourceUrl, agentName: agentNames[payload.agentId] }, warning }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Génération impossible." }, { status: 500 });
  }
}
