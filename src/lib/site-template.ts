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
  posts: BlogPost[];
};

export type BlogPost = {
  title: string;
  excerpt: string;
  category: string;
  imageUrl: string;
  href: string;
  date: string;
};

export type ArticleBlock = { id?: string } & (
  | {
      kind: "paragraph";
      text: string;
      size?: "small" | "medium" | "large";
    }
  | {
      kind: "heading";
      level: "h2" | "h3";
      text: string;
      alignment?: "left" | "center";
    }
  | {
      kind: "image";
      imageUrl: string;
      alt: string;
      caption?: string;
      size?: "small" | "medium" | "full";
      alignment?: "left" | "center" | "right";
    }
  | {
      kind: "callout";
      text: string;
      title?: string;
      icon?: string;
      variant?: "highlight" | "quote" | "solution";
    }
  | {
      kind: "table";
      title: string;
      columns: string[];
      rows: string[][];
      variant?: "default" | "comparison";
    }
  | {
      kind: "cards";
      title?: string;
      columns?: 1 | 2 | 3 | 4;
      variant?: "default" | "yellow" | "outlined";
      cards: Array<{
        icon?: string;
        title: string;
        text: string;
      }>;
    }
  | {
      kind: "link";
      text: string;
      label: string;
      href: string;
    }
  | {
      kind: "quiz";
      quizId: string;
    }
);

export type ReusableQuiz = {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  mode?:
    | "simple"
    | "visual-preference"
    | "diagnostic"
    | "recommendation"
    | "branching";
  questions: Array<{
    id?: string;
    question: string;
    subtitle?: string;
    options: Array<
      | string
      | {
          id: string;
          label: string;
          description?: string;
          imageUrl?: string;
          imageAlt?: string;
          imagePrompt?: string;
          category?: string;
          scores?: Record<string, number>;
          nextQuestionId?: string;
          resultId?: string;
        }
    >;
  }>;
  nextLabel: string;
  resultTitle: string;
  resultText: string;
  cta: Cta;
  results?: Array<{
    id: string;
    category: string;
    title: string;
    text: string;
    description?: string;
    imageUrl?: string;
    imageAlt?: string;
    imagePrompt?: string;
    recommendations?: string[];
    cta?: Cta;
  }>;
};

export type LeadQualifier = {
  title: string;
  submitLabel: string;
  successTitle: string;
  successText: string;
  steps: Array<{
    id: string;
    title: string;
    options: Array<{
      label: string;
      value: string;
      imageSlotLabel: string;
      imageUrl: string;
      nextStepId?: string;
    }>;
  }>;
  sideImageUrl: string;
  sideImageAlt: string;
  form: {
    title: string;
    fields: Array<{
      label: string;
      type: string;
    }>;
  };
};

export type ArticleDetailFields = {
  breadcrumbs: NavigationItem[];
  title: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  heroImageUrl: string;
  heroImageAlt: string;
  readingTime: string;
  updatedLabel: string;
  updatedAt: string;
  tocTitle: string;
  sidebarCtaTitle: string;
  sidebarCta: Cta;
  socialProof: ReviewProof;
  blocks: ArticleBlock[];
  quizzes: ReusableQuiz[];
  leadQualifier: LeadQualifier;
  relatedTitle: string;
  relatedPosts: BlogPost[];
};

export type SectorHeroFields = {
  title: string;
  subtitle: string;
  cta: Cta;
  tickerImages: Array<{
    imageUrl: string;
    alt: string;
  }>;
};

export type SectorServicesFields = {
  title: string;
  cta: Cta;
  services: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
};

export type SectorBenefitsFields = {
  title: string;
  subtitle: string;
  cards: Array<{
    imageUrl: string;
    title: string;
    description: string;
  }>;
};

export type SectorExtraServicesFields = {
  title: string;
  cta: Cta;
  services: Array<{
    imageUrl: string;
    title: string;
    description: string;
    href: string;
  }>;
};

export type AboutHeroFields = {
  title: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  imageUrl: string;
  imageAlt: string;
};

export type AboutStoryFields = {
  imageUrl: string;
  imageAlt: string;
  title: string;
  description: string;
  highlights: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
};

export type HubService = {
  title: string;
  description: string;
  imageUrl: string;
  href: string;
};

export type ServicesHubHeroFields = {
  backgroundImageUrl: string;
  title: string;
  subtitle: string;
  cta: Cta;
  socialProof: ReviewProof;
  services: HubService[];
};

export type ServicesHubBentoFields = {
  title: string;
  subtitle: string;
  services: HubService[];
};

export type ServicesHubReviewsFields = {
  title: string;
  subtitle: string;
  reviews: Array<{
    text: string;
    author: string;
    city: string;
    avatarUrl: string;
    projectTitle: string;
    projectHref: string;
    projectImageUrl: string;
  }>;
};

