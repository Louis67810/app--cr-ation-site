"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  Copy,
  Database,
  ExternalLink,
  FileText,
  Home,
  Layers3,
  LoaderCircle,
  Maximize2,
  Monitor,
  Plus,
  Play,
  RotateCw,
  Search,
  Smartphone,
  Tablet,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { renderSection } from "@/components/site-sections";
import type { ArticleBlock, SectionInstance, SitePage } from "@/lib/site-template";

type Path = Array<string | number>;
type LeftTab = "pages" | "sections";
type DeviceMode = "desktop" | "tablet" | "phone";
type PublishStatus = "idle" | "publishing" | "published" | "error";
type DropIndicator = {
  sectionId: string;
  position: "before" | "after";
} | null;

const MIN_PANEL = 240;
const MAX_PANEL = 520;

const devicePresets: Record<
  DeviceMode,
  {
    label: string;
    range: string;
    width: number;
    minHeight: number;
    viewportHeight: number;
    icon: typeof Monitor;
  }
> = {
  desktop: {
    label: "Desktop",
    range: "1400",
    width: 1400,
    minHeight: 1400,
    viewportHeight: 883,
    icon: Monitor,
  },
  tablet: {
    label: "Tablet",
    range: "1399 - 810",
    width: 810,
    minHeight: 1800,
    viewportHeight: 810,
    icon: Tablet,
  },
  phone: {
    label: "Phone",
    range: "809 - 0",
    width: 390,
    minHeight: 2600,
    viewportHeight: 844,
    icon: Smartphone,
  },
};

const sectionLabels: Record<SectionInstance["type"], string> = {
  "site-header": "Navigation",
  hero: "Hero section",
  "social-proof": "Preuves sociales",
  services: "Prestations",
  "services-centered": "Prestations centrees",
  "services-hub-hero": "Hero hub prestations",
  "services-hub-bento": "Bento prestations",
  "recent-projects": "Realisations",
  "work-method": "Methode de travail",
  "service-areas": "Zones d'intervention",
  testimonials: "Avis clients",
  "blog-advice": "Conseils",
  "blog-index": "Liste articles",
  "article-detail": "Article",
  "sector-hero": "Hero secteur",
  "sector-services": "Prestations secteur",
  "sector-benefits": "Benefices secteur",
  "lead-qualifier": "Questionnaire",
  "sector-extra-services": "Services supplementaires",
  "about-hero": "Hero A propos",
  "about-story": "Histoire de l'entreprise",
  "realisations-page": "Page realisations",
  "realisation-detail": "Realisation precise",
  "contact-section": "Contact",
  faq: "FAQ",
  "site-footer": "Footer",
};

const defaultGardenImage =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=85";

