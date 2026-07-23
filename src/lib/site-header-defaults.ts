import type { SitePage } from "@/lib/site-template";
import { normalizeSiteBrand } from "@/lib/site-brand";

const primaryNavigation = [
  { label: "Prestations", href: "/prestations" },
  { label: "Réalisations", href: "/realisations" },
  { label: "À propos", href: "/a-propos" },
  { label: "Ressources", href: "/blog" },
];

export function ensureSiteHeaderDefaults(sourcePages: SitePage[]) {
  return sourcePages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => {
      if (section.type !== "site-header") return section;
      const legacyNavigation = section.fields.navigation.some(
        (item) => item.href === "/" || item.label.toLowerCase() === "blog",
      );
      return {
        ...section,
        fields: {
          ...section.fields,
          navigation: legacyNavigation
            ? primaryNavigation.map((item) => ({ ...item }))
            : section.fields.navigation,
          phone: section.fields.phone?.trim() || "06 00 00 00 00",
          phoneLabel: section.fields.phoneLabel?.trim() || "Appeler",
          brand: normalizeSiteBrand(section.fields.brand),
        },
      };
    }),
  }));
}
