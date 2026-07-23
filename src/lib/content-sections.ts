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

export function isCmsOwnedSection(type: SectionInstance["type"]) {
  return Boolean(CMS_SECTION_OWNERS[type]);
}

export function isGlobalEditableSection(type: SectionInstance["type"]) {
  return type !== "site-header" && type !== "site-footer" && !isCmsOwnedSection(type);
}