function createSection(type: SectionInstance["type"]): SectionInstance {
  const id = `${type}-${Date.now()}`;

  if (type === "site-header") {
    return {
      id,
      type,
      variant: "glass-a",
      fields: {
        logoLabel: "Logo",
        navigation: [
          { label: "Accueil", href: "/" },
          { label: "Prestations", href: "/prestations" },
          { label: "Contact", href: "/contact" },
        ],
        cta: { label: "Demander un devis", href: "/contact" },
      },
    };
  }

  if (type === "hero") {
    return {
      id,
      type,
      variant: "full-image-a",
      fields: {
        backgroundImageUrl: "/images/hero-landscaper-mowing.png",
        title: "Un nouveau hero section",
        subtitle: "Texte de presentation a personnaliser pour le client.",
        primaryCta: { label: "Voir les prestations", href: "/prestations" },
        secondaryCta: { label: "Demander un devis", href: "/contact" },
        reviewRatingLabel: "Excellent",
        reviewScore: "4,8/5",
        reviewCount: "128 avis",
        reviewCta: { label: "Ecrire un avis", href: "#" },
      },
    };
  }

  if (type === "social-proof") {
    return {
      id,
      type,
      variant: "band-a",
      fields: {
        stats: [
          { value: "4,8/5", label: "Note moyenne client." },
          { value: "120+", label: "Projets realises." },
          { value: "15 ans", label: "D'experience." },
        ],
      },
    };
  }

  if (type === "services") {
    return {
      id,
      type,
      variant: "cards-a",
      fields: {
        title: "Nos prestations",
        cta: { label: "Tout voir", href: "/prestations" },
        services: [
          {
            title: "Creation de jardin",
            description: "Description de la prestation.",
            imageUrl: defaultGardenImage,
            href: "/prestations/creation-jardin",
          },
        ],
      },
    };
  }

  if (type === "services-centered") {
    return {
      id,
      type,
      variant: "cards-centered-a",
      fields: {
        title: "Pourquoi nous choisir ?",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        services: [
          {
            title: "Pourquoi nous choisir ?",
            description: "Description de la prestation.",
            imageUrl: defaultGardenImage,
            href: "/prestations/creation-jardin",
          },
        ],
      },
    };
  }

  if (type === "recent-projects") {
    return {
      id,
      type,
      variant: "city-filter-a",
      fields: {
        title: "Nos recentes realisations",
        subtitle: "Decouvrez nos dernieres realisations triees par ville",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        cities: ["Ville 1"],
        projects: [
          {
            city: "Ville 1",
            imageUrl: defaultGardenImage,
            alt: "Realisation paysagere",
            compareEnabled: "oui",
            beforeImageUrl: defaultGardenImage,
            afterImageUrl: defaultGardenImage,
          },
        ],
      },
    };
  }

  if (type === "work-method") {
    return {
      id,
      type,
      variant: "alternating-a",
      fields: {
        title: "Notre Methode de travail",
        subtitle: "Decouvrez notre accompagnement de la premiere idee a la livraison",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        steps: [
          {
            title: "Analyse du terrain",
            description: "Nous etudions vos usages, le terrain et les contraintes techniques.",
            imageUrl: defaultGardenImage,
          },
        ],
      },
    };
  }

  if (type === "service-areas") {
    return {
      id,
      type,
      variant: "image-list-a",
      fields: {
        title: "Nos zones d'interventions",
        subtitle: "Decouvrez les villes ou notre equipe intervient.",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        areas: [
          { name: "Ville 1", href: "/zones/ville-1", imageUrl: defaultGardenImage },
        ],
      },
    };
  }

  if (type === "testimonials") {
    return {
      id,
      type,
      variant: "gallery-a",
      fields: {
        title: "Ils nous ont fait confiance",
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        images: [defaultGardenImage, defaultGardenImage, defaultGardenImage],
        reviews: [
          {
            author: "Client",
            avatarUrl: defaultGardenImage,
            text: "Avis client a personnaliser dans les variables.",
          },
        ],
      },
    };
  }

  if (type === "blog-advice") {
    return {
      id,
      type,
      variant: "posts-a",
      fields: {
        title: "Nos conseils",
        cta: { label: "Book a Table", href: "/blog" },
        posts: [
          {
            category: "Conseils",
            title: "Titre de l'article",
            excerpt: "Court resume de l'article pour preparer la future connexion CMS.",
            imageUrl: defaultGardenImage,
            href: "/blog/article",
            date: "22 Mai 2026",
          },
        ],
      },
    };
  }

  if (type === "blog-index") {
    return {
      id,
      type,
      variant: "grid-a",
      fields: {
        title: "Nos derniers articles",
        searchPlaceholder: "Rechercher un article",
        loadMoreLabel: "Voir plus",
        posts: [
          {
            category: "Conseils",
            title: "Titre de l'article",
            excerpt: "Resume de l'article.",
            imageUrl: defaultGardenImage,
            href: "/blog/article",
            date: "22 Mai 2026",
          },
        ],
      },
    };
  }

  if (type === "services-hub-hero") {
    return {
      id,
      type,
      variant: "ticker-a",
      fields: {
        backgroundImageUrl: defaultGardenImage,
        title: "Des prestations pensees pour votre exterieur",
        subtitle: "De la conception a l'entretien, decouvrez un accompagnement paysager complet.",
        cta: { label: "Nous contacter", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        services: [
          {
            title: "Creation de jardin",
            description: "Un jardin compose selon vos usages et votre terrain.",
            imageUrl: defaultGardenImage,
            href: "/prestations/creation-jardin",
          },
        ],
      },
    };
  }

  if (type === "services-hub-bento") {
    return {
      id,
      type,
      variant: "generator-a",
      fields: {
        title: "Nos prestations",
        subtitle: "Une expertise complete pour imaginer, realiser et entretenir vos exterieurs.",
        services: [
          {
            title: "Creation de jardin",
            description: "Un jardin compose selon vos usages et votre terrain.",
            imageUrl: defaultGardenImage,
            href: "/prestations/creation-jardin",
          },
        ],
      },
    };
  }

  if (type === "article-detail") {
    return {
      id,
      type,
      variant: "seo-a",
      fields: {
        breadcrumbs: [
          { label: "Accueil", href: "/" },
          { label: "Blog", href: "/blog" },
        ],
        title: "Titre de l'article",
        subtitle: "Introduction courte de l'article pour presenter le sujet.",
        primaryCta: { label: "Lire l'article", href: "#article" },
        secondaryCta: { label: "Demander un devis", href: "/contact" },
        heroImageUrl: defaultGardenImage,
        heroImageAlt: "Image de jardin",
        readingTime: "5 minutes",
        updatedLabel: "Mis a jour le",
        updatedAt: "9 Juillet 2026",
        tocTitle: "Sommaire",
        sidebarCtaTitle: "Un projet paysager a concretiser ?",
        sidebarCta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Bien", reviewCount: "500 avis" },
        blocks: [
          { kind: "paragraph", text: "Premier paragraphe de l'article." },
          { kind: "heading", level: "h2", text: "Premier titre" },
          { kind: "paragraph", text: "Contenu de la partie." },
          { kind: "quiz", quizId: "quiz-article-default" },
        ],
        quizzes: [
          {
            id: "quiz-article-default",
            name: "Quiz article par defaut",
            title: "Quel amenagement vous correspond ?",
            subtitle: "Repondez a quelques questions pour affiner le besoin.",
            nextLabel: "Suivant",
            resultTitle: "Votre piste est prete",
            resultText: "Une premiere recommandation peut maintenant etre proposee.",
            cta: { label: "Recevoir une proposition", href: "/contact" },
            questions: [
              {
                question: "De quoi avez-vous besoin ?",
                options: ["Amenagement", "Entretien", "Conseil", "Diagnostic"],
              },
            ],
          },
        ],
        leadQualifier: {
          title: "De quoi avez vous besoin",
          submitLabel: "Envoyer",
          successTitle: "Merci, votre demande est qualifiee",
          successText: "Nous avons les premieres informations pour vous recontacter.",
          steps: [
            {
              id: "profil",
              title: "Vous etes ?",
              options: [
                {
                  label: "Particulier",
                  value: "particulier",
                  imageSlotLabel: "Image particulier",
                  imageUrl: "/images/lead-qualifier/particulier.png",
                  nextStepId: "besoin",
                },
                {
                  label: "Professionnel",
                  value: "professionnel",
                  imageSlotLabel: "Image professionnel",
                  imageUrl: "/images/lead-qualifier/professionnel.png",
                  nextStepId: "besoin",
                },
              ],
            },
            {
              id: "besoin",
              title: "De quoi avez vous besoin ?",
              options: [
                {
                  label: "Amenagement",
                  value: "amenagement",
                  imageSlotLabel: "Image amenagement",
                  imageUrl: "/images/lead-qualifier/amenagement.png",
                  nextStepId: "delai",
                },
                {
                  label: "Entretien",
                  value: "entretien",
                  imageSlotLabel: "Image entretien",
                  imageUrl: "/images/lead-qualifier/entretien.png",
                  nextStepId: "delai",
                },
              ],
            },
            {
              id: "delai",
              title: "Quand souhaitez-vous lancer le projet ?",
              options: [
                {
                  label: "Rapidement",
                  value: "rapidement",
                  imageSlotLabel: "Image rapide",
                  imageUrl: "/images/lead-qualifier/amenagement.png",
                },
                {
                  label: "Je compare",
                  value: "comparaison",
                  imageSlotLabel: "Image comparaison",
                  imageUrl: "/images/lead-qualifier/collectivite.png",
                },
              ],
            },
          ],
          sideImageUrl: "/images/lead-qualifier/amenagement.png",
          sideImageAlt: "Illustration isometrique d'un amenagement paysager",
          form: {
            title: "Vos coordonnees",
            fields: [
              { label: "Prenom*", type: "text" },
              { label: "Telephone*", type: "tel" },
              { label: "Adresse mail*", type: "email" },
              { label: "Message", type: "textarea" },
            ],
          },
        },
        relatedTitle: "Nos derniers articles",
        relatedPosts: [
          {
            category: "Conseils",
            title: "Titre de l'article",
            excerpt: "Resume de l'article.",
            imageUrl: defaultGardenImage,
            href: "/blog/article",
            date: "22 Mai 2026",
          },
        ],
      },
    };
  }

  if (type === "sector-hero") {
    return {
      id,
      type,
      variant: "ticker-a",
      fields: {
        title: "Paysagiste pour votre secteur",
        subtitle: "Une page sectorielle connectee au CMS pour presenter une offre dediee.",
        cta: { label: "Book a Table", href: "#qualification" },
        tickerImages: [
          { imageUrl: defaultGardenImage, alt: "Image paysagere" },
          { imageUrl: defaultGardenImage, alt: "Image paysagere" },
          { imageUrl: defaultGardenImage, alt: "Image paysagere" },
          { imageUrl: defaultGardenImage, alt: "Image paysagere" },
        ],
      },
    };
  }

  if (type === "sector-services") {
    return {
      id,
      type,
      variant: "cards-a",
      fields: {
        title: "Nos prestations",
        cta: { label: "Book a Table", href: "#qualification" },
        services: [
          {
            icon: "leaf",
            title: "Prestation 1",
            description: "Description de la prestation et de son benefice commercial.",
          },
          {
            icon: "badgePercent",
            title: "Prestation 2",
            description: "Description de la prestation et de son benefice commercial.",
          },
          {
            icon: "shield",
            title: "Prestation 3",
            description: "Description de la prestation et de son benefice commercial.",
          },
        ],
      },
    };
  }

  if (type === "sector-benefits") {
    return {
      id,
      type,
      variant: "image-cards-a",
      fields: {
        title: "Nous rendons vos exterieurs plus simples a vendre",
        subtitle: "Des arguments clairs pour montrer la valeur du service.",
        cards: [
          { imageUrl: defaultGardenImage, title: "Benefice 1", description: "Texte du benefice." },
          { imageUrl: defaultGardenImage, title: "Benefice 2", description: "Texte du benefice." },
          { imageUrl: defaultGardenImage, title: "Benefice 3", description: "Texte du benefice." },
        ],
      },
    };
  }

  if (type === "lead-qualifier") {
    return {
      id,
      type,
      variant: "quiz-a",
      fields: {
        title: "De quoi avez vous besoin",
        submitLabel: "Envoyer",
        successTitle: "Merci, votre demande est qualifiee",
        successText: "Nous avons les premieres informations pour vous recontacter.",
        steps: [
          {
            id: "profil",
            title: "Vous etes ?",
            options: [
              {
                label: "Particulier",
                value: "particulier",
                imageSlotLabel: "Image particulier",
                imageUrl: "/images/lead-qualifier/particulier.png",
                nextStepId: "besoin",
              },
              {
                label: "Professionnel",
                value: "professionnel",
                imageSlotLabel: "Image professionnel",
                imageUrl: "/images/lead-qualifier/professionnel.png",
                nextStepId: "besoin",
              },
            ],
          },
          {
            id: "besoin",
            title: "De quoi avez vous besoin ?",
            options: [
              {
                label: "Amenagement",
                value: "amenagement",
                imageSlotLabel: "Image amenagement",
                imageUrl: "/images/lead-qualifier/amenagement.png",
                nextStepId: "delai",
              },
              {
                label: "Entretien",
                value: "entretien",
                imageSlotLabel: "Image entretien",
                imageUrl: "/images/lead-qualifier/entretien.png",
                nextStepId: "delai",
              },
            ],
          },
          {
            id: "delai",
            title: "Quand souhaitez-vous lancer le projet ?",
            options: [
              {
                label: "Rapidement",
                value: "rapidement",
                imageSlotLabel: "Image rapide",
                imageUrl: "/images/lead-qualifier/amenagement.png",
              },
              {
                label: "Je compare",
                value: "comparaison",
                imageSlotLabel: "Image comparaison",
                imageUrl: "/images/lead-qualifier/collectivite.png",
              },
            ],
          },
        ],
        sideImageUrl: "/images/lead-qualifier/amenagement.png",
        sideImageAlt: "Illustration isometrique",
        form: {
          title: "Vos coordonnees",
          fields: [
            { label: "Prenom*", type: "text" },
            { label: "Telephone*", type: "tel" },
            { label: "Adresse mail*", type: "email" },
            { label: "Message", type: "textarea" },
          ],
        },
      },
    };
  }

  if (type === "sector-extra-services") {
    return {
      id,
      type,
      variant: "cards-a",
      fields: {
        title: "Beneficiez de plus de 40 ans d'experience",
        cta: { label: "Book a Table", href: "#qualification" },
        services: [
          { imageUrl: defaultGardenImage, title: "Service 1", description: "Description du service.", href: "#" },
          { imageUrl: defaultGardenImage, title: "Service 2", description: "Description du service.", href: "#" },
          { imageUrl: defaultGardenImage, title: "Service 3", description: "Description du service.", href: "#" },
        ],
      },
    };
  }

  if (type === "about-hero") {
    return {
      id,
      type,
      variant: "overlap-a",
      fields: {
        title: "Une histoire de terrain et de passion",
        subtitle: "Decouvrez l'equipe et les valeurs qui accompagnent chacun de nos projets paysagers.",
        primaryCta: { label: "Nous contacter", href: "#contact" },
        secondaryCta: { label: "Nos prestations", href: "/prestations" },
        imageUrl: defaultGardenImage,
        imageAlt: "Equipe de paysagistes au travail",
      },
    };
  }

  if (type === "about-story") {
    return {
      id,
      type,
      variant: "family-a",
      fields: {
        imageUrl: defaultGardenImage,
        imageAlt: "Portrait de l'entreprise paysagere",
        title: "Une entreprise familiale depuis 1985",
        description: "Une histoire familiale qui associe la tradition du metier, la connaissance du terrain et des pratiques adaptees aux enjeux actuels.",
        highlights: [
          {
            icon: "tree",
            title: "Savoir-faire transmis",
            description: "Une experience construite sur le terrain et partagee entre les generations.",
          },
          {
            icon: "shield",
            title: "Engagement durable",
            description: "Des choix fiables et adaptes pour faire durer chaque amenagement.",
          },
        ],
      },
    };
  }

  if (type === "realisations-page") {
    return {
      id,
      type,
      variant: "index-a",
      fields: {
        title: "Nos realisations paysageres",
        subtitle:
          "Decouvrez une selection de projets realises pour nos clients.",
        cta: { label: "Voir les realisations", href: "#realisations" },
        heroImages: [
          { imageUrl: defaultGardenImage, alt: "Realisation paysagere" },
          { imageUrl: defaultGardenImage, alt: "Realisation paysagere" },
          { imageUrl: defaultGardenImage, alt: "Realisation paysagere" },
        ],
        listTitle: "Toutes nos realisations",
        filters: ["Nantes", "Rennes", "Vannes"],
        cardCtaLabel: "Decouvrir la realisation",
        projects: [
          {
            city: "Nantes",
            category: "Nantes",
            imageUrl: defaultGardenImage,
            alt: "Realisation paysagere",
            title: "Titre de la realisation",
            href: "#",
          },
        ],
      },
    };
  }

  if (type === "realisation-detail") {
    return {
      id,
      type,
      variant: "case-study-a",
      fields: {
        breadcrumbs: [
          { label: "Accueil", href: "/" },
          { label: "Realisations", href: "/realisations" },
        ],
        title: "Titre de la realisation precise",
        subtitle: "Texte court pour presenter le contexte du projet.",
        primaryCta: { label: "Voir le projet", href: "#avant-apres" },
        secondaryCta: { label: "Demander un devis", href: "#contact" },
        heroImageUrl: defaultGardenImage,
        heroImageAlt: "Realisation paysagere",
        beforeAfterTitle: "Avant / apres du projet",
        beforeAfterSlides: [
          {
            label: "Concept",
            beforeImageUrl: defaultGardenImage,
            afterImageUrl: defaultGardenImage,
            alt: "Comparaison avant apres",
          },
        ],
        tocTitle: "Sommaire",
        testimonial: {
          text: "Avis client a personnaliser.",
          authorName: "Jean Dupont",
          authorRole: "Client",
          avatarUrl: defaultGardenImage,
        },
        blocks: [
          { kind: "heading", text: "Contexte du projet" },
          { kind: "paragraph", text: "Texte de contexte du projet." },
          { kind: "image", imageUrl: defaultGardenImage, alt: "Image du projet" },
          { kind: "heading", text: "Solutions apportees" },
          { kind: "paragraph", text: "Texte des solutions apportees." },
        ],
        relatedTitle: "Toutes nos realisations",
        relatedFilters: ["Nantes", "Rennes", "Vannes"],
        relatedCardCtaLabel: "Decouvrir la realisation",
        relatedProjects: [
          {
            city: "Nantes",
            category: "Nantes",
            imageUrl: defaultGardenImage,
            alt: "Realisation paysagere",
            title: "Titre de la realisation",
            href: "#",
          },
        ],
      },
    };
  }

  if (type === "contact-section") {
    return {
      id,
      type,
      variant: "form-a",
      fields: {
        title: "Un projet paysager a concretiser ?",
        subtitle: "Texte de contact a personnaliser.",
        cta: { label: "Book a Table", href: "/contact" },
        backgroundImageUrl: defaultGardenImage,
        formTitle: "Formulaire de contact",
        submitLabel: "Envoyer le formulaire",
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        fields: [
          { label: "Nom Prenom*", type: "text" },
          { label: "Budget*", type: "text" },
          { label: "Numero de telephone *", type: "tel" },
          { label: "Adresse mail*", type: "email" },
          { label: "Message*", type: "textarea" },
        ],
      },
    };
  }

  if (type === "faq") {
    return {
      id,
      type,
      variant: "accordion-a",
      fields: {
        title: "Les questions frequentes",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        items: [{ question: "Question 1", answer: "Reponse a personnaliser." }],
      },
    };
  }

  return {
    id,
    type,
    variant: "landscaper-a",
    fields: {
      title: "Un projet paysager a concretiser ?",
      subtitle: "Texte du footer a personnaliser.",
      cta: { label: "Book a Table", href: "/contact" },
      backgroundImageUrl: defaultGardenImage,
      logoLabel: "Logo",
      copyright: "(c) 2026. Tous droits reserves.",
      addressLabel: "ADRESSE :",
      address: "Adresse de l'entreprise",
      contactLabel: "CONTACT:",
      phone: "00 00 00 00 00",
      email: "contact@example.com",
      credit: "Site realise par Apsodia",
      socialLinks: [
        { label: "in", href: "#" },
        { label: "ig", href: "#" },
      ],
      linkGroups: [
        {
          title: "Pages",
          links: [{ label: "Accueil", href: "/" }],
        },
      ],
    },
  };
}

function readAtPath(value: unknown, path: Path): unknown {
  return path.reduce<unknown>((current, key) => {
    if (current == null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, value);
}

function updateAtPath<T>(value: T, path: Path, nextValue: string): T {
  if (path.length === 0) {
    return nextValue as T;
  }

  if (Array.isArray(value)) {
    const [head, ...rest] = path;

    return value.map((item, index) =>
      index === head ? updateAtPath(item, rest, nextValue) : item,
    ) as T;
  }

  if (typeof value === "object" && value !== null) {
    const [head, ...rest] = path;

    return {
      ...value,
      [head]: updateAtPath(
        (value as Record<string, unknown>)[head],
        rest,
        nextValue,
      ),
    };
  }

  return value;
}

function getEditableStringPaths(value: unknown, basePath: Path = []): Path[] {
  if (typeof value === "string") {
    return [basePath];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      getEditableStringPaths(item, [...basePath, index]),
    );
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, item]) =>
      getEditableStringPaths(item, [...basePath, key]),
    );
  }

  return [];
}

