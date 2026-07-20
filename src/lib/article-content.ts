import type {
  ArticleDetailFields,
  BlogPost,
  SitePage,
} from "@/lib/site-template";

export function getArticleDetail(page: SitePage) {
  const section = page.sections.find(
    (candidate) => candidate.type === "article-detail",
  );
  return section?.type === "article-detail" ? section : null;
}

export function formatArticleDate(value: string | Date = new Date()) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function touchArticlePage(page: SitePage, now = new Date()) {
  const next = structuredClone(page);
  const detail = getArticleDetail(next);
  const iso = now.toISOString();
  if (detail) detail.fields.updatedAt = formatArticleDate(now);
  next.editorial = {
    status: next.editorial?.status ?? "pending",
    mode: next.editorial?.mode ?? "editorial",
    category: next.editorial?.category ?? "Conseils",
    createdAt: next.editorial?.createdAt ?? iso,
    updatedAt: iso,
    research: next.editorial?.research,
    outline: next.editorial?.outline,
    article: next.editorial?.article,
    images: next.editorial?.images,
    quiz: next.editorial?.quiz,
    quizPlacementAfterSectionId: next.editorial?.quizPlacementAfterSectionId,
  };
  return next;
}

function toBlogPost(page: SitePage): BlogPost | null {
  const detail = getArticleDetail(page);
  if (!detail) return null;
  const fields = detail.fields as ArticleDetailFields;
  return {
    title: fields.title,
    excerpt: fields.subtitle,
    category: page.editorial?.category ?? "Conseils",
    imageUrl: fields.heroImageUrl,
    href: page.slug,
    date: fields.updatedAt,
  };
}

export function synchronizeArticleCollections(sourcePages: SitePage[]) {
  const pages = structuredClone(sourcePages);
  const articles = pages
    .filter((page) => page.slug.startsWith("/blog/") && getArticleDetail(page))
    .sort((left, right) =>
      (
        right.editorial?.updatedAt ??
        right.editorial?.createdAt ??
        ""
      ).localeCompare(
        left.editorial?.updatedAt ?? left.editorial?.createdAt ?? "",
      ),
    );
  const posts = articles.map(toBlogPost).filter(Boolean) as BlogPost[];

  for (const page of pages) {
    page.sections = page.sections.map((section) => {
      if (section.type === "blog-index") {
        return { ...section, fields: { ...section.fields, posts } };
      }
      if (section.type === "blog-advice") {
        return {
          ...section,
          fields: { ...section.fields, posts: posts.slice(0, 4) },
        };
      }
      if (section.type !== "article-detail") return section;

      const currentCategory = page.editorial?.category ?? "Conseils";
      const relatedPosts = posts
        .filter((post) => post.href !== page.slug)
        .sort((left, right) => {
          const leftMatch = left.category === currentCategory ? 1 : 0;
          const rightMatch = right.category === currentCategory ? 1 : 0;
          return rightMatch - leftMatch;
        })
        .slice(0, 4);
      return {
        ...section,
        fields: {
          ...section.fields,
          relatedTitle: section.fields.relatedTitle || "Nos derniers articles",
          relatedPosts,
        },
      };
    });
  }

  return pages;
}
