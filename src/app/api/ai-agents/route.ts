import { NextResponse } from "next/server";
import { demoArticlePage, demoSitePages } from "@/lib/demo-site";
import {
  researchTopic,
  generateArticleQuiz,
  structureArticle,
  writeArticle,
  type ArticleOutline,
  type EditorialMode,
  type GeneratedArticle,
  type GeneratedQuizPlan,
  type ResearchBrief,
} from "@/lib/editorial-pipeline";
import { normalizeProjectKey } from "@/lib/project-key";
import { buildEditorialPerformanceSnapshot } from "@/lib/editorial-performance";
import { createClient } from "@/lib/supabase/server";
import type {
  ArticleBlock,
  ArticleDetailFields,
  BlogPost,
  SitePage,
} from "@/lib/site-template";

export const runtime = "nodejs";
export const maxDuration = 300;

type PipelinePhase = "research" | "outline" | "write";

const modeNames: Record<EditorialMode, string> = {
  seo: "Pipeline SEO",
  youtube: "Pipeline YouTube",
  trends: "Pipeline tendances",
  editorial: "Pipeline éditorial",
};

function isEditorialMode(value: unknown): value is EditorialMode {
  return (
    value === "seo" ||
    value === "youtube" ||
    value === "trends" ||
    value === "editorial"
  );
}

function isPipelinePhase(value: unknown): value is PipelinePhase {
  return value === "research" || value === "outline" || value === "write";
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "nouvel-article"
  );
}

async function generateArticleVisual(
  article: GeneratedArticle,
  sourceLabel: string,
) {
  const demoMode = process.env.AI_DEMO_MODE !== "false";
  if (demoMode && process.env.AI_DEMO_IMAGES !== "true") return null;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:
        process.env.OPENROUTER_IMAGE_MODEL ?? "bytedance-seed/seedream-4.5",
      prompt: `Photographie éditoriale réaliste et naturelle pour un article de paysagiste français. Sujet : ${article.heroImageAlt}. Inspiration : ${sourceLabel}. Montrer le geste, les végétaux et les outils de façon crédible, lumière naturelle, composition horizontale, sans texte, logo ni filigrane.`,
      aspect_ratio: "16:9",
      output_format: "webp",
    }),
  });
  if (!response.ok) return null;
  const result = (await response.json()) as {
    data?: Array<{ b64_json?: string; media_type?: string }>;
  };
  const image = result.data?.find((item) => item.b64_json);
  if (!image?.b64_json) return null;
  return {
    bytes: Buffer.from(image.b64_json, "base64"),
    mediaType: image.media_type ?? "image/webp",
  };
}