function pathLabel(path: Path) {
  const labels: Record<string, string> = {
    logoLabel: "Logo",
    navigation: "Menu",
    label: "Libelle",
    href: "Lien",
    cta: "CTA",
    backgroundImageUrl: "Image de fond",
    title: "Titre",
    subtitle: "Sous-titre",
    primaryCta: "CTA secondaire",
    secondaryCta: "CTA principal",
    reviewRatingLabel: "Libelle avis",
    ratingLabel: "Libelle",
    reviewScore: "Note avis",
    reviewCount: "Nombre d'avis",
    socialProof: "Avis",
    reviewCta: "CTA avis",
    stats: "Statistique",
    services: "Prestation",
    description: "Description",
    imageUrl: "Image",
    cities: "Ville",
    name: "Nom",
    projects: "Realisation",
    city: "Ville",
    alt: "Texte alternatif",
    compareEnabled: "Avant/apres active",
    beforeImageUrl: "Image avant",
    afterImageUrl: "Image apres",
    steps: "Etape",
    areas: "Zone",
    reviews: "Avis",
    author: "Auteur",
    avatarUrl: "Photo profil",
    projectTitle: "Titre realisation",
    projectHref: "Lien realisation",
    projectImageUrl: "Image realisation",
    text: "Texte",
    images: "Image",
    posts: "Article",
    category: "Categorie",
    excerpt: "Resume",
    date: "Date",
    searchPlaceholder: "Placeholder recherche",
    loadMoreLabel: "Bouton voir plus",
    items: "Question",
    question: "Question",
    answer: "Reponse",
    formTitle: "Titre formulaire",
    submitLabel: "Bouton formulaire",
    type: "Type",
    copyright: "Copyright",
    addressLabel: "Libelle adresse",
    address: "Adresse",
    contactLabel: "Libelle contact",
    phone: "Telephone",
    email: "Email",
    credit: "Credit",
    socialLinks: "Reseau",
    linkGroups: "Colonne",
    links: "Lien",
    breadcrumbs: "Fil d'Ariane",
    heroImageUrl: "Image hero",
    heroImageAlt: "Alt image hero",
    readingTime: "Temps de lecture",
    updatedLabel: "Libelle maj",
    updatedAt: "Date maj",
    tocTitle: "Titre sommaire",
    sidebarCtaTitle: "Titre CTA lateral",
    sidebarCta: "CTA lateral",
    blocks: "Bloc",
    kind: "Type de bloc",
    level: "Niveau",
    quiz: "Quiz",
    quizzes: "Quiz",
    id: "Identifiant",
    quizId: "Quiz utilise",
    questions: "Question quiz",
    options: "Option",
    nextLabel: "Bouton suivant",
    resultTitle: "Titre resultat",
    resultText: "Texte resultat",
    relatedTitle: "Titre articles lies",
    relatedPosts: "Article lie",
    highlights: "Point cle",
    icon: "Icone Lucide",
    imageAlt: "Texte alternatif",
  };

  return path
    .map((part) => {
      if (typeof part === "number") {
        return `${part + 1}`;
      }

      return labels[part] ?? part;
    })
    .join(" / ");
}

function pathCategory(path: Path) {
  const first = String(path[0] ?? "");
  const second = String(path[1] ?? "");

  if (first === "backgroundImageUrl" || first === "imageUrl") return "Image";
  if (first.toLowerCase().includes("cta") || second.toLowerCase().includes("cta")) return "CTA";
  if (first === "socialProof" || first === "reviewRatingLabel" || first === "reviewScore" || first === "reviewCount" || first === "reviewCta") return "Avis";
  if (first === "navigation") return "Menu";
  if (first === "stats") return "Statistiques";
  if (first === "services") return "Prestations";
  if (first === "highlights") return "Points cles";
  if (first === "cities") return "Villes";
  if (first === "steps") return "Etapes";
  if (first === "areas") return "Zones";
  if (first === "reviews") return "Avis clients";
  if (first === "images") return "Images";
  if (first === "posts") return "Articles";
  if (first === "relatedPosts") return "Articles lies";
  if (first === "blocks") return "Blocs article";
  if (first === "quizzes") return "Quiz";
  if (first === "breadcrumbs") return "Fil d'Ariane";
  if (first === "sidebarCta") return "CTA";
  if (first === "items") return "Questions";
  if (first === "fields") return "Champs formulaire";
  if (first === "socialLinks") return "Reseaux sociaux";
  if (first === "linkGroups") return "Colonnes footer";
  if (first === "logoLabel") return "Logo";

  return "Contenu";
}

