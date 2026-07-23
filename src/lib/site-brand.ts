import type { CSSProperties } from "react";
import type { SiteBrandSettings, SitePage } from "@/lib/site-template";

export const DEFAULT_SITE_BRAND: SiteBrandSettings = {
  primaryColor: "#003441",
  accentColor: "#00CE90",
  ctaVariant: "pill",
  headingFont: "new-york",
  email: "",
  phone: "06 00 00 00 00",
  address: "",
  googleReviewsUrl: "",
  contactMode: "form",
};

export function normalizeSiteBrand(value?: Partial<SiteBrandSettings>): SiteBrandSettings {
  return {
    ...DEFAULT_SITE_BRAND,
    ...value,
    primaryColor: /^#[0-9a-f]{6}$/i.test(value?.primaryColor ?? "") ? value?.primaryColor ?? DEFAULT_SITE_BRAND.primaryColor : DEFAULT_SITE_BRAND.primaryColor,
    accentColor: /^#[0-9a-f]{6}$/i.test(value?.accentColor ?? "") ? value?.accentColor ?? DEFAULT_SITE_BRAND.accentColor : DEFAULT_SITE_BRAND.accentColor,
    ctaVariant: value?.ctaVariant === "rounded" ? "rounded" : "pill",
    headingFont: value?.headingFont === "jakarta" ? "jakarta" : "new-york",
    contactMode: value?.contactMode === "qualifier" ? "qualifier" : "form",
  };
}

export function getSiteBrand(pages: SitePage[]) {
  const header = pages.flatMap((page) => page.sections).find((section) => section.type === "site-header");
  return normalizeSiteBrand(header?.type === "site-header" ? header.fields.brand : undefined);
}

export function applySiteBrand(pages: SitePage[], brandInput: SiteBrandSettings) {
  const brand = normalizeSiteBrand(brandInput);
  return pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => {
      if (section.type === "site-header") return {
        ...section,
        fields: {
          ...section.fields,
          brand,
          phone: brand.phone || section.fields.phone,
          logoImageUrl: brand.logoOnLightUrl || section.fields.logoImageUrl,
        },
      };
      if (section.type === "site-footer") return {
        ...section,
        fields: {
          ...section.fields,
          phone: brand.phone || section.fields.phone,
          email: brand.email || section.fields.email,
          address: brand.address || section.fields.address,
        },
      };
      return section;
    }),
  }));
}

export function siteBrandStyle(brandInput: SiteBrandSettings): CSSProperties {
  const brand = normalizeSiteBrand(brandInput);
  return {
    "--site-primary": brand.primaryColor,
    "--site-accent": brand.accentColor,
    "--site-cta-radius": brand.ctaVariant === "rounded" ? "18px" : "54px",
    "--site-heading-font": brand.headingFont === "jakarta" ? "var(--font-inter), Inter, Arial, sans-serif" : "var(--font-new-york), Georgia, serif",
  } as CSSProperties;
}