export type RealisationsPageFields = {
  title: string;
  subtitle: string;
  cta: Cta;
  heroImages: Array<{
    imageUrl: string;
    alt: string;
  }>;
  listTitle: string;
  filters: string[];
  cardCtaLabel: string;
  projects: Array<{
    city: string;
    category: string;
    imageUrl: string;
    alt: string;
    title: string;
    href: string;
  }>;
};

export type RealisationDetailBlock =
  | {
      kind: "heading";
      text: string;
    }
  | {
      kind: "paragraph";
      text: string;
    }
  | {
      kind: "image";
      imageUrl: string;
      alt: string;
    }
  | {
      kind: "bento";
      images: Array<{
        imageUrl: string;
        alt: string;
      }>;
    }
  | {
      kind: "cards";
      cards: Array<{
        title: string;
        text: string;
        icon?: string;
      }>;
    }
  | {
      kind: "before-after";
      title: string;
      beforeImageUrl: string;
      afterImageUrl: string;
      alt: string;
    };

export type RealisationDetailFields = {
  breadcrumbs: NavigationItem[];
  title: string;
  subtitle: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  heroImageUrl: string;
  heroImageAlt: string;
  beforeAfterTitle: string;
  beforeAfterSlides: Array<{
    label: string;
    beforeImageUrl: string;
    afterImageUrl: string;
    alt: string;
  }>;
  tocTitle: string;
  testimonial: {
    text: string;
    authorName: string;
    authorRole: string;
    avatarUrl: string;
  };
  blocks: RealisationDetailBlock[];
  relatedTitle: string;
  relatedFilters: string[];
  relatedCardCtaLabel: string;
  relatedProjects: RealisationsPageFields["projects"];
};

export type BlogIndexFields = {
  title: string;
  searchPlaceholder: string;
  loadMoreLabel: string;
  posts: BlogPost[];
};

export type ContactSectionFields = {
  title: string;
  subtitle: string;
  cta: Cta;
  backgroundImageUrl: string;
  formTitle: string;
  submitLabel: string;
  socialProof: ReviewProof;
  fields: Array<{
    label: string;
    type: string;
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
      variant: "glass-a" | "light-a";
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
      type: "testimonials";
      variant: "projects-a";
      fields: ServicesHubReviewsFields;
    }
  | {
      id: string;
      type: "blog-advice";
      variant: "posts-a";
      fields: BlogAdviceFields;
    }
  | {
      id: string;
      type: "blog-index";
      variant: "grid-a";
      fields: BlogIndexFields;
    }
  | {
      id: string;
      type: "article-detail";
      variant: "seo-a";
      fields: ArticleDetailFields;
    }
  | {
      id: string;
      type: "sector-hero";
      variant: "ticker-a";
      fields: SectorHeroFields;
    }
  | {
      id: string;
      type: "sector-services";
      variant: "cards-a";
      fields: SectorServicesFields;
    }
  | {
      id: string;
      type: "sector-benefits";
      variant: "image-cards-a";
      fields: SectorBenefitsFields;
    }
  | {
      id: string;
      type: "lead-qualifier";
      variant: "quiz-a";
      fields: LeadQualifier;
    }
  | {
      id: string;
      type: "sector-extra-services";
      variant: "cards-a";
      fields: SectorExtraServicesFields;
    }
  | {
      id: string;
      type: "about-hero";
      variant: "overlap-a";
      fields: AboutHeroFields;
    }
  | {
      id: string;
      type: "about-story";
      variant: "family-a";
      fields: AboutStoryFields;
    }
  | {
      id: string;
      type: "services-hub-hero";
      variant: "ticker-a";
      fields: ServicesHubHeroFields;
    }
  | {
      id: string;
      type: "services-hub-bento";
      variant: "generator-a";
      fields: ServicesHubBentoFields;
    }
  | {
      id: string;
      type: "realisations-page";
      variant: "index-a";
      fields: RealisationsPageFields;
    }
  | {
      id: string;
      type: "realisation-detail";
      variant: "case-study-a";
      fields: RealisationDetailFields;
    }
  | {
      id: string;
      type: "contact-section";
      variant: "form-a" | "page-a";
      fields: ContactSectionFields;
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

export type EditorialPageStatus = "pending" | "approved" | "rejected";

export type EditorialPageWorkflow = {
  status: EditorialPageStatus;
  mode: "seo" | "youtube" | "trends" | "editorial";
  executionMode?: "test" | "classic";
  category: string;
  createdAt: string;
  updatedAt: string;
  research?: import("@/lib/editorial-pipeline").ResearchBrief;
  outline?: import("@/lib/editorial-pipeline").ArticleOutline;
  article?: import("@/lib/editorial-pipeline").GeneratedArticle;
  images?: import("@/lib/editorial-pipeline").ResolvedArticleImage[];
  quiz?: ReusableQuiz;
  quizPlacementAfterSectionId?: string;
};

export type SitePage = {
  id: string;
  slug: string;
  title: string;
  sections: SectionInstance[];
  editorial?: EditorialPageWorkflow;
};
