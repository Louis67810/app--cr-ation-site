import type { SectionInstance } from "@/lib/site-template";

export const CMS_SECTION_OWNERS: Partial<Record<SectionInstance["type"], string>> = {
  "recent-projects": "realisations",
  "realisations-page": "realisations",
  "realisation-detail": "realisations",
  "service-areas": "zones",
  "blog-advice": "articles",
  "blog-index": "articles",
  "article-detail": "articles",
  services: "prestations",
  "services-centered": "prestations",
  "services-hub-hero": "prestations",
  "services-hub-bento": "prestations",
  "sector-hero": "secteurs",
  "sector-services": "secteurs",
  "sector-benefits": "secteurs",
  "sector-extra-services": "secteurs",
};

export const SECTION_LABELS: Record<SectionInstance["type"], string> = {
  "site-header": "Navigation",
  hero: "Hero principal",
  "social-proof": "Chiffres clés",
  services: "Prestations",
  "services-centered": "Prestations",
  "recent-projects": "Réalisations récentes",
  "work-method": "Méthode de travail",
  "service-areas": "Zones d’intervention",
  testimonials: "Avis clients",
  "blog-advice": "Conseils et articles",
  "blog-index": "Liste des articles",
  "article-detail": "Contenu d’article",
  "sector-hero": "Hero secteur",
  "sector-services": "Prestations par secteur",
  "sector-benefits": "Avantages par secteur",
  "lead-qualifier": "Questionnaire de qualification",
  "sector-extra-services": "Services complémentaires",
  "about-hero": "Hero À propos",
  "about-story": "Histoire de l’entreprise",
  "services-hub-hero": "Introduction des prestations",
  "services-hub-bento": "Catalogue des prestations",
  "realisations-page": "Liste des réalisations",
  "realisation-detail": "Fiche réalisation",
  "contact-section": "Contact",
  faq: "Questions fréquentes",
  "site-footer": "Pied de page",
};

const FIELD_LABELS: Record<string, string> = {
  title: "Titre",
  subtitle: "Sous-titre",
  description: "Description",
  text: "Texte",
  label: "Libellé",
  value: "Valeur",
  question: "Question",
  answer: "Réponse",
  icon: "Icône",
  imageUrl: "Image",
  backgroundImageUrl: "Image d’arrière-plan",
  heroImageUrl: "Image principale",
  heroImageAlt: "Texte alternatif de l’image principale",
  imageAlt: "Texte alternatif",
  alt: "Texte alternatif",
  author: "Auteur",
  authorName: "Nom de l’auteur",
  authorRole: "Rôle de l’auteur",
  city: "Ville",
  category: "Catégorie",
  readingTime: "Temps de lecture",
  updatedLabel: "Libellé de mise à jour",
  updatedAt: "Date de mise à jour",
  tocTitle: "Titre du sommaire",
  listTitle: "Titre de la liste",
  relatedTitle: "Titre des contenus associés",
  formTitle: "Titre du formulaire",
  submitLabel: "Texte du bouton d’envoi",
  searchPlaceholder: "Texte de recherche",
  loadMoreLabel: "Texte pour afficher la suite",
  beforeAfterTitle: "Titre avant / après",
  services: "Prestations",
  cards: "Cartes",
  items: "Éléments",
  steps: "Étapes",
  stats: "Chiffres clés",
  highlights: "Points forts",
  fields: "Champs",
  tickerImages: "Images du bandeau",
  beforeAfterSlides: "Comparaisons avant / après",
  blocks: "Contenu",
};

const SYSTEM_FIELD_NAMES = new Set([
  "href",
  "serviceId",
  "cta",
  "primaryCta",
  "secondaryCta",
  "reviewCta",
  "sidebarCta",
  "socialProof",
  "reviewRatingLabel",
  "reviewScore",
  "reviewCount",
  "ratingLabel",
  "breadcrumbs",
  "navigation",
  "serviceLinks",
  "linkGroups",
  "socialLinks",
  "cardCtaLabel",
  "relatedCardCtaLabel",
  "relatedFilters",
  "relatedProjects",
  "relatedPosts",
  "phone",
  "email",
  "address",
  "brand",
  "logoLabel",
  "logoImageUrl",
  "copyright",
  "credit",
]);

export function sectionLabel(
  type: SectionInstance["type"],
  collectionId?: string,
) {
  if (type === "sector-services" && collectionId === "prestations") {
    return "Bénéfices de la prestation";
  }
  if (type === "sector-services" && collectionId === "secteurs") {
    return "Solutions pour ce secteur";
  }
  return SECTION_LABELS[type];
}

export function fieldLabel(key: string) {
  return (
    FIELD_LABELS[key] ??
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/[-_]/g, " ")
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

export function isSystemManagedField(path: Array<string | number>) {
  return path.some(
    (part) => typeof part === "string" && SYSTEM_FIELD_NAMES.has(part),
  );
}

export function isCmsOwnedSection(type: SectionInstance["type"]) {
  return Boolean(CMS_SECTION_OWNERS[type]);
}

export function isGlobalEditableSection(type: SectionInstance["type"]) {
  return type !== "site-header" && type !== "site-footer" && !isCmsOwnedSection(type);
}

const DERIVED_COLLECTION_FIELDS: Partial<
  Record<SectionInstance["type"], ReadonlySet<string>>
> = {
  services: new Set(["services"]),
  "services-hub-hero": new Set(["services"]),
  "services-hub-bento": new Set(["services"]),
  "recent-projects": new Set(["cities", "projects"]),
  "realisations-page": new Set(["heroImages", "filters", "projects"]),
  "realisation-detail": new Set(["relatedFilters", "relatedProjects"]),
  "service-areas": new Set(["areas"]),
  testimonials: new Set(["images", "reviews", "socialProof"]),
  "blog-advice": new Set(["posts"]),
  "blog-index": new Set(["posts"]),
  "sector-extra-services": new Set(["services"]),
};

export function isDerivedCollectionField(
  type: SectionInstance["type"],
  path: Array<string | number>,
) {
  const root = String(path[0] ?? "");
  return DERIVED_COLLECTION_FIELDS[type]?.has(root) ?? false;
}

export function isDerivedCollectionSection(type: SectionInstance["type"]) {
  return (
    type === "services" ||
    type === "recent-projects" ||
    type === "realisations-page" ||
    type === "service-areas"
  );
}