function addArticleToPages(
  pages: SitePage[],
  article: GeneratedArticle,
  heroImageUrl: string,
  workflow: {
    mode: EditorialMode;
    research: ResearchBrief;
    outline: ArticleOutline;
    quizPlan?: GeneratedQuizPlan;
  },
) {
  const nextPages = structuredClone(pages);
  const baseSlug = slugify(article.slug || article.title);
  const existingSlugs = new Set(nextPages.map((page) => page.slug));
  let slug = baseSlug;
  let suffix = 2;
  while (existingSlugs.has(`/blog/${slug}`)) slug = `${baseSlug}-${suffix++}`;
  const href = `/blog/${slug}`;
  const sourceTemplate =
    nextPages.find((page) =>
      page.sections.some((section) => section.type === "article-detail"),
    ) ?? structuredClone(demoArticlePage);
  const page = structuredClone(sourceTemplate);
  page.id = `article-${slug}`;
  page.slug = href;
  page.title = `Article - ${article.title.trim()}`;
  const now = new Date().toISOString();
  page.editorial = {
    status: "pending",
    mode: workflow.mode,
    category: article.category?.trim() || "Conseils",
    createdAt: now,
    updatedAt: now,
    research: workflow.research,
    outline: workflow.outline,
    article,
    quiz: workflow.quizPlan?.quiz,
    quizPlacementAfterHeading: workflow.quizPlan?.placementAfterHeading,
  };
  const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
    new Date(),
  );
  const detail = page.sections.find(
    (section) => section.type === "article-detail",
  );
  if (!detail || detail.type !== "article-detail")
    throw new Error("Le modèle d’article est introuvable dans ce projet.");
  const previous = detail.fields as ArticleDetailFields;
  const blocks: ArticleBlock[] = article.blocks.map((block) =>
    block.kind === "heading"
      ? {
          kind: "heading",
          level: block.level === "h3" ? "h3" : "h2",
          text: block.text.trim(),
        }
      : { kind: "paragraph", text: block.text.trim() },
  );
  if (workflow.quizPlan) {
    const headingIndex = blocks.findIndex(
      (block) =>
        block.kind === "heading" &&
        block.text.trim().toLocaleLowerCase("fr") ===
          workflow.quizPlan?.placementAfterHeading
            .trim()
            .toLocaleLowerCase("fr"),
    );
    const insertionIndex =
      headingIndex >= 0
        ? Math.min(headingIndex + 2, blocks.length)
        : Math.max(1, Math.floor(blocks.length / 2));
    blocks.splice(insertionIndex, 0, {
      kind: "quiz",
      quizId: workflow.quizPlan.quiz.id,
    });
  }
  const quizzes = workflow.quizPlan
    ? [
        workflow.quizPlan.quiz,
        ...previous.quizzes.filter(
          (quiz) => quiz.id !== workflow.quizPlan?.quiz.id,
        ),
      ]
    : previous.quizzes;
  detail.fields = {
    ...previous,
    title: article.title.trim(),
    subtitle: article.excerpt.trim(),
    heroImageUrl: heroImageUrl || previous.heroImageUrl,
    heroImageAlt: article.heroImageAlt?.trim() || article.title.trim(),
    readingTime: article.readingTime?.trim() || "6 minutes",
    updatedAt: date,
    blocks,
    quizzes,
  };
  nextPages.push(page);
  const post: BlogPost = {
    title: article.title.trim(),
    excerpt: article.excerpt.trim(),
    category: article.category?.trim() || "Conseils",
    imageUrl: heroImageUrl || previous.heroImageUrl,
    href,
    date,
  };
  for (const currentPage of nextPages) {
    currentPage.sections = currentPage.sections.map((section) => {
      if (section.type !== "blog-index" && section.type !== "blog-advice")
        return section;
      if (section.fields.posts.some((item) => item.href === href))
        return section;
      return {
        ...section,
        fields: { ...section.fields, posts: [post, ...section.fields.posts] },
      } as typeof section;
    });
  }
  return { pages: nextPages, slug, href };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId)
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const payload = (await request.json()) as {
    phase?: unknown;
    mode?: unknown;
    topic?: unknown;
    source?: unknown;
    projectKey?: unknown;
    projectOwnerId?: unknown;
    research?: unknown;
    outline?: unknown;
  };
  if (
    !isPipelinePhase(payload.phase) ||
    !isEditorialMode(payload.mode) ||
    typeof payload.topic !== "string" ||
    !payload.topic.trim()
  ) {
    return NextResponse.json(
      { error: "Phase, mode ou sujet invalide." },
      { status: 400 },
    );
  }

  const projectKey = normalizeProjectKey(payload.projectKey);
  const projectOwnerId =
    typeof payload.projectOwnerId === "string"
      ? payload.projectOwnerId
      : userId;
  if (projectOwnerId !== userId) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("owner_id", projectOwnerId)
      .eq("project_key", projectKey)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership)
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { data: projectRow } = await supabase
    .from("site_projects")
    .select("project_name, pages")
    .eq("owner_id", projectOwnerId)
    .eq("project_key", projectKey)
    .maybeSingle();
  const projectName = projectRow?.project_name ?? "Projet paysagiste";
  const projectPages = Array.isArray(projectRow?.pages)
    ? (projectRow.pages as SitePage[])
    : structuredClone(demoSitePages);
  const topic = payload.topic.trim();
  const source =
    typeof payload.source === "string" && payload.source.trim()
      ? payload.source.trim()
      : undefined;

  try {
    if (payload.phase === "research") {
      const [performanceResult, summaryResult, trackingResult] =
        await Promise.all([
          supabase
            .from("project_page_performance")
            .select("*")
            .eq("owner_id", projectOwnerId)
            .eq("project_key", projectKey)
            .order("updated_at", { ascending: false }),
          supabase
            .from("project_analytics_summary")
            .select("*")
            .eq("owner_id", projectOwnerId)
            .eq("project_key", projectKey)
            .maybeSingle(),
          supabase
            .from("project_page_traffic_daily")
            .select(
              "page_path, day, page_views, unique_visitors, total_engagement_seconds, updated_at",
            )
            .eq("owner_id", projectOwnerId)
            .eq("project_key", projectKey),
        ]);
      const performance = buildEditorialPerformanceSnapshot({
        pages: projectPages,
        performanceRows: performanceResult.data,
        trackingRows: trackingResult.data,
        summaryRow: summaryResult.data,
        performanceError:
          performanceResult.error?.message ?? summaryResult.error?.message,
        trackingError: trackingResult.error?.message,
      });
      const research = await researchTopic({
        mode: payload.mode,
        topic,
        projectName,
        source,
        performance,
      });
      return NextResponse.json({ phase: "research", research, performance });
    }

    const research = payload.research as ResearchBrief | undefined;
    if (!research?.summary || !Array.isArray(research.facts)) {
      return NextResponse.json(
        { error: "Le dossier de recherche est manquant." },
        { status: 400 },
      );
    }

    if (payload.phase === "outline") {
      const outline = await structureArticle({ topic, research });
      return NextResponse.json({ phase: "outline", outline });
    }

    const outline = payload.outline as ArticleOutline | undefined;
    if (!outline?.title || !Array.isArray(outline.sections)) {
      return NextResponse.json(
        { error: "Le plan éditorial est manquant." },
        { status: 400 },
      );
    }

    const article = await writeArticle({ topic, research, outline });
    let quizPlan: GeneratedQuizPlan | undefined;
    let quizWarning = "";
    if (payload.mode === "seo" || payload.mode === "editorial") {
      try {
        quizPlan = await generateArticleQuiz({
          topic,
          projectName,
          outline,
          article,
        });
      } catch {
        quizWarning =
          " Le quiz interactif n’a pas pu être généré et devra être relancé avant validation.";
      }
    }
    const pages = projectPages;
    const { data: assetRows } = await supabase
      .from("project_assets")
      .select("public_url")
      .eq("owner_id", projectOwnerId)
      .eq("project_key", projectKey)
      .order("created_at", { ascending: false })
      .limit(12);
    const assets = (assetRows ?? []) as Array<{ public_url: string }>;
    let heroImageUrl = assets.length
      ? assets[Math.floor(Math.random() * assets.length)].public_url
      : "";
    let visualWarning = "";

    if (payload.mode === "youtube") {
      const visual = await generateArticleVisual(
        article,
        source?.slice(0, 180) ?? topic,
      );
      if (visual) {
        const extension = visual.mediaType.includes("png")
          ? "png"
          : visual.mediaType.includes("jpeg")
            ? "jpg"
            : "webp";
        const storagePath = `${projectOwnerId}/${projectKey}/ai-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("project-assets")
          .upload(storagePath, visual.bytes, {
            contentType: visual.mediaType,
            upsert: false,
          });
        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("project-assets")
            .getPublicUrl(storagePath);
          const { error: assetError } = await supabase
            .from("project_assets")
            .insert({
              owner_id: projectOwnerId,
              project_key: projectKey,
              storage_path: storagePath,
              public_url: publicData.publicUrl,
              original_name: `visuel-${slugify(article.title)}.${extension}`,
              title: article.title.slice(0, 70),
              alt_text: article.heroImageAlt.slice(0, 240),
              ai_generated: true,
              created_by: userId,
            });
          if (!assetError) heroImageUrl = publicData.publicUrl;
          else
            await supabase.storage.from("project-assets").remove([storagePath]);
        }
      }
      if (!heroImageUrl)
        visualWarning = " Le visuel IA n’a pas pu être généré.";
    }

    const updated = addArticleToPages(pages, article, heroImageUrl, {
      mode: payload.mode,
      research,
      outline,
      quizPlan,
    });
    const values = {
      project_name: projectName,
      pages: updated.pages,
      updated_at: new Date().toISOString(),
    };
    const { error } =
      projectOwnerId === userId
        ? await supabase
            .from("site_projects")
            .upsert(
              { owner_id: userId, project_key: projectKey, ...values },
              { onConflict: "owner_id,project_key" },
            )
        : await supabase
            .from("site_projects")
            .update(values)
            .eq("owner_id", projectOwnerId)
            .eq("project_key", projectKey);
    if (error) throw new Error(error.message);

    await supabase
      .from("project_activity_events")
      .insert({
        owner_id: projectOwnerId,
        project_key: projectKey,
        actor_user_id: userId,
        event_type: "article_created",
        entity_id: `article-${updated.slug}`,
        entity_title: article.title,
        metadata: {
          slug: updated.href,
          mode: payload.mode,
          pipeline: [
            "research",
            "outline",
            "write",
            ...(quizPlan ? ["quiz"] : []),
          ],
        },
      });
    const sourceUrl = source?.startsWith("http")
      ? source.split(/\s/)[0]
      : (research.facts.find((fact) => fact.sourceUrl.startsWith("http"))
          ?.sourceUrl ?? null);
    return NextResponse.json(
      {
        phase: "write",
        article,
        page: updated.pages.find((page) => page.slug === updated.href),
        draft: {
          title: article.title,
          slug: updated.slug,
          sourceUrl,
          agentName: modeNames[payload.mode],
        },
        warning: `Les phases de production sont terminées. Le brouillon a été ajouté au CMS Articles et reste non publié.${visualWarning}${quizWarning}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Pipeline éditorial interrompu.",
      },
      { status: 500 },
    );
  }
}
