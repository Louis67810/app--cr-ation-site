export type Cta = {
  label: string;
  href: string;
};

export type ReviewProof = {
  ratingLabel: string;
  reviewCount: string;
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
  socialProof?: ReviewProof;
  services: Array<{
    title: string;
    description: string;
    imageUrl: string;
    href: string;
  }>;
};

export type RecentProjectsFields = {
  title: string;
  subtitle: string;
  cta: Cta;
  socialProof: ReviewProof;
  cities: string[];
  projects: Array<{
    city: string;
    imageUrl: string;
    alt: string;
    compareEnabled: string;
    beforeImageUrl: string;
    afterImageUrl: string;
  }>;
};

export type WorkMethodFields = {
  title: string;
  subtitle: string;
  cta: Cta;
  socialProof: ReviewProof;
  steps: Array<{
    title: string;
    description: string;
    imageUrl: string;
  }>;
};

export type ServiceAreasFields = {
  title: string;
  subtitle: string;
  cta: Cta;
  socialProof: ReviewProof;
  areas: Array<{
    name: string;
    href: string;
    imageUrl: string;
  }>;
};

export type TestimonialsFields = {
  title: string;
  socialProof: ReviewProof;
  images: string[];
  reviews: Array<{
    author: string;
    avatarUrl: string;
    text: string;
  }>;
};

export type BlogAdviceFields = {
  title: string;
  cta: Cta;
  posts: Array<{
    title: string;
    excerpt: string;
    category: string;
    imageUrl: string;
    href: string;
  }>;
};

export type FaqFields = {
  title: string;
  cta: Cta;
  socialProof: ReviewProof;
  items: Array<{
    question: string;
    answer: string;
  }>;
};

export type FooterFields = {
  title: string;
  subtitle: string;
  cta: Cta;
  backgroundImageUrl: string;
  logoLabel: string;
  copyright: string;
  addressLabel: string;
  address: string;
  contactLabel: string;
  phone: string;
  email: string;
  credit: string;
  socialLinks: Array<{
    label: string;
    href: string;
  }>;
  linkGroups: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
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
    }
  | {
      id: string;
      type: "services-centered";
      variant: "cards-centered-a";
      fields: ServicesCardsFields;
    }
  | {
      id: string;
      type: "recent-projects";
      variant: "city-filter-a";
      fields: RecentProjectsFields;
    }
  | {
      id: string;
      type: "work-method";
      variant: "alternating-a";
      fields: WorkMethodFields;
    }
  | {
      id: string;
      type: "service-areas";
      variant: "image-list-a";
      fields: ServiceAreasFields;
    }
  | {
      id: string;
      type: "testimonials";
      variant: "gallery-a";
      fields: TestimonialsFields;
    }
  | {
      id: string;
      type: "blog-advice";
      variant: "posts-a";
      fields: BlogAdviceFields;
    }
  | {
      id: string;
      type: "faq";
      variant: "accordion-a";
      fields: FaqFields;
    }
  | {
      id: string;
      type: "site-footer";
      variant: "landscaper-a";
      fields: FooterFields;
    };

export type SitePage = {
  id: string;
  slug: string;
  title: string;
  sections: SectionInstance[];
};
