import { NextResponse } from "next/server";
import { demoArticlePage, demoSitePages } from "@/lib/demo-site";
import {
  researchTopic,
  generateArticleQuiz,
  structureArticle,
  writeArticle,
  type ArticleOutline,
  type EditorialExecutionMode,
  type EditorialMode,
  type GeneratedArticle,
  type GeneratedQuizPlan,
  type ResolvedArticleImage,
  type ResearchBrief,
} from "@/lib/editorial-pipeline";
import { assembleArticleBlocks, getHeroImage } from "@/lib/article-assembly";
import { generateArticleImage } from "@/lib/article-image-generation";
import { normalizeProjectKey } from "@/lib/project-key";
import { buildEditorialPerformanceSnapshot } from "@/lib/editorial-performance";
import { createClient } from "@/lib/supabase/server";
import type {
  ArticleDetailFields,
  BlogPost,
  SitePage,
} from "@/lib/site-template";
import { synchronizeArticleCollections } from "@/lib/article-content";

export const runtime = "nodejs";
export const maxDuration = 300;

type PipelinePhase = "research" | "outline" | "images" | "write";

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
  return (
    value === "research" ||
    value === "outline" ||
    value === "images" ||
    value === "write"
  );
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

function addArticleToPages(
  pages: SitePage[],
  article: GeneratedArticle,
  images: ResolvedArticleImage[],
  workflow: {
    mode: EditorialMode;
    executionMode: EditorialExecutionMode;
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
    executionMode: workflow.executionMode,
    category: article.category?.trim() || "Conseils",
    createdAt: now,
    updatedAt: now,
    research: workflow.research,
    outline: workflow.outline,
    article,
    images,
    quiz: workflow.quizPlan?.quiz,
    quizPlacementAfterSectionId: workflow.quizPlan?.placementAfterSectionId,
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
  const blocks = assembleArticleBlocks({
    outline: workflow.outline,
    article,
    images,
    quizPlan: workflow.quizPlan,
  });
  const heroImageUrl = getHeroImage(images)?.url ?? previous.heroImageUrl;
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
  return { pages: synchronizeArticleCollections(nextPages), slug, href };
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
    executionMode?: unknown;
    topic?: unknown;
    source?: unknown;
    discoverTopic?: unknown;
    projectKey?: unknown;
    projectOwnerId?: unknown;
    research?: unknown;
    outline?: unknown;
    images?: unknown;
    quizPlan?: unknown;
  };
  if (
    !isPipelinePhase(payload.phase) ||
    !isEditorialMode(payload.mode) ||
    (payload.executionMode !== "test" && payload.executionMode !== "classic") ||
    typeof payload.topic !== "string" ||
    !payload.topic.trim()
  ) {
    return NextResponse.json(
      { error: "Phase, mode ou sujet invalide." },
      { status: 400 },
    );
  }

  const projectKey = normalizeProjectKey(payload.projectKey);
  const executionMode = payload.executionMode;
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
        executionMode,
        topic,
        projectName,
        source,
        discoverTopic: payload.discoverTopic === true,
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
      const outline = await structureArticle({
        topic: research.topic || topic,
        research,
        executionMode,
      });
      return NextResponse.json({ phase: "outline", outline });
    }

    const outline = payload.outline as ArticleOutline | undefined;
    if (!outline?.title || !Array.isArray(outline.sections)) {
      return NextResponse.json(
        { error: "Le plan éditorial est manquant." },
        { status: 400 },
      );
    }

    if (payload.phase === "images") {
      const { data: assetRows } = await supabase
        .from("project_assets")
        .select("public_url")
        .eq("owner_id", projectOwnerId)
        .eq("project_key", projectKey)
        .order("created_at", { ascending: false })
        .limit(12);
      const fallbackAssets = (assetRows ?? []) as Array<{ public_url: string }>;
      const demoDetail = demoArticlePage.sections.find(
        (section) => section.type === "article-detail",
      );
      const fallbackHero =
        demoDetail?.type === "article-detail"
          ? demoDetail.fields.heroImageUrl
          : "";
      const allowImageGeneration = executionMode === "classic";
      const images: ResolvedArticleImage[] = [];

      for (const imageRequest of outline.imageRequests) {
        let url = fallbackAssets.length
          ? fallbackAssets[Math.floor(Math.random() * fallbackAssets.length)]
              .public_url
          : fallbackHero;
        let generated = false;
        const visual = allowImageGeneration
          ? await generateArticleImage(imageRequest, {
              articleTitle: outline.title,
              projectName,
            })
          : null;
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
                original_name: `${imageRequest.id}.${extension}`,
                title: imageRequest.purpose.slice(0, 70),
                alt_text: imageRequest.alt.slice(0, 240),
                ai_generated: true,
                created_by: userId,
              });
            if (!assetError) {
              url = publicData.publicUrl;
              generated = true;
            } else {
              await supabase.storage
                .from("project-assets")
                .remove([storagePath]);
            }
          }
        }
        images.push({ ...imageRequest, url, generated });
      }

      let quizPlan: GeneratedQuizPlan | undefined;
      let quizWarning = "";
      if (outline.quizRequest.enabled) {
        try {
          quizPlan = await generateArticleQuiz({
            topic,
            projectName,
            outline,
            executionMode,
          });
        } catch {
          quizWarning =
            "Le quiz facultatif n’a pas pu être généré. L’article peut continuer sans lui.";
        }
      }
      return NextResponse.json({
        phase: "images",
        images,
        quizPlan,
        warning:
          quizWarning ||
          (allowImageGeneration
            ? undefined
            : "Mode économique : les visuels existants du projet sont utilisés. La génération d’images reste désactivée pendant les tests."),
      });
    }

    const images = payload.images as ResolvedArticleImage[] | undefined;
    if (
      !Array.isArray(images) ||
      !images.some((image) => image.kind === "hero" && image.url)
    ) {
      return NextResponse.json(
        { error: "L’image principale obligatoire est manquante." },
        { status: 400 },
      );
    }
    const quizPlan = payload.quizPlan as GeneratedQuizPlan | undefined;
    const article = await writeArticle({
      topic,
      outline,
      images,
      quizPlan,
      executionMode,
    });
    const pages = projectPages;

    const updated = addArticleToPages(pages, article, images, {
      mode: payload.mode,
      executionMode,
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

    await supabase.from("project_activity_events").insert({
      owner_id: projectOwnerId,
      project_key: projectKey,
      actor_user_id: userId,
      event_type: "article_created",
      entity_id: `article-${updated.slug}`,
      entity_title: article.title,
      metadata: {
        slug: updated.href,
        mode: payload.mode,
        executionMode,
        pipeline: [
          "research",
          "outline",
          "images",
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
        warning:
          "Les phases de production sont terminées. Le brouillon a été ajouté au CMS Articles et reste non publié.",
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
