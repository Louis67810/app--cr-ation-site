import type { SitePage } from "./site-template";

const mowingImage = "/images/hero-landscaper-mowing.png";

const serviceImage =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=85";

const gardenImageA =
  "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1200&q=85";
const gardenImageB =
  "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&w=1200&q=85";
const gardenImageC =
  "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=85";
const gardenImageD =
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=85";
const gardenImageE =
  "https://images.unsplash.com/photo-1620127682229-33388276e540?auto=format&fit=crop&w=1200&q=85";
const gardenImageF =
  "https://images.unsplash.com/photo-1601001815894-4bb6c81416d7?auto=format&fit=crop&w=1200&q=85";
const gardenImageG =
  "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=85";
const portraitImage =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=85";

function projectPhoto(
  city: string,
  imageUrl: string,
  alt: string,
  compareEnabled = "non",
) {
  return {
    city,
    imageUrl,
    alt,
    compareEnabled,
    beforeImageUrl: imageUrl,
    afterImageUrl: gardenImageE,
  };
}

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
    {
      id: "home-recent-projects",
      type: "recent-projects",
      variant: "city-filter-a",
      fields: {
        title: "Nos recentes realisations",
        subtitle: "Decouvrez nos dernieres realisations triees par ville",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        cities: ["Nantes", "Rennes", "Vannes"],
        projects: [
          projectPhoto("Nantes", gardenImageA, "Jardin paysager a Nantes", "oui"),
          projectPhoto("Nantes", gardenImageB, "Massif vegetal a Nantes"),
          projectPhoto("Nantes", gardenImageC, "Terrasse amenagee a Nantes"),
          projectPhoto("Rennes", gardenImageD, "Creation de jardin a Rennes"),
          projectPhoto("Rennes", gardenImageE, "Entretien paysager a Rennes"),
          projectPhoto("Rennes", gardenImageA, "Allee plantee a Rennes"),
          projectPhoto("Vannes", gardenImageB, "Jardin contemporain a Vannes"),
          projectPhoto("Vannes", gardenImageC, "Bordures vegetales a Vannes"),
          projectPhoto("Vannes", gardenImageD, "Pelouse entretenue a Vannes"),
        ],
      },
    },
    {
      id: "home-services-centered",
      type: "services-centered",
      variant: "cards-centered-a",
      fields: {
        title: "Pourquoi nous choisir ?",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        services: [
          {
            title: "Pourquoi nous choisir ?",
            description:
              "Achieve product readiness in days while upskilling customer-facing skills.",
            imageUrl: gardenImageA,
            href: "/prestations/conseil",
          },
          {
            title: "Pourquoi nous choisir ?",
            description:
              "Achieve product readiness in days while upskilling customer-facing skills.",
            imageUrl: gardenImageB,
            href: "/prestations/entretien",
          },
          {
            title: "Pourquoi nous choisir ?",
            description:
              "Achieve product readiness in days while upskilling customer-facing skills.",
            imageUrl: gardenImageC,
            href: "/prestations/amenagement",
          },
        ],
      },
    },
    {
      id: "home-work-method",
      type: "work-method",
      variant: "alternating-a",
      fields: {
        title: "Notre Methode de travail",
        subtitle: "Decouvrez notre accompagnement de la premiere idee a la livraison",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        steps: [
          {
            title: "Analyse du terrain",
            description:
              "Nous etudions l'exposition, les usages, les contraintes techniques et vos envies pour poser une base claire avant la conception.",
            imageUrl: gardenImageD,
          },
          {
            title: "Conception paysagere",
            description:
              "Nous construisons une proposition lisible avec les zones de vie, les vegetaux, les circulations et les priorites de realisation.",
            imageUrl: gardenImageE,
          },
          {
            title: "Realisation et suivi",
            description:
              "Nos equipes coordonnent les travaux, ajustent les details sur site et vous livrent un jardin propre, durable et facile a entretenir.",
            imageUrl: gardenImageA,
          },
        ],
      },
    },
    {
      id: "home-service-areas",
      type: "service-areas",
      variant: "image-list-a",
      fields: {
        title: "Nos zones d'interventions",
        subtitle: "Decouvrez les villes ou notre equipe intervient pour vos projets paysagers.",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        areas: [
          { name: "Perigueux", href: "/zones/perigueux", imageUrl: gardenImageA },
          { name: "Saint Astier", href: "/zones/saint-astier", imageUrl: gardenImageB },
          { name: "Nontron", href: "/zones/nontron", imageUrl: gardenImageC },
          { name: "Riberac", href: "/zones/riberac", imageUrl: gardenImageD },
          { name: "Bergerac", href: "/zones/bergerac", imageUrl: gardenImageE },
        ],
      },
    },
    {
      id: "home-testimonials",
      type: "testimonials",
      variant: "gallery-a",
      fields: {
        title: "Ils nous ont fait confiance",
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        images: [
          gardenImageA,
          gardenImageB,
          gardenImageC,
          gardenImageD,
          gardenImageE,
          gardenImageF,
          gardenImageG,
          serviceImage,
        ],
        reviews: [
          {
            author: "Louis Staub",
            avatarUrl: portraitImage,
            text: "Equipe tres professionnelle, chantier propre et resultats conformes a ce que nous avions imagine. Le jardin est beaucoup plus simple a entretenir et les plantations ont tres bien repris.",
          },
          {
            author: "Marie L.",
            avatarUrl: portraitImage,
            text: "Nous avons ete accompagnes de la premiere visite jusqu'a la livraison. Les conseils etaient clairs, le planning respecte et le rendu final donne vraiment une nouvelle vie a la maison.",
          },
          {
            author: "Thomas R.",
            avatarUrl: portraitImage,
            text: "Intervention efficace pour remettre le terrain en etat avant l'ete. Les massifs, la taille et les bordures ont ete realises avec beaucoup de soin.",
          },
        ],
      },
    },
    {
      id: "home-blog-advice",
      type: "blog-advice",
      variant: "posts-a",
      fields: {
        title: "Nos conseils",
        cta: { label: "Book a Table", href: "/blog" },
        posts: [
          {
            category: "Conseils",
            title: "La maladie du fil rouge sur gazon : causes, symptomes et solutions durables",
            excerpt:
              "Comprendre les signes, les conditions favorables et les bons gestes pour retrouver une pelouse dense et saine.",
            imageUrl: gardenImageF,
            href: "/blog/maladie-fil-rouge-gazon",
          },
          {
            category: "Conseils",
            title: "Quand tailler ses haies ?",
            excerpt:
              "Les periodes ideales et les erreurs a eviter pour garder des haies nettes sans fragiliser les vegetaux.",
            imageUrl: gardenImageB,
            href: "/blog/quand-tailler-haies",
          },
          {
            category: "Entretien",
            title: "Preparer son jardin avant l'ete",
            excerpt:
              "Arrosage, paillage, tonte et nettoyage : les actions prioritaires pour profiter des beaux jours.",
            imageUrl: gardenImageC,
            href: "/blog/preparer-jardin-ete",
          },
          {
            category: "Amenagement",
            title: "Creer un massif durable",
            excerpt:
              "Choisir les bonnes plantes, organiser les volumes et limiter l'entretien sur le long terme.",
            imageUrl: gardenImageD,
            href: "/blog/creer-massif-durable",
          },
        ],
      },
    },
    {
      id: "home-faq",
      type: "faq",
      variant: "accordion-a",
      fields: {
        title: "Les questions frequentes",
        cta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        items: [
          {
            question: "Intervenez-vous pour les particuliers ?",
            answer:
              "Oui, nous accompagnons les particuliers pour la creation, l'entretien et la renovation des espaces exterieurs.",
          },
          {
            question: "Proposez-vous des contrats d'entretien ?",
            answer:
              "Oui, les passages peuvent etre ponctuels ou planifies selon la saison, la surface et le niveau d'entretien souhaite.",
          },
          {
            question: "Pouvez-vous fournir un devis ?",
            answer:
              "Oui, un devis est prepare apres un echange et une analyse du terrain afin de chiffrer correctement les travaux.",
          },
          {
            question: "Travaillez-vous avec les entreprises ?",
            answer:
              "Oui, nous intervenons aussi pour les entreprises, collectivites et syndics sur des espaces verts reguliers.",
          },
        ],
      },
    },
    {
      id: "home-footer",
      type: "site-footer",
      variant: "landscaper-a",
      fields: {
        title: "Un projet paysager a concretiser ?",
        subtitle:
          "Parlez-nous de votre terrain, de vos envies et de vos contraintes. Nous vous aidons a construire la bonne solution.",
        cta: { label: "Book a Table", href: "/contact" },
        backgroundImageUrl: gardenImageG,
        logoLabel: "LOGO",
        copyright: "(c) 2026 Votre entreprise. Tous droits reserves.",
        addressLabel: "ADRESSE :",
        address: "Adresse de votre entreprise, Code postal Ville",
        contactLabel: "CONTACT:",
        phone: "00 00 00 00 00",
        email: "contact@entreprise.fr",
        credit: "",
        socialLinks: [
          { label: "in", href: "#" },
          { label: "ig", href: "#" },
          { label: "fb", href: "#" },
          { label: "p", href: "#" },
        ],
        linkGroups: [
          {
            title: "Pages",
            links: [
              { label: "Accueil", href: "/" },
              { label: "Collectivites", href: "/collectivites" },
              { label: "Entreprises", href: "/entreprises" },
              { label: "Particuliers", href: "/particuliers" },
              { label: "A propos", href: "/a-propos" },
              { label: "Realisations", href: "/realisations" },
              { label: "Credit d'impot", href: "/credit-impot" },
              { label: "Contact", href: "/contact" },
            ],
          },
          {
            title: "Conception",
            links: [
              { label: "Amenagement paysager", href: "/amenagement-paysager" },
              { label: "Conception de jardins de A a Z", href: "/conception-jardin" },
              { label: "Creation d'espaces de vie exterieurs sur-mesure", href: "/creation-espaces" },
              { label: "Apport et preparation de terre", href: "/preparation-terre" },
              { label: "Plantation de gazon", href: "/plantation-gazon" },
              { label: "Plantation d'arbres et vegetaux", href: "/plantation-arbres" },
            ],
          },
          {
            title: "Entretien",
            links: [
              { label: "Entretien d'espaces verts", href: "/entretien-espaces-verts" },
              { label: "Entretien regulier des jardins", href: "/entretien-jardins" },
              { label: "Elagage d'arbres", href: "/elagage" },
              { label: "Tonte de pelouse", href: "/tonte-pelouse" },
              { label: "Taille de haies", href: "/taille-haies" },
              { label: "Ramassage de feuilles", href: "/ramassage-feuilles" },
            ],
          },
          {
            title: "Zones d'intervention",
            links: [
              { label: "Perigueux", href: "/zones/perigueux" },
              { label: "Saint Astier", href: "/zones/saint-astier" },
              { label: "Nontron", href: "/zones/nontron" },
              { label: "Riberac", href: "/zones/riberac" },
              { label: "Bergerac", href: "/zones/bergerac" },
            ],
          },
        ],
      },
    },
  ],
};
