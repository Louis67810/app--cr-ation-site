export const ARTICLE_CATEGORIES = [
  "Conseils",
  "Entretien",
  "Aménagement",
  "Végétaux",
  "Inspiration",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const ARTICLE_CATEGORY_STYLES: Record<
  ArticleCategory,
  { background: string; color: string }
> = {
  Conseils: { background: "#e9f3f8", color: "#24586b" },
  Entretien: { background: "#edf5e8", color: "#3d6838" },
  Aménagement: { background: "#f8eee7", color: "#805037" },
  Végétaux: { background: "#e7f3ec", color: "#286248" },
  Inspiration: { background: "#f2ecf8", color: "#684d7e" },
};

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return ARTICLE_CATEGORIES.includes(value as ArticleCategory);
}

export function normalizeArticleCategory(
  value: unknown,
  context = "",
): ArticleCategory {
  if (isArticleCategory(value)) return value;

  const text = `${String(value ?? "")} ${context}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/entretien|taill|tonte|arros|nettoy|saison|hiver|maladie|nuisible/.test(text))
    return "Entretien";
  if (/amenag|terrasse|allee|cloture|piscine|pergola|cour|chantier|eclairage/.test(text))
    return "Aménagement";
  if (/veget|plant|arbre|arbuste|fleur|haie|gazon|pelouse|potager/.test(text))
    return "Végétaux";
  if (/inspir|tendance|style|idee|design|avant.apres|exemple/.test(text))
    return "Inspiration";
  return "Conseils";
}
