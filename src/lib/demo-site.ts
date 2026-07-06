import type { SitePage } from "./site-template";

const mowingImage = "/images/hero-landscaper-mowing.png";

const serviceImage =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=85";

export const demoHomePage: SitePage = {
  id: "home",
  slug: "/",
  title: "Accueil",
  sections: [
    {
      id: "home-header",
      type: "site-header",
      variant: "glass-a",
      fields: {
        logoLabel: "Logo",
        navigation: [
          { label: "Accueil", href: "/" },
          { label: "Prestations", href: "/prestations" },
          { label: "Realisations", href: "/realisations" },
          { label: "Contact", href: "/contact" },
          { label: "Blog", href: "/blog" },
        ],
        cta: { label: "Demander un devis", href: "/contact" },
      },
    },
    {
      id: "home-hero",
      type: "hero",
      variant: "full-image-a",
      fields: {
        backgroundImageUrl: mowingImage,
        title: "Votre jardin merite un paysagiste d'exception",
        subtitle:
          "Creation, entretien et amenagement paysager pour transformer vos exterieurs en espaces durables, propres et faciles a vivre.",
        primaryCta: { label: "Voir les prestations", href: "/prestations" },
        secondaryCta: { label: "Demander un devis", href: "/contact" },
        reviewRatingLabel: "Excellent",
        reviewScore: "4,8/5",
        reviewCount: "128 avis",
        reviewCta: { label: "Ecrire un avis", href: "#" },
      },
    },
    {
      id: "home-social-proof",
      type: "social-proof",
      variant: "band-a",
      fields: {
        stats: [
          {
            value: "4,8/5",
            label: "Note moyenne laissee par nos clients apres intervention.",
          },
          {
            value: "120+",
            label: "Jardins entretenus, crees ou transformes chaque annee.",
          },
          {
            value: "15 ans",
            label: "D'experience en creation et entretien paysager.",
          },
        ],
      },
    },
    {
      id: "home-services",
      type: "services",
      variant: "cards-a",
      fields: {
        title: "Nos prestations",
        cta: { label: "Tout voir", href: "/prestations" },
        services: [
          {
            title: "Creation de jardin",
            description:
              "Conception complete, plantations, allees et mise en valeur de vos espaces exterieurs.",
            imageUrl: serviceImage,
            href: "/prestations/creation-jardin",
          },
          {
            title: "Entretien paysager",
            description:
              "Tonte, taille, nettoyage et suivi regulier pour garder un jardin net toute l'annee.",
            imageUrl: serviceImage,
            href: "/prestations/entretien",
          },
          {
            title: "Amenagement exterieur",
            description:
              "Terrasses, massifs, bordures et solutions sur mesure pour structurer votre terrain.",
            imageUrl: serviceImage,
            href: "/prestations/amenagement",
          },
        ],
      },
    },
  ],
};
