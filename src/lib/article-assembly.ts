import type {
  ArticleOutline,
  GeneratedArticle,
  GeneratedQuizPlan,
  ResolvedArticleImage,
} from "@/lib/editorial-pipeline";
import type { ArticleBlock } from "@/lib/site-template";

export function assembleArticleBlocks(input: {
  outline: ArticleOutline;
  article: GeneratedArticle;
  images: ResolvedArticleImage[];
  quizPlan?: GeneratedQuizPlan;
}) {
  const contentBySection = new Map(
    input.article.sections.map((section) => [section.sectionId, section]),
  );
  const blocks: ArticleBlock[] = [];

  for (const section of input.outline.sections) {
    const content = contentBySection.get(section.id);
    if (!content) continue;

    blocks.push({
      id: `heading-${section.id}`,
      kind: "heading",
      level: section.level,
      text: section.title.trim(),
    });
    content.paragraphs
      .filter((paragraph) => paragraph.trim())
      .forEach((paragraph, index) => {
        blocks.push({
          id: `paragraph-${section.id}-${index + 1}`,
          kind: "paragraph",
          text: paragraph.trim(),
          size: "medium",
        });
      });

    if (
      section.format === "table" &&
      content.tableColumns.length > 0 &&
      content.tableRows.length > 0
    ) {
      blocks.push({
        id: `table-${section.id}`,
        kind: "table",
        title: content.tableTitle.trim() || section.title,
        columns: content.tableColumns,
        rows: content.tableRows,
        variant:
          section.componentVariant === "comparison"
            ? "comparison"
            : "default",
      });
    }
    if (section.format === "cards" && content.cards.length > 0) {
      blocks.push({
        id: `cards-${section.id}`,
        kind: "cards",
        title: content.cardsTitle.trim(),
        columns: Math.min(4, Math.max(1, content.cards.length)) as
          1 | 2 | 3 | 4,
        cards: content.cards,
        variant:
          section.componentVariant === "yellow" ||
          section.componentVariant === "outlined"
            ? section.componentVariant
            : "default",
      });
    }
    if (section.format === "callout" && content.calloutText.trim()) {
      blocks.push({
        id: `callout-${section.id}`,
        kind: "callout",
        title: content.calloutTitle.trim(),
        text: content.calloutText.trim(),
        variant:
          section.componentVariant === "quote" ||
          section.componentVariant === "solution"
            ? section.componentVariant
            : "highlight",
        icon: "lightbulb",
      });
    }

    input.images
      .filter(
        (image) =>
          image.kind === "inline" && image.afterSectionId === section.id,
      )
      .forEach((image) => {
        blocks.push({
          id: image.id,
          kind: "image",
          imageUrl: image.url,
          alt: image.alt,
          caption: image.caption,
          size: "full",
          alignment: "center",
        });
      });

    if (
      input.quizPlan &&
      input.quizPlan.placementAfterSectionId === section.id
    ) {
      blocks.push({
        id: `quiz-${input.quizPlan.quiz.id}`,
        kind: "quiz",
        quizId: input.quizPlan.quiz.id,
      });
    }
  }

  return blocks;
}

export function getHeroImage(images: ResolvedArticleImage[]) {
  return images.find((image) => image.kind === "hero");
}