function groupPaths(paths: Path[]) {
  return paths.reduce<Array<{ category: string; paths: Path[] }>>((groups, path) => {
    const category = pathCategory(path);
    const group = groups.find((item) => item.category === category);

    if (group) {
      group.paths.push(path);
    } else {
      groups.push({ category, paths: [path] });
    }

    return groups;
  }, []);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDeviceModeFromWidth(width: number): DeviceMode {
  if (width <= 809) {
    return "phone";
  }

  if (width <= 1399) {
    return "tablet";
  }

  return "desktop";
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

export function SiteBuilderShell({
  initialPages,
  initialProjectName = "Projet paysagiste",
  projectKey = "default",
}: {
  initialPages: SitePage[];
  initialProjectName?: string;
  projectKey?: string;
}) {
  const [pages, setPages] = useState(initialPages);
  const [activePageId, setActivePageId] = useState(initialPages[0]?.id ?? "");
  const page =
    pages.find((currentPage) => currentPage.id === activePageId) ??
    pages[0] ??
    initialPages[0];
  const [selectedSectionId, setSelectedSectionId] = useState(
    page.sections.find((section) => section.type === "hero")?.id ??
      page.sections[0]?.id ??
      "",
  );
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>("sections");
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(370);
  const [projectName] = useState(initialProjectName);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [publicationUrl, setPublicationUrl] = useState("");
  const [publishError, setPublishError] = useState("");
  const [previewSize, setPreviewSize] = useState({
    width: devicePresets.desktop.width,
    height: 883,
  });
  const [zoom, setZoom] = useState(0.58);
  const [spacePressed, setSpacePressed] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);
  const [contextMenu, setContextMenu] = useState<{
    sectionId: string;
    x: number;
    y: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const zoomContentRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef({ active: false, x: 0, y: 0, left: 0, top: 0 });
  const draggedSectionIdRef = useRef<string | null>(null);

  const selectedSection = useMemo(
    () => page.sections.find((section) => section.id === selectedSectionId),
    [page.sections, selectedSectionId],
  );

  function updateCurrentPage(updater: (currentPage: SitePage) => SitePage) {
    setPages((currentPages) =>
      currentPages.map((currentPage) =>
        currentPage.id === page.id ? updater(currentPage) : currentPage,
      ),
    );
  }

  function selectPage(pageId: string) {
    const nextPage = pages.find((currentPage) => currentPage.id === pageId);

    if (!nextPage) return;

    setActivePageId(pageId);
    setSelectedSectionId(
      nextPage.sections.find((section) => section.type === "hero")?.id ??
        nextPage.sections[0]?.id ??
        "",
    );
  }

  useEffect(() => {
    window.localStorage.setItem("site-builder-draft-v1", JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      void fetch("/api/projects/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, projectKey, pages }),
      });
    }, 1200);

    return () => window.clearTimeout(saveTimer);
  }, [pages, projectKey, projectName]);

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.scrollLeft = 360;
    canvasRef.current.scrollTop = 60;
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === "Space" && !isEditableTarget(event.target)) {
        event.preventDefault();

        if (!event.repeat) {
          setSpacePressed(true);
        }
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") {
        setSpacePressed(false);
        panRef.current.active = false;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const currentCanvas = canvas;

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey) {
        return;
      }

      const previousZoom = zoomRef.current;
      const nextZoom = clamp(previousZoom - event.deltaY * 0.0007, 0.25, 1.4);
      const rect = currentCanvas.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const zoomContent = zoomContentRef.current;
      const contentLeft = zoomContent?.offsetLeft ?? 0;
      const contentTop = zoomContent?.offsetTop ?? 0;
      const contentX =
        (currentCanvas.scrollLeft + pointerX - contentLeft) / previousZoom;
      const contentY =
        (currentCanvas.scrollTop + pointerY - contentTop) / previousZoom;

      event.preventDefault();
      event.stopPropagation();
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
      currentCanvas.scrollLeft = contentLeft + contentX * nextZoom - pointerX;
      currentCanvas.scrollTop = contentTop + contentY * nextZoom - pointerY;
    }

    currentCanvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      currentCanvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  function updateSection(sectionId: string, path: Path, nextValue: string) {
    updateCurrentPage((currentPage) => {
      const sourceSection = currentPage.sections.find(
        (section) => section.id === sectionId,
      );
      const syncHubServices =
        path[0] === "services" &&
        (sourceSection?.type === "services-hub-hero" ||
          sourceSection?.type === "services-hub-bento");

      return {
        ...currentPage,
        sections: currentPage.sections.map((section) => {
          const isSyncedHubSection =
            syncHubServices &&
            (section.type === "services-hub-hero" ||
              section.type === "services-hub-bento");

          if (section.id !== sectionId && !isSyncedHubSection) {
            return section;
          }

          return {
            ...section,
            fields: updateAtPath(section.fields, path, nextValue),
          } as SectionInstance;
        }),
      };
    });
  }

  function updateSelectedSection(path: Path, nextValue: string) {
    if (selectedSection) {
      updateSection(selectedSection.id, path, nextValue);
    }
  }

  function changeSectionVariant(sectionId: string, nextVariant: string) {
    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (section.id !== sectionId || section.variant === nextVariant) {
          return section;
        }

        if (section.type === "testimonials" && nextVariant === "projects-a") {
          const projectImages =
            section.variant === "gallery-a" ? section.fields.images : [];

          return {
            id: section.id,
            type: "testimonials",
            variant: "projects-a",
            fields: {
              title: section.fields.title,
              subtitle: "Chaque avis est relie a une realisation concrete.",
              reviews: section.fields.reviews.map((review, index) => ({
                text: review.text,
                author: review.author,
                city: "Perigueux",
                avatarUrl: review.avatarUrl,
                projectTitle: `Realisation ${index + 1}`,
                projectHref: "/realisations",
                projectImageUrl:
                  projectImages[index] ?? projectImages[0] ?? defaultGardenImage,
              })),
            },
          } as SectionInstance;
        }

        if (section.type === "testimonials" && nextVariant === "gallery-a") {
          const projectImages =
            section.variant === "projects-a"
              ? section.fields.reviews.map((review) => review.projectImageUrl)
              : [];

          return {
            id: section.id,
            type: "testimonials",
            variant: "gallery-a",
            fields: {
              title: section.fields.title,
              socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
              images:
                projectImages.length > 0 ? projectImages : [defaultGardenImage],
              reviews: section.fields.reviews.map((review) => ({
                author: review.author,
                avatarUrl: review.avatarUrl,
                text: review.text,
              })),
            },
          } as SectionInstance;
        }

        if (
          (section.type === "contact-section" &&
            (nextVariant === "form-a" || nextVariant === "page-a")) ||
          (section.type === "site-header" &&
            (nextVariant === "glass-a" || nextVariant === "light-a"))
        ) {
          return { ...section, variant: nextVariant } as SectionInstance;
        }

        return section;
      }),
    }));
  }

  function addSocialProofStat() {
    if (!selectedSection || selectedSection.type !== "social-proof") {
      return;
    }

    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (
          section.id !== selectedSection.id ||
          section.type !== "social-proof" ||
          section.fields.stats.length >= 5
        ) {
          return section;
        }

        return {
          ...section,
          fields: {
            ...section.fields,
            stats: [
              ...section.fields.stats,
              { value: "4,8/5", label: "Nouvelle preuve sociale." },
            ],
          },
        };
      }),
    }));
  }

  function removeSocialProofStat() {
    if (!selectedSection || selectedSection.type !== "social-proof") {
      return;
    }

    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (
          section.id !== selectedSection.id ||
          section.type !== "social-proof" ||
          section.fields.stats.length <= 1
        ) {
          return section;
        }

        return {
          ...section,
          fields: {
            ...section.fields,
            stats: section.fields.stats.slice(0, -1),
          },
        };
      }),
    }));
  }

  function addRecentProjectCity() {
    if (!selectedSection || selectedSection.type !== "recent-projects") return;

    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (
          section.id !== selectedSection.id ||
          section.type !== "recent-projects" ||
          section.fields.cities.length >= 8
        ) {
          return section;
        }

        return {
          ...section,
          fields: {
            ...section.fields,
            cities: [...section.fields.cities, `Ville ${section.fields.cities.length + 1}`],
          },
        };
      }),
    }));
  }

  function addRecentProject() {
    if (!selectedSection || selectedSection.type !== "recent-projects") return;

    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (section.id !== selectedSection.id || section.type !== "recent-projects") {
          return section;
        }

        const city = section.fields.cities[0] ?? "Ville 1";

        return {
          ...section,
          fields: {
            ...section.fields,
            projects: [
              ...section.fields.projects,
              {
                city,
                imageUrl: defaultGardenImage,
                alt: "Nouvelle realisation",
                compareEnabled: "non",
                beforeImageUrl: defaultGardenImage,
                afterImageUrl: defaultGardenImage,
              },
            ],
          },
        };
      }),
    }));
  }

  function removeRecentProject(projectIndex: number) {
    if (!selectedSection || selectedSection.type !== "recent-projects") return;

    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (section.id !== selectedSection.id || section.type !== "recent-projects") {
          return section;
        }

        return {
          ...section,
          fields: {
            ...section.fields,
            projects: section.fields.projects.filter((_, index) => index !== projectIndex),
          },
        };
      }),
    }));
  }

  function addWorkMethodStep() {
    if (!selectedSection || selectedSection.type !== "work-method") return;

    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (
          section.id !== selectedSection.id ||
          section.type !== "work-method" ||
          section.fields.steps.length >= 6
        ) {
          return section;
        }

        return {
          ...section,
          fields: {
            ...section.fields,
            steps: [
              ...section.fields.steps,
              {
                title: `Etape ${section.fields.steps.length + 1}`,
                description: "Description de cette etape de travail.",
                imageUrl: defaultGardenImage,
              },
            ],
          },
        };
      }),
    }));
  }

  function removeWorkMethodStep() {
    if (!selectedSection || selectedSection.type !== "work-method") return;

    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        if (
          section.id !== selectedSection.id ||
          section.type !== "work-method" ||
          section.fields.steps.length <= 1
        ) {
          return section;
        }

        return {
          ...section,
          fields: {
            ...section.fields,
            steps: section.fields.steps.slice(0, -1),
          },
        };
      }),
    }));
  }

  function addRepeatableItem(group: string) {
    if (!selectedSection) return;

    const syncHubServices =
      group === "Prestations" &&
      (selectedSection.type === "services-hub-hero" ||
        selectedSection.type === "services-hub-bento");

    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        const isSyncedHubSection =
          syncHubServices &&
          (section.type === "services-hub-hero" ||
            section.type === "services-hub-bento");

        if (section.id !== selectedSection.id && !isSyncedHubSection) return section;

        if (
          (section.type === "services-hub-hero" ||
            section.type === "services-hub-bento") &&
          group === "Prestations"
        ) {
          const nextIndex = section.fields.services.length + 1;

          return {
            ...section,
            fields: {
              ...section.fields,
              services: [
                ...section.fields.services,
                {
                  title: `Nouvelle prestation ${nextIndex}`,
                  description: "Description de la prestation.",
                  imageUrl: defaultGardenImage,
                  href: `/prestations/prestation-${nextIndex}`,
                },
              ],
            },
          } as SectionInstance;
        }

        if (
          section.type === "testimonials" &&
          section.variant === "projects-a" &&
          group === "Avis clients"
        ) {
          return {
            ...section,
            fields: {
              ...section.fields,
              reviews: [
                ...section.fields.reviews,
                {
                  text: "Nouvel avis client.",
                  author: "Client",
                  city: "Perigueux",
                  avatarUrl: defaultGardenImage,
                  projectTitle: "Nouvelle realisation",
                  projectHref: "/realisations",
                  projectImageUrl: defaultGardenImage,
                },
              ],
            },
          } as SectionInstance;
        }

        if (section.type === "service-areas" && group === "Zones") {
          return {
            ...section,
            fields: {
              ...section.fields,
              areas: [
                ...section.fields.areas,
                {
                  name: `Ville ${section.fields.areas.length + 1}`,
                  href: `/zones/ville-${section.fields.areas.length + 1}`,
                  imageUrl: defaultGardenImage,
                },
              ],
            },
          };
        }

        if (
          section.type === "testimonials" &&
          section.variant === "gallery-a" &&
          group === "Avis clients"
        ) {
          return {
            ...section,
            fields: {
              ...section.fields,
              reviews: [
                ...section.fields.reviews,
                {
                  author: "Client",
                  avatarUrl: defaultGardenImage,
                  text: "Nouvel avis client.",
                },
              ],
            },
          };
        }

        if (
          section.type === "testimonials" &&
          section.variant === "gallery-a" &&
          group === "Images"
        ) {
          return {
            ...section,
            fields: {
              ...section.fields,
              images: [...section.fields.images, defaultGardenImage],
            },
          };
        }

        if (section.type === "blog-advice" && group === "Articles") {
          return {
            ...section,
            fields: {
              ...section.fields,
              posts: [
                ...section.fields.posts,
                {
                  category: "Conseils",
                  title: "Nouvel article",
                  excerpt: "Resume de l'article.",
                  imageUrl: defaultGardenImage,
                  href: "/blog/nouvel-article",
                  date: "22 Mai 2026",
                },
              ],
            },
          };
        }

        if (section.type === "faq" && group === "Questions") {
          return {
            ...section,
            fields: {
              ...section.fields,
              items: [
                ...section.fields.items,
                { question: "Nouvelle question", answer: "Reponse a personnaliser." },
              ],
            },
          };
        }

        if (section.type === "contact-section" && group === "Champs formulaire") {
          return {
            ...section,
            fields: {
              ...section.fields,
              fields: [
                ...section.fields.fields,
                { label: "Nouveau champ", type: "text" },
              ],
            },
          } as SectionInstance;
        }

        if (section.type === "about-story" && group === "Points cles") {
          return {
            ...section,
            fields: {
              ...section.fields,
              highlights: [
                ...section.fields.highlights,
                {
                  icon: "leaf",
                  title: `Point cle ${section.fields.highlights.length + 1}`,
                  description: "Description de ce point cle.",
                },
              ],
            },
          } as SectionInstance;
        }

        if (section.type === "blog-index" && group === "Articles") {
          return {
            ...section,
            fields: {
              ...section.fields,
              posts: [
                ...section.fields.posts,
                {
                  category: "Conseils",
                  title: "Nouvel article",
                  excerpt: "Resume de l'article.",
                  imageUrl: defaultGardenImage,
                  href: "/blog/nouvel-article",
                  date: "22 Mai 2026",
                },
              ],
            },
          };
        }

        if (section.type === "article-detail") {
          if (group === "Quiz") {
            const nextIndex = section.fields.quizzes.length + 1;

            return {
              ...section,
              fields: {
                ...section.fields,
                quizzes: [
                  ...section.fields.quizzes,
                  {
                    id: `quiz-article-${nextIndex}`,
                    name: `Quiz ${nextIndex}`,
                    title: "Nouveau quiz",
                    subtitle: "Texte d'introduction du quiz.",
                    nextLabel: "Suivant",
                    resultTitle: "Votre resultat",
                    resultText: "Texte de resultat a personnaliser.",
                    cta: { label: "Recevoir une proposition", href: "/contact" },
                    questions: [
                      {
                        question: "Nouvelle question ?",
                        options: ["Option 1", "Option 2", "Option 3"],
                      },
                    ],
                  },
                ],
              },
            };
          }

          const nextBlock: ArticleBlock =
            group === "Titre"
              ? { kind: "heading", level: "h2", text: "Nouveau titre" }
              : group === "Image"
                ? {
                    kind: "image",
                    imageUrl: defaultGardenImage,
                    alt: "Image de l'article",
                  }
                : group === "Tableau"
                  ? {
                      kind: "table",
                      title: "Nouveau tableau",
                      columns: ["Colonne 1", "Colonne 2", "Colonne 3"],
                      rows: [
                        ["Valeur 1", "Valeur 2", "Valeur 3"],
                        ["Valeur 1", "Valeur 2", "Valeur 3"],
                      ],
                    }
                  : group === "Cases"
                    ? {
                        kind: "cards",
                        cards: [
                          {
                            title: "Solution 1",
                            text: "Description de la solution.",
                          },
                          {
                            title: "Solution 2",
                            text: "Description de la solution.",
                          },
                        ],
                      }
                    : group === "Bloc quiz"
                      ? {
                          kind: "quiz",
                          quizId: section.fields.quizzes[0]?.id ?? "quiz-article-default",
                        }
                      : {
                          kind: "paragraph",
                          text: "Nouveau bloc de texte.",
                        };

          return {
            ...section,
            fields: {
              ...section.fields,
              blocks: [...section.fields.blocks, nextBlock],
            },
          };
        }

        return section;
      }),
    }));
  }

  function removeRepeatableItem(group: string) {
    if (!selectedSection) return;

    const syncHubServices =
      group === "Prestations" &&
      (selectedSection.type === "services-hub-hero" ||
        selectedSection.type === "services-hub-bento");

    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: currentPage.sections.map((section) => {
        const isSyncedHubSection =
          syncHubServices &&
          (section.type === "services-hub-hero" ||
            section.type === "services-hub-bento");

        if (section.id !== selectedSection.id && !isSyncedHubSection) return section;

        if (
          (section.type === "services-hub-hero" ||
            section.type === "services-hub-bento") &&
          group === "Prestations" &&
          section.fields.services.length > 1
        ) {
          return {
            ...section,
            fields: {
              ...section.fields,
              services: section.fields.services.slice(0, -1),
            },
          } as SectionInstance;
        }

        if (
          section.type === "testimonials" &&
          section.variant === "projects-a" &&
          group === "Avis clients" &&
          section.fields.reviews.length > 1
        ) {
          return {
            ...section,
            fields: {
              ...section.fields,
              reviews: section.fields.reviews.slice(0, -1),
            },
          } as SectionInstance;
        }

        if (
          section.type === "service-areas" &&
          group === "Zones" &&
          section.fields.areas.length > 1
        ) {
          return {
            ...section,
            fields: { ...section.fields, areas: section.fields.areas.slice(0, -1) },
          };
        }

        if (
          section.type === "testimonials" &&
          section.variant === "gallery-a" &&
          group === "Avis clients" &&
          section.fields.reviews.length > 1
        ) {
          return {
            ...section,
            fields: { ...section.fields, reviews: section.fields.reviews.slice(0, -1) },
          };
        }

        if (
          section.type === "testimonials" &&
          section.variant === "gallery-a" &&
          group === "Images" &&
          section.fields.images.length > 1
        ) {
          return {
            ...section,
            fields: { ...section.fields, images: section.fields.images.slice(0, -1) },
          };
        }

        if (
          section.type === "blog-advice" &&
          group === "Articles" &&
          section.fields.posts.length > 1
        ) {
          return {
            ...section,
            fields: { ...section.fields, posts: section.fields.posts.slice(0, -1) },
          };
        }

        if (
          section.type === "faq" &&
          group === "Questions" &&
          section.fields.items.length > 1
        ) {
          return {
            ...section,
            fields: { ...section.fields, items: section.fields.items.slice(0, -1) },
          };
        }

        if (
          section.type === "blog-index" &&
          group === "Articles" &&
          section.fields.posts.length > 1
        ) {
          return {
            ...section,
            fields: { ...section.fields, posts: section.fields.posts.slice(0, -1) },
          };
        }

        if (
          section.type === "contact-section" &&
          group === "Champs formulaire" &&
          section.fields.fields.length > 1
        ) {
          return {
            ...section,
            fields: { ...section.fields, fields: section.fields.fields.slice(0, -1) },
          };
        }

        if (
          section.type === "about-story" &&
          group === "Points cles" &&
          section.fields.highlights.length > 1
        ) {
          return {
            ...section,
            fields: {
              ...section.fields,
              highlights: section.fields.highlights.slice(0, -1),
            },
          };
        }

        if (
          section.type === "article-detail" &&
          group === "Blocs article" &&
          section.fields.blocks.length > 1
        ) {
          return {
            ...section,
            fields: { ...section.fields, blocks: section.fields.blocks.slice(0, -1) },
          };
        }

        if (
          section.type === "article-detail" &&
          group === "Quiz" &&
          section.fields.quizzes.length > 1
        ) {
          const removedQuizId = section.fields.quizzes.at(-1)?.id;

          return {
            ...section,
            fields: {
              ...section.fields,
              quizzes: section.fields.quizzes.slice(0, -1),
              blocks: removedQuizId
                ? section.fields.blocks.filter(
                    (block) => block.kind !== "quiz" || block.quizId !== removedQuizId,
                  )
                : section.fields.blocks,
            },
          };
        }

        return section;
      }),
    }));
  }

  function addSection(type: SectionInstance["type"]) {
    const section = createSection(type);
    updateCurrentPage((currentPage) => ({
      ...currentPage,
      sections: [...currentPage.sections, section],
    }));
    setSelectedSectionId(section.id);
    setAddMenuOpen(false);
  }

  function deleteSection(sectionId: string) {
    updateCurrentPage((currentPage) => {
      const nextSections = currentPage.sections.filter(
        (section) => section.id !== sectionId,
      );

      if (selectedSectionId === sectionId) {
        setSelectedSectionId(nextSections[0]?.id ?? "");
      }

      return { ...currentPage, sections: nextSections };
    });
    setContextMenu(null);
  }

  function moveSectionTo(
    sectionId: string,
    targetId: string,
    position: "before" | "after",
  ) {
    if (sectionId === targetId) {
      setDropIndicator(null);
      return;
    }

    updateCurrentPage((currentPage) => {
      const from = currentPage.sections.findIndex((section) => section.id === sectionId);
      const to = currentPage.sections.findIndex((section) => section.id === targetId);

      if (from < 0 || to < 0) return currentPage;

      const nextSections = [...currentPage.sections];
      const [section] = nextSections.splice(from, 1);
      const targetIndex = nextSections.findIndex((item) => item.id === targetId);
      const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
      nextSections.splice(insertIndex, 0, section);

      return { ...currentPage, sections: nextSections };
    });
    setDropIndicator(null);
  }

  function startResize(side: "left" | "right", event: React.MouseEvent) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = side === "left" ? leftWidth : rightWidth;

    function onMove(moveEvent: MouseEvent) {
      const delta = moveEvent.clientX - startX;
      const nextWidth =
        side === "left" ? startWidth + delta : startWidth - delta;

      if (side === "left") {
        setLeftWidth(clamp(nextWidth, MIN_PANEL, MAX_PANEL));
      } else {
        setRightWidth(clamp(nextWidth, MIN_PANEL, MAX_PANEL));
      }
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startPan(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (
      !canvasRef.current ||
      !(event.button === 1 || (event.button === 0 && spacePressed)) ||
      target.closest("[data-builder-control]")
    ) {
      return;
    }

    event.preventDefault();
    panRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      left: canvasRef.current.scrollLeft,
      top: canvasRef.current.scrollTop,
    };
  }

  function panCanvas(event: React.MouseEvent<HTMLDivElement>) {
    if (!panRef.current.active || !canvasRef.current) return;

    canvasRef.current.scrollLeft =
      panRef.current.left - (event.clientX - panRef.current.x);
    canvasRef.current.scrollTop =
      panRef.current.top - (event.clientY - panRef.current.y);
  }

  function stopPan() {
    panRef.current.active = false;
  }

  function openPreview(mode = deviceMode) {
    setDeviceMode(mode);
    setPreviewSize((currentSize) => ({
      ...currentSize,
      width: devicePresets[mode].width,
    }));
    setPreviewOpen(true);
  }

  async function publishSite() {
    if (publishStatus === "publishing") return;

    setPublishStatus("publishing");
    setPublishError("");

    try {
      const [response] = await Promise.all([
        fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectName, projectKey, pages }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 700)),
      ]);
      const result = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "La publication locale a echoue.");
      }

      setPublicationUrl(new URL(result.url, window.location.origin).toString());
      setPublishStatus("published");
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "La publication locale a echoue.",
      );
      setPublishStatus("error");
    }
  }

  if (previewOpen) {
    return (
      <>
        <PreviewMode
          page={page}
          deviceMode={deviceMode}
          size={previewSize}
          publishStatus={publishStatus}
          onPublish={publishSite}
          onBack={() => setPreviewOpen(false)}
          onDeviceChange={(mode) => {
            setDeviceMode(mode);
            setPreviewSize((currentSize) => ({
              ...currentSize,
              width: devicePresets[mode].width,
            }));
          }}
          onSizeChange={(size) => {
            setPreviewSize(size);
            setDeviceMode(getDeviceModeFromWidth(size.width));
          }}
        />
        <PublishResult
          status={publishStatus}
          url={publicationUrl}
          error={publishError}
          onClose={() => setPublishStatus("idle")}
        />
      </>
    );
  }

  return (
    <main
      className="grid h-screen overflow-hidden bg-[#f6f6f6] font-[var(--font-inter)] text-[#151515]"
      style={{
        gridTemplateRows: "48px minmax(0, 1fr)",
        gridTemplateColumns: `${leftWidth}px 6px minmax(0, 1fr) 6px ${rightWidth}px`,
      }}
      onClick={() => setContextMenu(null)}
    >
      <TopBar
        projectName={projectName}
        publishStatus={publishStatus}
        onPublish={publishSite}
        onPreview={() => openPreview()}
      />

      <LeftPanel
        pages={pages}
        activePageId={page.id}
        sections={page.sections}
        selectedSectionId={selectedSectionId}
        activeTab={activeLeftTab}
        addMenuOpen={addMenuOpen}
        draggedSectionId={draggedSectionId}
        dropIndicator={dropIndicator}
        contextMenu={contextMenu}
        onTabChange={setActiveLeftTab}
        onSelectPage={selectPage}
        onSelect={setSelectedSectionId}
        onAddMenuToggle={() => setAddMenuOpen((open) => !open)}
        onAddSection={addSection}
        onContextMenu={setContextMenu}
        onDelete={deleteSection}
        onDragStart={(id) => {
          draggedSectionIdRef.current = id;
          setDraggedSectionId(id);
          setSelectedSectionId(id);
        }}
        onDragEnd={() => {
          draggedSectionIdRef.current = null;
          setDraggedSectionId(null);
          setDropIndicator(null);
        }}
        onDragOverSection={(id, position) => {
          setDropIndicator({ sectionId: id, position });
        }}
        onDropOn={(id, position) => {
          if (draggedSectionIdRef.current) {
            moveSectionTo(draggedSectionIdRef.current, id, position);
            draggedSectionIdRef.current = null;
            setDraggedSectionId(null);
          }
        }}
      />

      <ResizeHandle onMouseDown={(event) => startResize("left", event)} />

      <section
        ref={canvasRef}
        onMouseDown={startPan}
        onMouseMove={panCanvas}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        className={`builder-canvas relative row-start-2 overflow-auto border-x border-[#e5e5e5] bg-[#f4f4f4] ${
          spacePressed ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
      >
        <div className="relative h-[2800px] w-[3600px]">
          <div
            ref={zoomContentRef}
            className="absolute left-[180px] top-[86px] flex origin-top-left items-start gap-12"
            style={{
              transform: `scale(${zoom})`,
            }}
          >
            {(Object.keys(devicePresets) as DeviceMode[]).map((mode) => (
              <DeviceFrame
                key={mode}
                mode={mode}
                page={page}
                selected={deviceMode === mode}
                selectedSectionId={selectedSectionId}
                onSelectDevice={setDeviceMode}
                onPreview={openPreview}
                onSelectSection={setSelectedSectionId}
                onTextChange={updateSection}
              />
            ))}
          </div>
        </div>
      </section>

      <ResizeHandle onMouseDown={(event) => startResize("right", event)} />

      <RightPanel
        section={selectedSection}
        onChange={updateSelectedSection}
        onVariantChange={changeSectionVariant}
        onAddSocialProofStat={addSocialProofStat}
        onRemoveSocialProofStat={removeSocialProofStat}
        onAddRecentProjectCity={addRecentProjectCity}
        onAddRecentProject={addRecentProject}
        onRemoveRecentProject={removeRecentProject}
        onAddWorkMethodStep={addWorkMethodStep}
        onRemoveWorkMethodStep={removeWorkMethodStep}
        onAddRepeatableItem={addRepeatableItem}
        onRemoveRepeatableItem={removeRepeatableItem}
      />
      <PublishResult
        status={publishStatus}
        url={publicationUrl}
        error={publishError}
        onClose={() => setPublishStatus("idle")}
      />
    </main>
  );
}

function TopBar({
  projectName,
  onPreview,
  onPublish,
  publishStatus,
}: {
  projectName: string;
  onPreview: () => void;
  onPublish: () => void;
  publishStatus: PublishStatus;
}) {
  return (
    <header className="col-span-5 grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#e8e8e8] bg-white px-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-[8px] bg-white px-2 text-[12px] font-semibold text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.08)]"
          aria-label="Retour au dashboard"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#f6f6f6] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
            <ArrowLeft size={13} />
          </span>
          Retour
        </button>
      </div>

      <div className="text-center text-[12px] font-semibold text-[#1f1f1f]">
        {projectName}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#f3f3f3] text-[#222222] hover:bg-[#eeeeee]"
          aria-label="Preview"
        >
          <Play size={15} fill="currentColor" />
        </button>
        <PublishButton status={publishStatus} onClick={onPublish} />
      </div>
    </header>
  );
}

function PublishButton({
  status,
  onClick,
}: {
  status: PublishStatus;
  onClick: () => void;
}) {
  const publishing = status === "publishing";
  const published = status === "published";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={publishing}
      className="flex h-9 w-[141px] items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(180deg,#323232_0%,#222222_100%)] px-5 py-2 text-center text-[14px] font-semibold leading-5 tracking-[-0.02em] text-[#fcfcfc] shadow-[0_2px_4px_-1px_rgba(13,13,13,0.5),0_0_0_1px_#333333,inset_0_0.5px_1px_rgba(255,255,255,0.15),inset_0_-1px_1.2px_0.35px_#121212] transition hover:brightness-110 disabled:cursor-wait"
    >
      {publishing ? (
        <LoaderCircle size={16} className="animate-spin" />
      ) : published ? (
        <CheckCircle2 size={16} className="text-[#00d494]" />
      ) : (
        <CloudUpload size={16} />
      )}
      {publishing ? "Publication..." : published ? "Publie" : "Publier"}
    </button>
  );
}

function PublishResult({
  status,
  url,
  error,
  onClose,
}: {
  status: PublishStatus;
  url: string;
  error: string;
  onClose: () => void;
}) {
  if (status !== "published" && status !== "error") return null;

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[100] w-[390px] max-w-[calc(100vw-40px)] rounded-[16px] border border-black/10 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
              status === "published"
                ? "bg-[#e7fbf4] text-[#007f5d]"
                : "bg-red-50 text-red-600"
            }`}
          >
            {status === "published" ? (
              <CheckCircle2 size={20} />
            ) : (
              <X size={20} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#151515]">
              {status === "published" ? "Site publie localement" : "Echec de publication"}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[#6b6b6b]">
              {status === "published"
                ? "Votre lien est pret. Une nouvelle publication remplacera cette version."
                : error}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[#777777] hover:bg-[#f3f3f3]"
          aria-label="Fermer"
        >
          <X size={15} />
        </button>
      </div>

      {status === "published" && url ? (
        <div className="mt-4 flex items-center gap-2 rounded-[10px] bg-[#f3f3f3] p-2 pl-3">
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#333333]">
            {url}
          </span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(url)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-[#333333] shadow-sm"
            aria-label="Copier le lien"
          >
            <Copy size={14} />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#222222] text-white"
            aria-label="Ouvrir le site publie"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

function DeviceFrame({
  mode,
  page,
  selected,
  selectedSectionId,
  onSelectDevice,
  onPreview,
  onSelectSection,
  onTextChange,
}: {
  mode: DeviceMode;
  page: SitePage;
  selected: boolean;
  selectedSectionId: string;
  onSelectDevice: (mode: DeviceMode) => void;
  onPreview: (mode: DeviceMode) => void;
  onSelectSection: (id: string) => void;
  onTextChange: (sectionId: string, path: Path, value: string) => void;
}) {
  const preset = devicePresets[mode];
  const Icon = preset.icon;

  return (
    <div className="shrink-0">
      <button
        type="button"
        onMouseDown={() => onSelectDevice(mode)}
        onClick={() => onSelectDevice(mode)}
        className="mb-5 flex h-9 items-center justify-between rounded-[10px] border border-[#dedede] bg-[#eeeeee] px-2 text-[16px] font-semibold text-[#a4a4a4] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
        style={{ width: preset.width }}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] border border-[#d0d0d0] bg-[#e3e3e3]">
            <Icon size={15} />
          </span>
          {preset.label}
        </span>
        <span>{preset.range}</span>
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onPreview(mode);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onPreview(mode);
            }
          }}
          className="ml-3 flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#dcdcdc] text-[#888888]"
          aria-label={`Preview ${preset.label}`}
        >
          <Play size={13} fill="currentColor" />
        </span>
      </button>

      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectDevice(mode)}
        onClickCapture={(event) => {
          const target = event.target as HTMLElement;

          if (target.closest("a")) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            onSelectDevice(mode);
          }
        }}
        className={`relative overflow-hidden bg-white shadow-sm transition ring-inset ${
          selected ? "ring-4 ring-[#0099ff]" : "ring-1 ring-black/8"
        }`}
        style={
          {
            width: preset.width,
            minHeight: preset.minHeight,
            "--site-hero-height": `${Math.round(preset.viewportHeight * 0.95)}px`,
          } as React.CSSProperties
        }
      >
        <main className={`site-viewport-${mode} min-h-screen bg-white text-[#0f1112]`}>
          {page.sections.map((section) => (
            <SectionCanvasFrame
              key={`${mode}-${section.id}`}
              section={section}
              viewport={mode}
              selected={selected && selectedSectionId === section.id}
              onSelect={onSelectSection}
              onTextChange={(path, value) => onTextChange(section.id, path, value)}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

function PreviewMode({
  page,
  deviceMode,
  size,
  publishStatus,
  onPublish,
  onBack,
  onDeviceChange,
  onSizeChange,
}: {
  page: SitePage;
  deviceMode: DeviceMode;
  size: { width: number; height: number };
  publishStatus: PublishStatus;
  onPublish: () => void;
  onBack: () => void;
  onDeviceChange: (mode: DeviceMode) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (fullscreen) {
    return (
      <main className="fixed inset-0 z-50 bg-white font-[var(--font-inter)]">
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="fixed left-3 top-3 z-[60] flex h-8 items-center gap-2 rounded-[8px] bg-white px-3 text-[14px] font-semibold text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.08)]"
        >
          <ArrowLeft size={15} />
          Retour
        </button>
        <IframePreview
          key={`fullscreen-${refreshKey}`}
          page={page}
          size={{ width: window.innerWidth, height: window.innerHeight }}
          fullscreen
        />
      </main>
    );
  }

  return (
    <main className="grid h-screen grid-rows-[48px_minmax(0,1fr)] overflow-hidden bg-[#ededed] font-[var(--font-inter)] text-[#151515]">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#e2e2e2] bg-white px-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 items-center gap-2 rounded-[8px] bg-white px-3 text-[14px] font-semibold text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.08)]"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <button
            type="button"
            onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#9a9a9a] hover:bg-[#f3f3f3]"
            aria-label="Recharger"
          >
            <RotateCw size={18} />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#9a9a9a] hover:bg-[#f3f3f3]"
            aria-label="Agrandir"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex h-8 items-center gap-2 rounded-[8px] bg-[#f3f3f3] px-3 text-[12px] font-semibold text-[#333333]">
            <select
              value={deviceMode}
              onChange={(event) =>
                onDeviceChange(event.target.value as DeviceMode)
              }
              className="bg-transparent outline-none"
            >
              {(Object.keys(devicePresets) as DeviceMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {devicePresets[mode].label}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="W"
            value={size.width}
            min={1}
            max={3000}
            onChange={(width) => onSizeChange({ ...size, width })}
          />
          <NumberField
            label="H"
            value={size.height}
            min={1}
            max={3000}
            onChange={(height) => onSizeChange({ ...size, height })}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#f3f3f3] text-[#222222] hover:bg-[#eeeeee]"
            aria-label="Preview"
          >
            <Play size={15} fill="currentColor" />
          </button>
          <PublishButton status={publishStatus} onClick={onPublish} />
        </div>
      </header>

      <section className="overflow-auto p-8">
        <IframePreview key={refreshKey} page={page} size={size} />
      </section>
    </main>
  );
}

function IframePreview({
  page,
  size,
  fullscreen = false,
}: {
  page: SitePage;
  size: { width: number; height: number };
  fullscreen?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    const document = iframe?.contentDocument;

    if (!iframe || !document) {
      return;
    }

    document.open();
    document.write(
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="preview-root"></div></body></html>',
    );
    document.close();

    Array.from(window.document.querySelectorAll('link[rel="stylesheet"], style')).forEach(
      (node) => {
        document.head.appendChild(node.cloneNode(true));
      },
    );

    document.documentElement.className = window.document.documentElement.className;
    document.body.className = window.document.body.className;
    document.body.style.margin = "0";
    document.body.style.background = "#ffffff";
    setMountNode(document.getElementById("preview-root"));
  }, [size.width, size.height]);

  return (
    <>
      <iframe
        ref={iframeRef}
        title="Preview du site"
        className={
          fullscreen
            ? "block bg-white"
            : "mx-auto block bg-white shadow-sm ring-1 ring-black/10"
        }
        style={{ width: size.width, height: size.height }}
      />
      {mountNode
        ? createPortal(
            <main className="min-h-screen bg-white text-[#0f1112]">
              {page.sections.map((section) => (
                <div key={section.id}>{renderSection(section)}</div>
              ))}
            </main>,
            mountNode,
          )
        : null}
    </>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex h-8 items-center gap-2 rounded-[8px] bg-[#f3f3f3] px-3 text-[12px] font-semibold text-[#a0a0a0]">
      <input
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;

          if (nextValue === "") {
            return;
          }

          const numericValue = Number(nextValue);

          if (!Number.isNaN(numericValue)) {
            onChange(clamp(numericValue, min, max));
          }
        }}
        onFocus={(event) => event.currentTarget.select()}
        className="w-20 bg-transparent text-[14px] font-semibold text-[#333333] outline-none"
      />
      {label}
    </label>
  );
}

function ResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (event: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label="Redimensionner le panneau"
      onMouseDown={onMouseDown}
      className="z-20 row-start-2 -mx-1 w-2 cursor-col-resize bg-transparent hover:bg-[#0099ff]/20"
    />
  );
}

function LeftPanel({
  pages,
  activePageId,
  sections,
  selectedSectionId,
  activeTab,
  addMenuOpen,
  draggedSectionId,
  dropIndicator,
  contextMenu,
  onTabChange,
  onSelectPage,
  onSelect,
  onAddMenuToggle,
  onAddSection,
  onContextMenu,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOverSection,
  onDropOn,
}: {
  pages: SitePage[];
  activePageId: string;
  sections: SectionInstance[];
  selectedSectionId: string;
  activeTab: LeftTab;
  addMenuOpen: boolean;
  draggedSectionId: string | null;
  dropIndicator: DropIndicator;
  contextMenu: { sectionId: string; x: number; y: number } | null;
  onTabChange: (tab: LeftTab) => void;
  onSelectPage: (pageId: string) => void;
  onSelect: (id: string) => void;
  onAddMenuToggle: () => void;
  onAddSection: (type: SectionInstance["type"]) => void;
  onContextMenu: (menu: { sectionId: string; x: number; y: number } | null) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOverSection: (id: string, position: "before" | "after") => void;
  onDropOn: (id: string, position: "before" | "after") => void;
}) {
  const [blogOpen, setBlogOpen] = useState(true);
  const [realisationsOpen, setRealisationsOpen] = useState(true);
  const [prestationsOpen, setPrestationsOpen] = useState(true);
  const blogPage = pages.find((sitePage) => sitePage.slug === "/blog");
  const realisationsPage = pages.find((sitePage) => sitePage.slug === "/realisations");
  const prestationsPage = pages.find((sitePage) => sitePage.slug === "/prestations");
  const articlePages = pages.filter(
    (sitePage) => sitePage.slug.startsWith("/blog/") && sitePage.slug !== "/blog",
  );
  const realisationPages = pages.filter(
    (sitePage) =>
      sitePage.slug.startsWith("/realisations/") && sitePage.slug !== "/realisations",
  );
  const prestationPages = pages.filter(
    (sitePage) =>
      sitePage.slug.startsWith("/prestations/") && sitePage.slug !== "/prestations",
  );
  const blogIndexSection = blogPage?.sections.find(
    (section) => section.type === "blog-index",
  );
  const realisationsIndexSection = realisationsPage?.sections.find(
    (section) => section.type === "realisations-page",
  );
  const prestationsIndexSection = prestationsPage?.sections.find(
    (section) => section.type === "services-hub-bento",
  );
  const articleCount =
    blogIndexSection && blogIndexSection.type === "blog-index"
      ? blogIndexSection.fields.posts.length
      : articlePages.length;
  const realisationCount =
    realisationsIndexSection && realisationsIndexSection.type === "realisations-page"
      ? realisationsIndexSection.fields.projects.length
      : realisationPages.length;
  const prestationCount =
    prestationsIndexSection && prestationsIndexSection.type === "services-hub-bento"
      ? prestationsIndexSection.fields.services.length
      : prestationPages.length;
  const activePage = pages.find((sitePage) => sitePage.id === activePageId);
  const articlePageActive =
    activePage?.slug.startsWith("/blog/") && activePage.slug !== "/blog";
  const realisationPageActive =
    activePage?.slug.startsWith("/realisations/") &&
    activePage.slug !== "/realisations";
  const prestationPageActive =
    activePage?.slug.startsWith("/prestations/") &&
    activePage.slug !== "/prestations";
  const firstArticlePageId = articlePages[0]?.id;
  const firstRealisationPageId = realisationPages[0]?.id;
  const firstPrestationPageId = prestationPages[0]?.id;

  return (
    <aside className="relative row-start-2 bg-white px-5 py-5">
      <div className="flex items-center gap-2 border-b border-[#eeeeee] pb-3">
        <button
          type="button"
          onClick={() => onTabChange("pages")}
          className={`rounded-[9px] px-3 py-2 text-[12px] font-semibold ${
            activeTab === "pages" ? "bg-[#f3f3f3] text-[#111111]" : "text-[#666666]"
          }`}
        >
          Pages
        </button>
        <button
          type="button"
          onClick={() => onTabChange("sections")}
          className={`rounded-[9px] px-3 py-2 text-[12px] font-semibold ${
            activeTab === "sections" ? "bg-[#f3f3f3] text-[#111111]" : "text-[#666666]"
          }`}
        >
          Sections
        </button>
      </div>

      <label className="mt-3 flex h-10 items-center gap-2 rounded-[10px] bg-[#f3f3f3] px-3 text-[12px] font-medium text-[#666666]">
        <Search size={14} />
        <input
          placeholder="Search..."
          className="w-full bg-transparent outline-none placeholder:text-[#999999]"
        />
      </label>

      <div className="mt-4 border-t border-[#eeeeee] pt-4">
        <div className="flex items-center justify-between text-[12px] font-semibold text-[#111111]">
          <span>{activeTab === "pages" ? "Pages" : "Sections"}</span>
          <div className="relative">
            <button
              type="button"
              onClick={onAddMenuToggle}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] hover:bg-[#f3f3f3]"
              aria-label="Ajouter une section"
            >
              <Plus size={16} />
            </button>
            {addMenuOpen ? (
              <AddSectionMenu onAddSection={onAddSection} />
            ) : null}
          </div>
        </div>

        {activeTab === "pages" ? (
          <div className="mt-3 grid gap-1 text-[12px] font-medium">
            {pages
              .filter(
                (sitePage) =>
                  !(sitePage.slug.startsWith("/blog/") && sitePage.slug !== "/blog") &&
                  !(
                    sitePage.slug.startsWith("/realisations/") &&
                    sitePage.slug !== "/realisations"
                  ) &&
                  !(
                    sitePage.slug.startsWith("/prestations/") &&
                    sitePage.slug !== "/prestations"
                  ),
              )
              .map((sitePage) => {
              const hasArticles = sitePage.slug === "/blog";
              const hasRealisations = sitePage.slug === "/realisations";
              const hasPrestations = sitePage.slug === "/prestations";
              const active =
                activePageId === sitePage.id ||
                (hasArticles && articlePageActive) ||
                (hasRealisations && realisationPageActive) ||
                (hasPrestations && prestationPageActive);
              const Icon = sitePage.slug === "/" ? Home : FileText;

              return (
                <div key={sitePage.id} className="grid gap-1">
                  <div
                    className={`flex h-9 items-center gap-1 rounded-[10px] px-2 ${
                      active
                        ? "bg-[#f3f3f3] font-semibold text-[#111111]"
                        : "text-[#666666] hover:bg-[#f8f8f8]"
                    }`}
                  >
                    {hasArticles || hasRealisations || hasPrestations ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (hasArticles) {
                            setBlogOpen((current) => !current);
                          } else if (hasRealisations) {
                            setRealisationsOpen((current) => !current);
                          } else {
                            setPrestationsOpen((current) => !current);
                          }
                        }}
                        className="flex h-6 w-5 items-center justify-center rounded hover:bg-black/5"
                        aria-label={
                          hasArticles
                            ? blogOpen
                              ? "Replier les articles"
                              : "Deplier les articles"
                            : hasRealisations
                              ? realisationsOpen
                                ? "Replier les etudes de cas"
                                : "Deplier les etudes de cas"
                              : prestationsOpen
                                ? "Replier les prestations"
                                : "Deplier les prestations"
                        }
                      >
                        <ChevronDown
                          size={14}
                          className={`transition ${
                            hasArticles
                              ? blogOpen
                                ? ""
                                : "-rotate-90"
                              : hasRealisations
                                ? realisationsOpen
                                  ? ""
                                  : "-rotate-90"
                                : prestationsOpen
                                  ? ""
                                  : "-rotate-90"
                          }`}
                        />
                      </button>
                    ) : (
                      <span className="w-5" />
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectPage(sitePage.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <Icon size={15} className="shrink-0" />
                      <span className="truncate">
                        {sitePage.slug === "/" ? sitePage.title : sitePage.slug}
                      </span>
                    </button>
                  </div>

                  {hasArticles && blogOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (firstArticlePageId) {
                          onSelectPage(firstArticlePageId);
                        }
                      }}
                      className={`ml-8 flex h-8 items-center justify-between gap-2 rounded-[10px] px-3 text-left ${
                        articlePageActive
                          ? "bg-[#f3f3f3] font-semibold text-[#111111]"
                          : "text-[#666666] hover:bg-[#f8f8f8]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Database size={14} className="shrink-0" />
                        <span className="truncate">articles</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-[#999999]">
                        {articleCount}
                      </span>
                    </button>
                  ) : null}

                  {hasRealisations && realisationsOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (firstRealisationPageId) {
                          onSelectPage(firstRealisationPageId);
                        }
                      }}
                      className={`ml-8 flex h-8 items-center justify-between gap-2 rounded-[10px] px-3 text-left ${
                        realisationPageActive
                          ? "bg-[#f3f3f3] font-semibold text-[#111111]"
                          : "text-[#666666] hover:bg-[#f8f8f8]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Database size={14} className="shrink-0" />
                        <span className="truncate">etudes de cas</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-[#999999]">
                        {realisationCount}
                      </span>
                    </button>
                  ) : null}

                  {hasPrestations && prestationsOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (firstPrestationPageId) {
                          onSelectPage(firstPrestationPageId);
                        }
                      }}
                      className={`ml-8 flex h-8 items-center justify-between gap-2 rounded-[10px] px-3 text-left ${
                        prestationPageActive
                          ? "bg-[#f3f3f3] font-semibold text-[#111111]"
                          : "text-[#666666] hover:bg-[#f8f8f8]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Database size={14} className="shrink-0" />
                        <span className="truncate">prestations</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-[#999999]">
                        {prestationCount}
                      </span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 grid gap-1 text-[12px] font-medium">
            {sections.map((section) => (
              <LayerButton
                key={section.id}
                section={section}
                selected={selectedSectionId === section.id}
                dragging={draggedSectionId === section.id}
                dropPosition={
                  dropIndicator?.sectionId === section.id
                    ? dropIndicator.position
                    : null
                }
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOverSection={onDragOverSection}
                onDropOn={onDropOn}
              />
            ))}
          </div>
        )}
      </div>

      {contextMenu ? (
        <div
          className="absolute z-50 w-44 rounded-[10px] border border-[#eeeeee] bg-white p-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          data-builder-control
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onDelete(contextMenu.sectionId)}
            className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12px] font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
            Supprimer
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function AddSectionMenu({
  onAddSection,
}: {
  onAddSection: (type: SectionInstance["type"]) => void;
}) {
  const options: Array<{ type: SectionInstance["type"]; label: string }> = [
    { type: "site-header", label: "Navigation" },
    { type: "hero", label: "Hero section" },
    { type: "social-proof", label: "Preuves sociales" },
    { type: "services", label: "Prestations" },
    { type: "services-centered", label: "Prestations centrees" },
    { type: "services-hub-hero", label: "Hero hub prestations" },
    { type: "services-hub-bento", label: "Bento prestations" },
    { type: "recent-projects", label: "Realisations" },
    { type: "work-method", label: "Methode de travail" },
    { type: "service-areas", label: "Zones d'intervention" },
    { type: "testimonials", label: "Avis clients" },
    { type: "blog-advice", label: "Conseils" },
    { type: "blog-index", label: "Liste articles" },
    { type: "article-detail", label: "Article" },
    { type: "sector-hero", label: "Hero secteur" },
    { type: "sector-services", label: "Prestations secteur" },
    { type: "sector-benefits", label: "Benefices secteur" },
    { type: "lead-qualifier", label: "Questionnaire" },
    { type: "sector-extra-services", label: "Services supplementaires" },
    { type: "about-hero", label: "Hero A propos" },
    { type: "about-story", label: "Histoire de l'entreprise" },
    { type: "realisations-page", label: "Page realisations" },
    { type: "realisation-detail", label: "Realisation precise" },
    { type: "contact-section", label: "Contact" },
    { type: "faq", label: "FAQ" },
    { type: "site-footer", label: "Footer" },
  ];

  return (
    <div
      className="absolute right-0 top-9 z-40 w-52 rounded-[10px] border border-[#eeeeee] bg-white p-1 shadow-xl"
      data-builder-control
    >
      {options.map((option) => (
        <button
          key={option.type}
          type="button"
          onClick={() => onAddSection(option.type)}
          className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12px] font-medium hover:bg-[#f3f3f3]"
        >
          <Layers3 size={14} />
          {option.label}
        </button>
      ))}
    </div>
  );
}

function LayerButton({
  section,
  selected,
  dragging,
  dropPosition,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOverSection,
  onDropOn,
}: {
  section: SectionInstance;
  selected: boolean;
  dragging: boolean;
  dropPosition: "before" | "after" | null;
  onSelect: (id: string) => void;
  onContextMenu: (menu: { sectionId: string; x: number; y: number }) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOverSection: (id: string, position: "before" | "after") => void;
  onDropOn: (id: string, position: "before" | "after") => void;
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const position =
          event.clientY - rect.top > rect.height / 2 ? "after" : "before";
        onDragOverSection(section.id, position);
      }}
      onDrop={(event) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const position =
          event.clientY - rect.top > rect.height / 2 ? "after" : "before";
        onDropOn(section.id, position);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu({
          sectionId: section.id,
          x: event.nativeEvent.offsetX + 16,
          y: event.currentTarget.offsetTop + event.currentTarget.offsetHeight - 2,
        });
      }}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart(section.id);
      }}
      onDragEnd={onDragEnd}
      className={`group relative flex min-h-9 items-center gap-2 rounded-[8px] px-2 transition-all duration-150 ${
        selected || dragging
          ? "bg-[#0099ff]/20 font-semibold text-[#0a3a58]"
          : "text-[#666666] hover:bg-[#f8f8f8]"
      }`}
      data-builder-control
    >
      {dropPosition === "before" ? (
        <span className="absolute -top-[3px] left-2 right-2 h-[2px] rounded-full bg-[#0099ff]" />
      ) : null}
      {dropPosition === "after" ? (
        <span className="absolute -bottom-[3px] left-2 right-2 h-[2px] rounded-full bg-[#0099ff]" />
      ) : null}
      <Layers3
        size={14}
        className="text-[#0099ff]"
      />
      <button
        type="button"
        onClick={() => onSelect(section.id)}
        className="min-w-0 flex-1 py-2 text-left"
      >
        <span className="truncate">{sectionLabels[section.type]}</span>
      </button>
    </div>
  );
}

function SectionCanvasFrame({
  section,
  viewport,
  selected,
  onSelect,
  onTextChange,
}: {
  section: SectionInstance;
  viewport?: DeviceMode;
  selected: boolean;
  onSelect: (id: string) => void;
  onTextChange: (path: Path, value: string) => void;
}) {
  const header = section.type === "site-header";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(section.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect(section.id);
        }
      }}
      className={`group ${header ? "absolute inset-x-0 top-0 z-40 h-20" : "relative"}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-50 ${
          selected
            ? "ring-4 ring-inset ring-[#0099ff]"
            : "ring-0 group-hover:ring-4 group-hover:ring-inset group-hover:ring-black/20"
        }`}
      />
      {renderSection(section, {
        editable: selected,
        disableLinks: true,
        viewport,
        onTextChange,
        onTextFocus: () => onSelect(section.id),
      })}
    </div>
  );
}

function RightPanel({
  section,
  onChange,
  onVariantChange,
  onAddSocialProofStat,
  onRemoveSocialProofStat,
  onAddRecentProjectCity,
  onAddRecentProject,
  onRemoveRecentProject,
  onAddWorkMethodStep,
  onRemoveWorkMethodStep,
  onAddRepeatableItem,
  onRemoveRepeatableItem,
}: {
  section?: SectionInstance;
  onChange: (path: Path, value: string) => void;
  onVariantChange: (sectionId: string, variant: string) => void;
  onAddSocialProofStat: () => void;
  onRemoveSocialProofStat: () => void;
  onAddRecentProjectCity: () => void;
  onAddRecentProject: () => void;
  onRemoveRecentProject: (projectIndex: number) => void;
  onAddWorkMethodStep: () => void;
  onRemoveWorkMethodStep: () => void;
  onAddRepeatableItem: (group: string) => void;
  onRemoveRepeatableItem: (group: string) => void;
}) {
  if (!section) {
    return <aside className="row-start-2 bg-white p-5" />;
  }

  return (
    <aside className="row-start-2 overflow-y-auto bg-white px-5 py-5">
      <div className="border-b border-[#eeeeee] pb-3">
        <h1 className="text-[12px] font-semibold text-[#111111]">
          {sectionLabels[section.type]}
        </h1>
      </div>

      <VariantSelector section={section} onVariantChange={onVariantChange} />
      <SectionEditor
        section={section}
        onChange={onChange}
        onAddSocialProofStat={onAddSocialProofStat}
        onRemoveSocialProofStat={onRemoveSocialProofStat}
        onAddRecentProjectCity={onAddRecentProjectCity}
        onAddRecentProject={onAddRecentProject}
        onRemoveRecentProject={onRemoveRecentProject}
        onAddWorkMethodStep={onAddWorkMethodStep}
        onRemoveWorkMethodStep={onRemoveWorkMethodStep}
        onAddRepeatableItem={onAddRepeatableItem}
        onRemoveRepeatableItem={onRemoveRepeatableItem}
      />
    </aside>
  );
}

const variantOptions: Partial<
  Record<SectionInstance["type"], Array<{ value: string; label: string }>>
> = {
  testimonials: [
    { value: "gallery-a", label: "Mosaique photos" },
    { value: "projects-a", label: "Cartes realisations" },
  ],
  "contact-section": [
    { value: "form-a", label: "Encart contact" },
    { value: "page-a", label: "Page contact" },
  ],
  "site-header": [
    { value: "glass-a", label: "Navigation transparente" },
    { value: "light-a", label: "Navigation claire" },
  ],
};

function VariantSelector({
  section,
  onVariantChange,
}: {
  section: SectionInstance;
  onVariantChange: (sectionId: string, variant: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const options =
    variantOptions[section.type] ?? [
      { value: section.variant, label: section.variant },
    ];
  const currentLabel =
    options.find((option) => option.value === section.variant)?.label ??
    section.variant;

  return (
    <div className="mt-4 rounded-[10px] border border-[#eeeeee] p-3">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <span>
          <span className="block text-[11px] font-medium text-[#999999]">Variante</span>
          <span className="mt-1 block text-[12px] font-semibold text-[#222222]">
            {currentLabel}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && options.length > 1 ? (
        <div className="mt-3 grid gap-1 border-t border-[#eeeeee] pt-3">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onVariantChange(section.id, option.value);
                setExpanded(false);
              }}
              className={`flex h-9 items-center justify-between rounded-[8px] px-3 text-left text-[12px] font-semibold transition ${
                option.value === section.variant
                  ? "bg-[#111111] text-white"
                  : "bg-[#f3f3f3] text-[#333333] hover:bg-[#e9e9e9]"
              }`}
            >
              {option.label}
              <span
                className={`h-2 w-2 rounded-full ${
                  option.value === section.variant ? "bg-[#00d494]" : "bg-black/15"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative mt-3 h-24 overflow-hidden rounded-[8px] bg-black">
        <div
          className="pointer-events-none origin-top-left"
          style={{
            width: 600,
            transform: "scale(0.42)",
          }}
        >
          {renderSection(section)}
        </div>
        <div className="absolute bottom-2 left-2 rounded bg-black/45 px-2 py-1 text-[11px] font-semibold text-white">
          {section.type} / {section.variant}
        </div>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onAddSocialProofStat,
  onRemoveSocialProofStat,
  onAddRecentProjectCity,
  onAddRecentProject,
  onRemoveRecentProject,
  onAddWorkMethodStep,
  onRemoveWorkMethodStep,
  onAddRepeatableItem,
  onRemoveRepeatableItem,
}: {
  section: SectionInstance;
  onChange: (path: Path, value: string) => void;
  onAddSocialProofStat: () => void;
  onRemoveSocialProofStat: () => void;
  onAddRecentProjectCity: () => void;
  onAddRecentProject: () => void;
  onRemoveRecentProject: (projectIndex: number) => void;
  onAddWorkMethodStep: () => void;
  onRemoveWorkMethodStep: () => void;
  onAddRepeatableItem: (group: string) => void;
  onRemoveRepeatableItem: (group: string) => void;
}) {
  const [projectMenu, setProjectMenu] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);
  const groups = groupPaths(getEditableStringPaths(section.fields));

  if (section.type === "recent-projects") {
    return (
      <div className="mt-2" onClick={() => setProjectMenu(null)}>
        <div className="border-t border-[#eeeeee] py-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[12px] font-semibold text-[#111111]">Villes</h2>
            <button
              type="button"
              onClick={onAddRecentProjectCity}
              disabled={section.fields.cities.length >= 8}
              className="flex h-7 items-center gap-1 rounded-[8px] px-2 text-[11px] font-semibold text-[#666666] hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus size={13} />
              Ville
            </button>
          </div>
          <div className="grid gap-2">
            {section.fields.cities.map((city, index) => (
              <label
                key={`${city}-${index}`}
                className="grid grid-cols-[98px_minmax(0,1fr)] items-start gap-3"
              >
                <span className="pt-2.5 text-[12px] font-medium leading-4 text-[#666666]">
                  Ville {index + 1}
                </span>
                <input
                  value={city}
                  onChange={(event) => {
                    const nextCity = event.target.value;
                    onChange(["cities", index], nextCity);
                    section.fields.projects.forEach((project, projectIndex) => {
                      if (project.city === city) {
                        onChange(["projects", projectIndex, "city"], nextCity);
                      }
                    });
                  }}
                  className="h-10 rounded-[10px] border-0 bg-[#f3f3f3] px-3 text-[12px] font-medium text-[#111111] outline-none transition focus:bg-[#eeeeee]"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-[#eeeeee] py-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-[#111111]">
              Realisations
            </h2>
          </div>
          <button
            type="button"
            onClick={onAddRecentProject}
            className="mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-[#f3f3f3] text-[12px] font-semibold text-[#111111] transition hover:bg-[#eeeeee]"
          >
            <Plus size={15} />
            Ajouter
          </button>

          <div className="relative grid gap-3">
            {section.fields.projects.map((project, projectIndex) => (
              <div
                key={`${project.imageUrl}-${projectIndex}`}
                className="rounded-[10px] border border-[#eeeeee] p-3"
                onContextMenu={(event) => {
                  event.preventDefault();
                  setProjectMenu({
                    index: projectIndex,
                    x: event.nativeEvent.offsetX + 8,
                    y: event.currentTarget.offsetTop + 8,
                  });
                }}
              >
                <div className="mb-3 text-[12px] font-semibold text-[#111111]">
                  Realisation {projectIndex + 1}
                </div>
                <div className="grid gap-2">
                  <label className="grid grid-cols-[98px_minmax(0,1fr)] items-start gap-3">
                    <span className="pt-2.5 text-[12px] font-medium leading-4 text-[#666666]">
                      Ville
                    </span>
                    <select
                      value={project.city}
                      onChange={(event) =>
                        onChange(["projects", projectIndex, "city"], event.target.value)
                      }
                      className="h-10 rounded-[10px] border-0 bg-[#f3f3f3] px-3 text-[12px] font-medium text-[#111111] outline-none transition focus:bg-[#eeeeee]"
                    >
                      {section.fields.cities.map((city, cityIndex) => (
                        <option key={`${city}-${cityIndex}`} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(["imageUrl", "alt", "compareEnabled", "beforeImageUrl", "afterImageUrl"] as const).map((key) => {
                    const path: Path = ["projects", projectIndex, key];
                    const inputValue = String(project[key] ?? "");
                    const booleanToggle = key === "compareEnabled";
                    const multiline = inputValue.length > 74;

                    return (
                      <label
                        key={key}
                        className="grid grid-cols-[98px_minmax(0,1fr)] items-start gap-3"
                      >
                        <span className="pt-2.5 text-[12px] font-medium leading-4 text-[#666666]">
                          {pathLabel([key])}
                        </span>
                        {booleanToggle ? (
                          <div className="flex h-10 rounded-[10px] bg-[#f3f3f3] p-1 text-[12px] font-semibold">
                            {[
                              { label: "Oui", value: "oui" },
                              { label: "Non", value: "non" },
                            ].map((option) => {
                              const active =
                                inputValue.trim().toLowerCase() === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => onChange(path, option.value)}
                                  className={`flex flex-1 items-center justify-center rounded-[8px] transition ${
                                    active
                                      ? "bg-white text-[#007aff] shadow-[0_1px_3px_rgba(0,0,0,0.16),0_1px_1px_rgba(0,0,0,0.08)]"
                                      : "text-[#8c8c8c]"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : multiline ? (
                          <textarea
                            value={inputValue}
                            onChange={(event) => onChange(path, event.target.value)}
                            className="min-h-20 resize-y rounded-[10px] border-0 bg-[#f3f3f3] px-3 py-2 text-[12px] font-medium leading-5 text-[#111111] outline-none transition focus:bg-[#eeeeee]"
                          />
                        ) : (
                          <input
                            value={inputValue}
                            onChange={(event) => onChange(path, event.target.value)}
                            className="h-10 rounded-[10px] border-0 bg-[#f3f3f3] px-3 text-[12px] font-medium text-[#111111] outline-none transition focus:bg-[#eeeeee]"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            {projectMenu ? (
              <div
                className="absolute z-50 w-44 rounded-[10px] border border-[#eeeeee] bg-white p-1 shadow-xl"
                style={{ left: projectMenu.x, top: projectMenu.y }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onRemoveRecentProject(projectMenu.index);
                    setProjectMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12px] font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Supprimer
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {section.type === "article-detail" ? (
        <div className="border-t border-[#eeeeee] py-3">
          <h2 className="mb-3 text-[12px] font-semibold text-[#111111]">
            Ajouter un bloc
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Bloc texte",
              "Titre",
              "Image",
              "Tableau",
              "Cases",
              "Bloc quiz",
            ].map((blockType) => (
              <button
                key={blockType}
                type="button"
                onClick={() => onAddRepeatableItem(blockType)}
                className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#f3f3f3] text-[12px] font-semibold text-[#111111] transition hover:bg-[#eeeeee]"
              >
                <Plus size={14} />
                {blockType}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {groups.map((group) => (
        <div key={group.category} className="border-t border-[#eeeeee] py-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[12px] font-semibold text-[#111111]">
              {group.category}
            </h2>
            {section.type === "social-proof" &&
            group.category === "Statistiques" ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onRemoveSocialProofStat}
                  disabled={section.fields.stats.length <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#666666] hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Retirer une preuve sociale"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={onAddSocialProofStat}
                  disabled={section.fields.stats.length >= 5}
                  className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#666666] hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Ajouter une preuve sociale"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : section.type === "work-method" && group.category === "Etapes" ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onRemoveWorkMethodStep}
                  disabled={section.fields.steps.length <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#666666] hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Retirer une etape"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={onAddWorkMethodStep}
                  disabled={section.fields.steps.length >= 6}
                  className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#666666] hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Ajouter une etape"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (section.type === "service-areas" && group.category === "Zones") ||
              ((section.type === "services-hub-hero" ||
                section.type === "services-hub-bento") &&
                group.category === "Prestations") ||
              (section.type === "testimonials" &&
                section.variant === "projects-a" &&
                group.category === "Avis clients") ||
              (section.type === "testimonials" &&
                section.variant === "gallery-a" &&
                (group.category === "Avis clients" || group.category === "Images")) ||
              ((section.type === "blog-advice" || section.type === "blog-index") &&
                group.category === "Articles") ||
              (section.type === "contact-section" &&
                group.category === "Champs formulaire") ||
              (section.type === "about-story" &&
                group.category === "Points cles") ||
              (section.type === "faq" && group.category === "Questions") ||
              (section.type === "article-detail" &&
                (group.category === "Blocs article" || group.category === "Quiz")) ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRemoveRepeatableItem(group.category)}
                  className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#666666] hover:bg-[#f3f3f3]"
                  aria-label={`Retirer ${group.category}`}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onAddRepeatableItem(group.category)}
                  className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#666666] hover:bg-[#f3f3f3]"
                  aria-label={`Ajouter ${group.category}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            {group.paths.map((path) => {
              const value = readAtPath(section.fields, path);
              const inputValue = typeof value === "string" ? value : "";
              const booleanToggle = path[path.length - 1] === "compareEnabled";
              const multiline = inputValue.length > 74;

              return (
                <label
                  key={path.join(".")}
                  className="grid grid-cols-[98px_minmax(0,1fr)] items-start gap-3"
                >
                  <span className="pt-2.5 text-[12px] font-medium leading-4 text-[#666666]">
                    {pathLabel(path)}
                  </span>
                  {booleanToggle ? (
                    <div className="flex h-10 rounded-[10px] bg-[#f3f3f3] p-1 text-[12px] font-semibold">
                      {[
                        { label: "Oui", value: "oui" },
                        { label: "Non", value: "non" },
                      ].map((option) => {
                        const active =
                          inputValue.trim().toLowerCase() === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(path, option.value)}
                            className={`flex flex-1 items-center justify-center rounded-[8px] transition ${
                              active
                                ? "bg-white text-[#007aff] shadow-[0_1px_3px_rgba(0,0,0,0.16),0_1px_1px_rgba(0,0,0,0.08)]"
                                : "text-[#8c8c8c]"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : multiline ? (
                    <textarea
                      value={inputValue}
                      onChange={(event) => onChange(path, event.target.value)}
                      className="min-h-20 resize-y rounded-[10px] border-0 bg-[#f3f3f3] px-3 py-2 text-[12px] font-medium leading-5 text-[#111111] outline-none transition focus:bg-[#eeeeee]"
                    />
                  ) : (
                    <input
                      value={inputValue}
                      onChange={(event) => onChange(path, event.target.value)}
                      className="h-10 rounded-[10px] border-0 bg-[#f3f3f3] px-3 text-[12px] font-medium text-[#111111] outline-none transition focus:bg-[#eeeeee]"
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
