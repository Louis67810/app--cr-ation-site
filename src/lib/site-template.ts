export type Cta = {
  label: string;
  href: string;
};

export type NavigationItem = {
  label: string;
  href: string;
};

export type SiteHeaderGlassFields = {
  logoLabel: string;
  navigation: NavigationItem[];
  cta: Cta;
};

export type HeroFullImageFields = {
  backgroundImageUrl: string;
  title: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  reviewRatingLabel: string;
  reviewScore: string;
  reviewCount: string;
  reviewCta: Cta;
};

export type SocialProofBandFields = {
  stats: Array<{
    value: string;
    label: string;
  }>;
};

export type ServicesCardsFields = {
  title: string;
  cta: Cta;
  services: Array<{
    title: string;
    description: string;
    imageUrl: string;
    href: string;
  }>;
};

export type SectionInstance =
  | {
      id: string;
      type: "site-header";
      variant: "glass-a";
      fields: SiteHeaderGlassFields;
    }
  | {
      id: string;
      type: "hero";
      variant: "full-image-a";
      fields: HeroFullImageFields;
    }
  | {
      id: string;
      type: "social-proof";
      variant: "band-a";
      fields: SocialProofBandFields;
    }
  | {
      id: string;
      type: "services";
      variant: "cards-a";
      fields: ServicesCardsFields;
    };

export type SitePage = {
  id: string;
  slug: string;
  title: string;
  sections: SectionInstance[];
};
