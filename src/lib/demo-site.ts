import type {
  ArticleDetailFields,
  BlogPost,
  RecentProjectsFields,
  RealisationDetailFields,
  SectionInstance,
  SitePage,
} from "./site-template";

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

export const demoBlogPosts: BlogPost[] = [
  {
    category: "Conseils",
    title: "Comment se proteger du vis-a-vis dans son jardin ? 3 solutions naturelles et esthetiques",
    excerpt:
      "Haies, claustras vegetaux et plantations persistantes pour retrouver de l'intimite sans fermer le jardin.",
    imageUrl: gardenImageA,
    href: "/blog/se-proteger-vis-a-vis-jardin",
    date: "22 Mai 2026",
  },
  {
    category: "Conseils",
    title: "La maladie du fil rouge sur gazon : causes, symptomes et solutions durables",
    excerpt:
      "Comprendre les signes, les conditions favorables et les bons gestes pour retrouver une pelouse dense et saine.",
    imageUrl: gardenImageF,
    href: "/blog/maladie-fil-rouge-gazon",
    date: "18 Mai 2026",
  },
  {
    category: "Conseils",
    title: "Quand tailler ses haies ?",
    excerpt:
      "Les periodes ideales et les erreurs a eviter pour garder des haies nettes sans fragiliser les vegetaux.",
    imageUrl: gardenImageB,
    href: "/blog/quand-tailler-haies",
    date: "12 Mai 2026",
  },
  {
    category: "Entretien",
    title: "Preparer son jardin avant l'ete",
    excerpt:
      "Arrosage, paillage, tonte et nettoyage : les actions prioritaires pour profiter des beaux jours.",
    imageUrl: gardenImageC,
    href: "/blog/preparer-jardin-ete",
    date: "4 Mai 2026",
  },
  {
    category: "Amenagement",
    title: "Creer un massif durable",
    excerpt:
      "Choisir les bonnes plantes, organiser les volumes et limiter l'entretien sur le long terme.",
    imageUrl: gardenImageD,
    href: "/blog/creer-massif-durable",
    date: "26 Avril 2026",
  },
  {
    category: "Entretien",
    title: "Comment garder une pelouse verte plus longtemps ?",
    excerpt:
      "Les bons reglages de tonte, l'arrosage et les apports utiles pour limiter le jaunissement.",
    imageUrl: gardenImageE,
    href: "/blog/pelouse-verte",
    date: "14 Avril 2026",
  },
  {
    category: "Amenagement",
    title: "Quel paillage choisir pour ses massifs ?",
    excerpt:
      "Mineral, organique ou decoratif : choisir le paillage adapte au style et aux plantes.",
    imageUrl: serviceImage,
    href: "/blog/choisir-paillage",
    date: "2 Avril 2026",
  },
  {
    category: "Conseils",
    title: "Les plantes faciles pour un jardin sans entretien",
    excerpt:
      "Une selection de vegetaux robustes pour garder un exterieur propre avec moins d'interventions.",
    imageUrl: gardenImageG,
    href: "/blog/plantes-faciles",
    date: "20 Mars 2026",
  },
];

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
        logoImageUrl: "",
        navigation: [
          { label: "Prestations", href: "/prestations" },
          { label: "Realisations", href: "/realisations" },
          { label: "A propos", href: "/a-propos" },
          { label: "Ressources", href: "/blog" },
        ],
        cta: { label: "Demander un devis", href: "/contact" },
        phone: "06 00 00 00 00",
        phoneLabel: "Appeler",
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
            href: "/prestations/entretien-paysager",
          },
          {
            title: "Amenagement exterieur",
            description:
              "Terrasses, massifs, bordures et solutions sur mesure pour structurer votre terrain.",
            imageUrl: serviceImage,
            href: "/prestations/amenagement-exterieur",
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
        cta: { label: "Nous contacter", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        services: [
          {
            title: "Une expertise de terrain",
            description:
              "Des solutions pensees selon votre sol, vos usages et les contraintes reelles de votre exterieur.",
            imageUrl: gardenImageA,
            href: "/prestations/conseil-paysager",
          },
          {
            title: "Un suivi clair",
            description:
              "Un interlocuteur disponible, des etapes lisibles et des engagements annonces avant le chantier.",
            imageUrl: gardenImageB,
            href: "/prestations/entretien-paysager",
          },
          {
            title: "Des amenagements durables",
            description:
              "Des vegetaux et des materiaux choisis pour bien vieillir et simplifier l'entretien au quotidien.",
            imageUrl: gardenImageC,
            href: "/prestations/amenagement-exterieur",
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
        posts: demoBlogPosts.slice(0, 4),
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
        backgroundImageUrl: gardenImageA,
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

export const demoBlogPage: SitePage = {
  id: "blog",
  slug: "/blog",
  title: "Blog",
  sections: [
    { ...demoHomePage.sections[0], id: "blog-header" },
    {
      id: "blog-hero",
      type: "hero",
      variant: "full-image-a",
      fields: {
        backgroundImageUrl: mowingImage,
        title: "Nos conseils pour votre jardin",
        subtitle:
          "Retrouvez nos derniers conseils pour concevoir, entretenir et ameliorer vos espaces exterieurs toute l'annee.",
        primaryCta: { label: "Voir les articles", href: "#articles" },
        secondaryCta: { label: "Nous contacter", href: "#contact" },
        reviewRatingLabel: "Excellent",
        reviewScore: "4,8/5",
        reviewCount: "128 avis",
        reviewCta: { label: "Ecrire un avis", href: "#" },
      },
    },
    {
      id: "blog-index",
      type: "blog-index",
      variant: "grid-a",
      fields: {
        title: "Nos derniers articles",
        searchPlaceholder: "Rechercher un article",
        loadMoreLabel: "Voir plus",
        posts: demoBlogPosts,
      },
    },
    {
      id: "blog-contact",
      type: "contact-section",
      variant: "form-a",
      fields: {
        title: "Un projet paysager a concretiser ?",
        subtitle:
          "Expliquez-nous votre besoin, votre budget et les contraintes du terrain. Nous revenons vers vous avec une premiere reponse claire.",
        cta: { label: "Book a Table", href: "/contact" },
        backgroundImageUrl: gardenImageA,
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
    },
    { ...demoHomePage.sections[demoHomePage.sections.length - 1], id: "blog-footer" },
  ],
};

const homeRecentProjectsFields = demoHomePage.sections.find(
  (section) => section.type === "recent-projects",
)?.fields as RecentProjectsFields;

const sharedRealisationProjects = homeRecentProjectsFields.projects;
export const demoRealisationDetailSlug = "amenagement-exterieur-dordogne";
const homeHeaderSection = demoHomePage.sections[0] as Extract<
  SectionInstance,
  { type: "site-header" }
>;
const blogContactSection = demoBlogPage.sections[3] as Extract<
  SectionInstance,
  { type: "contact-section" }
>;
const homeFooterSection = demoHomePage.sections[
  demoHomePage.sections.length - 1
] as Extract<SectionInstance, { type: "site-footer" }>;

export const demoRealisationsPage: SitePage = {
  id: "realisations",
  slug: "/realisations",
  title: "Realisations",
  sections: [
    {
      ...homeHeaderSection,
      id: "realisations-header",
      variant: "light-a",
    },
    {
      id: "realisations-index",
      type: "realisations-page",
      variant: "index-a",
      fields: {
        title: "Nos realisations paysageres",
        subtitle:
          "Decouvrez une selection de jardins, entretiens et amenagements exterieurs realises pour nos clients.",
        cta: { label: "Voir les realisations", href: "#realisations" },
        heroImages: sharedRealisationProjects.map((project) => ({
          imageUrl: project.imageUrl,
          alt: project.alt,
        })),
        listTitle: "Toutes nos realisations",
        filters: homeRecentProjectsFields.cities,
        cardCtaLabel: "Voir la réalisation",
        projects: sharedRealisationProjects.map((project, index) => ({
          city: project.city,
          category: project.city,
          imageUrl: project.imageUrl,
          alt: project.alt,
          title:
            [
              "Comment transformer un jardin expose en espace intime et vegetal",
              "Une entree paysagere plus nette pour valoriser la maison",
              "Creation d'un massif durable avec peu d'entretien",
              "Un jardin contemporain pense pour circuler facilement",
              "Entretien complet d'un exterieur avant la belle saison",
              "Une allee plantee pour structurer le terrain",
            ][index % 6],
          href:
            index === 0
              ? `/realisations/${demoRealisationDetailSlug}`
              : `/realisations/${demoRealisationDetailSlug}`,
        })),
      },
    },
    { ...blogContactSection, id: "realisations-contact" },
    {
      ...homeFooterSection,
      id: "realisations-footer",
    },
  ],
};

const relatedRealisationProjects = sharedRealisationProjects.map((project, index) => ({
  city: project.city,
  category: project.city,
  imageUrl: project.imageUrl,
  alt: project.alt,
  title:
    [
      "Amenagement exterieur complet autour d'une maison familiale",
      "Une entree paysagere plus nette pour valoriser la maison",
      "Creation d'un massif durable avec peu d'entretien",
      "Un jardin contemporain pense pour circuler facilement",
      "Entretien complet d'un exterieur avant la belle saison",
      "Une allee plantee pour structurer le terrain",
    ][index % 6],
  href: `/realisations/${demoRealisationDetailSlug}`,
}));

const demoRealisationDetailFields: RealisationDetailFields = {
  breadcrumbs: [
    { label: "Accueil", href: "/" },
    { label: "Realisations", href: "/realisations" },
    { label: "Dordogne", href: "#" },
  ],
  title:
    "Amenagement exterieur en Dordogne : beton desactive beige, massifs et plantations",
  subtitle:
    "Un projet complet pour transformer une entree de maison en espace propre, lisible et simple a entretenir toute l'annee.",
  primaryCta: { label: "Voir le projet", href: "#avant-apres" },
  secondaryCta: { label: "Demander un devis", href: "#contact" },
  heroImageUrl: gardenImageA,
  heroImageAlt: "Amenagement paysager en Dordogne",
  beforeAfterTitle: "Avant / apres du projet",
  beforeAfterSlides: [
    {
      label: "Concept",
      beforeImageUrl: gardenImageB,
      afterImageUrl: gardenImageA,
      alt: "Comparaison avant apres de l'amenagement exterieur",
    },
    {
      label: "Massifs",
      beforeImageUrl: gardenImageC,
      afterImageUrl: gardenImageD,
      alt: "Comparaison des massifs paysagers",
    },
    {
      label: "Circulation",
      beforeImageUrl: gardenImageF,
      afterImageUrl: gardenImageE,
      alt: "Comparaison des circulations exterieures",
    },
  ],
  tocTitle: "Sommaire",
  testimonial: {
    text:
      "Nous avions besoin d'un exterieur propre et coherent avec la maison. Le resultat est beaucoup plus simple a vivre au quotidien, et l'entree donne enfin une vraie premiere impression.",
    authorName: "Jean Dupont",
    authorRole: "Client particulier",
    avatarUrl: portraitImage,
  },
  blocks: [
    {
      kind: "heading",
      text: "Contexte du projet",
    },
    {
      kind: "paragraph",
      text:
        "Maison de plain-pied avec auvent a colonnes en Dordogne, entouree d'un espace exterieur en terre sans revetement structure. Le projet couvre l'integralite du jardin de devant : allee d'acces, zones de stationnement et massifs de part et d'autre.",
    },
    {
      kind: "image",
      imageUrl: gardenImageB,
      alt: "Terrain avant amenagement paysager",
    },
    {
      kind: "heading",
      text: "Defis rencontres",
    },
    {
      kind: "paragraph",
      text:
        "Le terrain devait rester facile a circuler, supportable en entretien et coherent avec l'architecture existante. Il fallait aussi conserver une lecture claire entre les zones de passage, les zones vegetales et les espaces de stationnement.",
    },
    {
      kind: "bento",
      images: [
        { imageUrl: gardenImageC, alt: "Detail des plantations" },
        { imageUrl: gardenImageD, alt: "Allee exterieure structuree" },
        { imageUrl: gardenImageE, alt: "Vue large de l'amenagement" },
      ],
    },
    {
      kind: "image",
      imageUrl: gardenImageC,
      alt: "Banniere separant les defis des solutions apportees",
    },
    {
      kind: "heading",
      text: "Solutions apportees",
    },
    {
      kind: "paragraph",
      text:
        "Nous avons combine un beton desactive beige pour les circulations, des massifs en galets pour limiter l'entretien et des plantations persistantes pour garder du volume toute l'annee.",
    },
    {
      kind: "cards",
      cards: [
        {
          icon: "leaf",
          title: "Entretien limite",
          text: "Les zones minerales et les vegetaux robustes reduisent les interventions tout en gardant un rendu soigne.",
        },
        {
          icon: "home",
          title: "Maison valorisee",
          text: "Les circulations guident naturellement vers l'entree et donnent une lecture plus qualitative de la facade.",
        },
        {
          icon: "shield",
          title: "Materiaux durables",
          text: "Les choix de revetement et de bordures sont adaptes aux usages quotidiens et aux passages repetes.",
        },
        {
          icon: "sprout",
          title: "Vegetal coherent",
          text: "Les massifs restent simples, lisibles et compatibles avec les contraintes du terrain.",
        },
      ],
    },
    {
      kind: "image",
      imageUrl: gardenImageD,
      alt: "Banniere separant les solutions du resultat final",
    },
    {
      kind: "heading",
      text: "Resultat final",
    },
    {
      kind: "paragraph",
      text:
        "Le jardin de devant est maintenant structure, propre et plus simple a vivre. Les zones d'acces sont nettes, les massifs encadrent l'espace sans le surcharger, et l'ensemble reste coherent avec le style de la maison.",
    },
    {
      kind: "before-after",
      title: "Detail avant / apres",
      beforeImageUrl: gardenImageF,
      afterImageUrl: gardenImageA,
      alt: "Detail compare avant apres de la realisation",
    },
    {
      kind: "image",
      imageUrl: gardenImageE,
      alt: "Banniere separant le resultat final des points forts",
    },
    {
      kind: "heading",
      text: "Points forts",
    },
    {
      kind: "paragraph",
      text:
        "Cette realisation sert de base claire pour les futures pages CMS : chaque titre, image, galerie, carte d'argument et avant/apres peut etre remplace sans toucher a la structure de page.",
    },
    {
      kind: "image",
      imageUrl: gardenImageG,
      alt: "Resultat final de l'amenagement paysager",
    },
  ],
  relatedTitle: "Toutes nos realisations",
  relatedFilters: homeRecentProjectsFields.cities,
  relatedCardCtaLabel: "Voir la réalisation",
  relatedProjects: relatedRealisationProjects,
};

export const demoRealisationDetailPage: SitePage = {
  id: "realisation-amenagement-dordogne",
  slug: `/realisations/${demoRealisationDetailSlug}`,
  title: "Realisation - Amenagement exterieur Dordogne",
  sections: [
    {
      ...homeHeaderSection,
      id: "realisation-detail-header",
      variant: "glass-a",
    },
    {
      id: "realisation-detail",
      type: "realisation-detail",
      variant: "case-study-a",
      fields: demoRealisationDetailFields,
    },
    { ...blogContactSection, id: "realisation-detail-contact" },
    {
      ...homeFooterSection,
      id: "realisation-detail-footer",
    },
  ],
};

export const demoArticlePage: SitePage = {
  id: "article-vis-a-vis",
  slug: "/blog/se-proteger-vis-a-vis-jardin",
  title: "Article - Se proteger du vis-a-vis",
  sections: [
    {
      id: "article-header",
      type: "site-header",
      variant: "light-a",
      fields: {
        logoLabel: "Logo",
        logoImageUrl: "",
        navigation: [
          { label: "Prestations", href: "/prestations" },
          { label: "Realisations", href: "/realisations" },
          { label: "A propos", href: "/a-propos" },
          { label: "Ressources", href: "/blog" },
        ],
        cta: { label: "Demander un devis", href: "/contact" },
        phone: "06 00 00 00 00",
        phoneLabel: "Appeler",
      },
    },
    {
      id: "article-detail",
      type: "article-detail",
      variant: "seo-a",
      fields: {
        breadcrumbs: [
          { label: "Accueil", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: "Conseils", href: "/blog?categorie=conseils" },
        ],
        title: "Comment se proteger du vis-a-vis dans son jardin ?",
        subtitle:
          "Haies, claustras vegetaux et plantations persistantes pour retrouver de l'intimite sans fermer votre espace exterieur.",
        primaryCta: { label: "Lire l'article", href: "#article" },
        secondaryCta: { label: "Demander un devis", href: "/contact" },
        heroImageUrl: gardenImageA,
        heroImageAlt: "Jardin plante avec allee et massifs pour limiter le vis-a-vis",
        readingTime: "5 minutes",
        updatedLabel: "Mis a jour le",
        updatedAt: "9 Juillet 2026",
        tocTitle: "Sommaire",
        sidebarCtaTitle: "Un projet paysager a concretiser ?",
        sidebarCta: { label: "Book a Table", href: "/contact" },
        socialProof: { ratingLabel: "Bien", reviewCount: "500 avis" },
        quizzes: [
          {
          id: "quiz-style-jardin",
          name: "Quiz style jardin",
          title: "Quel amenagement vous correspond ?",
          subtitle:
            "Choisissez les ambiances qui vous attirent pour découvrir un style adapté à votre jardin.",
          mode: "visual-preference",
          nextLabel: "Suivant",
          resultTitle: "Votre premiere piste est prete",
          resultText:
            "Pour ce profil, une combinaison de plantations persistantes et de zones structurees permet de gagner en intimite sans assombrir le jardin.",
          cta: { label: "Recevoir une proposition", href: "/contact" },
          questions: [
            {
              id: "ambiance",
              question: "Quelle ambiance vous attire le plus ?",
              subtitle: "Fiez-vous à votre première impression.",
              options: [
                { id: "ambiance-naturelle", label: "Un jardin libre et végétal", description: "Des volumes souples, des floraisons et une sensation de nature.", imageUrl: gardenImageA, imageAlt: "Jardin naturel dense et fleuri", category: "naturel", scores: { naturel: 3, contemporain: 0 } },
                { id: "ambiance-structuree", label: "Un jardin net et architectural", description: "Des lignes lisibles, des matières minérales et des végétaux maîtrisés.", imageUrl: gardenImageG, imageAlt: "Jardin contemporain structuré", category: "contemporain", scores: { contemporain: 3, naturel: 0 } },
              ],
            },
            {
              id: "usage",
              question: "Comment imaginez-vous vos moments dehors ?",
              options: [
                { id: "usage-convivial", label: "Une terrasse chaleureuse entourée de plantes", description: "Un espace vivant pour recevoir et profiter longtemps du jardin.", imageUrl: gardenImageE, imageAlt: "Terrasse chaleureuse entourée de végétation", category: "naturel", scores: { naturel: 2, contemporain: 1 } },
                { id: "usage-calme", label: "Un espace épuré pour se détendre", description: "Peu d’éléments, mais des choix forts et une circulation fluide.", imageUrl: gardenImageC, imageAlt: "Espace extérieur épuré et calme", category: "contemporain", scores: { contemporain: 2, naturel: 1 } },
              ],
            },
            {
              id: "matiere",
              question: "Quelle association de matières préférez-vous ?",
              options: [
                { id: "matiere-bois", label: "Bois, pierre naturelle et feuillages", description: "Une palette organique qui se patine avec le temps.", imageUrl: gardenImageD, imageAlt: "Bois et pierre naturelle dans un jardin", category: "naturel", scores: { naturel: 3 } },
                { id: "matiere-minerale", label: "Dalles claires, métal et formes graphiques", description: "Une composition contemporaine aux contrastes maîtrisés.", imageUrl: gardenImageB, imageAlt: "Dalles et formes graphiques dans un jardin", category: "contemporain", scores: { contemporain: 3 } },
              ],
            },
          ],
          results: [
            { id: "naturel", category: "Jardin naturel", title: "Un jardin vivant et généreux", text: "Vos choix indiquent une préférence pour les matières authentiques, les plantations souples et une ambiance qui évolue avec les saisons.", description: "Une structure simple peut accueillir des massifs généreux, du bois et des circulations en pierre naturelle.", imageUrl: gardenImageA, imageAlt: "Jardin naturel avec plantations généreuses", recommendations: ["Privilégier des essences locales et complémentaires", "Créer plusieurs strates de végétation", "Employer des matériaux qui se patinent naturellement"], cta: { label: "Imaginer mon jardin naturel", href: "/contact" } },
            { id: "contemporain", category: "Jardin contemporain", title: "Un jardin structuré et apaisant", text: "Vos réponses montrent une attirance pour les lignes claires, les contrastes sobres et des espaces faciles à lire.", description: "Le projet peut associer une trame minérale précise à une sélection végétale graphique et durable.", imageUrl: gardenImageG, imageAlt: "Jardin contemporain aux lignes structurées", recommendations: ["Dessiner des circulations nettes", "Limiter la palette de matériaux", "Répéter quelques végétaux graphiques"], cta: { label: "Concevoir mon jardin contemporain", href: "/contact" } },
          ],
          },
        ],
        blocks: [
          {
            kind: "paragraph",
            text:
              "Le vis-a-vis est l'un des sujets les plus frequents dans un projet de jardin. La bonne solution ne consiste pas toujours a fermer le terrain : il faut souvent filtrer les vues, organiser les usages et choisir les bons volumes.",
          },
          { kind: "quiz", quizId: "quiz-style-jardin" },
          {
            kind: "paragraph",
            text:
              "Avant de planter ou d'installer une separation, observez les angles de vue depuis la maison, la terrasse, les pieces de vie et les limites de propriete. Cela permet de traiter les zones utiles sans surcharger tout le jardin.",
          },
          {
            kind: "heading",
            level: "h2",
            text: "Analyser les vues avant de choisir la solution",
          },
          {
            kind: "paragraph",
            text:
              "Une haie trop dense peut enlever de la lumiere, tandis qu'un claustra mal place peut durcir l'espace. L'analyse du terrain permet de doser la hauteur, la transparence et la distance entre chaque element.",
          },
          {
            kind: "table",
            title: "Comparer les solutions",
            columns: ["Solution", "Effet", "Entretien", "Budget"],
            rows: [
              ["Haie persistante", "Filtre naturel", "Moyen", "Modere"],
              ["Claustra bois", "Occultation rapide", "Faible", "Variable"],
              ["Massif haut", "Filtre souple", "Moyen", "Modere"],
              ["Pergola plantee", "Intimite terrasse", "Moyen", "Eleve"],
              ["Arbres tiges", "Protection en hauteur", "Faible", "Eleve"],
              ["Canisses temporaires", "Solution rapide", "Faible", "Bas"],
            ],
          },
          {
            kind: "callout",
            text:
              "Astuce : traitez d'abord les vues les plus genantes depuis les zones de vie. Une solution partielle mais bien placee donne souvent un resultat plus naturel qu'une fermeture totale.",
          },
          {
            kind: "image",
            imageUrl: gardenImageC,
            alt: "Plantations et massif structure dans un jardin",
          },
          {
            kind: "heading",
            level: "h2",
            text: "Choisir des vegetaux adaptes a l'exposition",
          },
          {
            kind: "paragraph",
            text:
              "Les vegetaux persistants sont utiles pour proteger toute l'annee, mais ils doivent etre adaptes au sol, au climat et a l'exposition. Un melange d'essences limite les risques de maladie et donne un rendu plus vivant.",
          },
          {
            kind: "cards",
            cards: [
              {
                title: "Filtrer sans fermer",
                text:
                  "Associez arbustes, graminees et plantes persistantes pour casser les lignes de vue tout en gardant de la profondeur.",
              },
              {
                title: "Garder une lecture simple",
                text:
                  "Une palette courte de vegetaux et de materiaux rend le jardin plus calme et plus facile a entretenir.",
              },
            ],
          },
          {
            kind: "heading",
            level: "h2",
            text: "Combiner structure et plantations",
          },
          {
            kind: "paragraph",
            text:
              "Dans les projets les plus confortables, la protection visuelle vient rarement d'un seul element. Un claustra peut proteger immediatement une terrasse pendant qu'une haie pousse progressivement.",
          },
          {
            kind: "link",
            text: "Pour aller plus loin, consultez aussi notre guide sur la preparation du jardin avant l'ete :",
            label: "preparer son jardin avant l'ete",
            href: "/blog/preparer-jardin-ete",
          },
        ],
        leadQualifier: {
          title: "De quoi avez vous besoin",
          submitLabel: "Envoyer",
          successTitle: "Merci, votre demande est qualifiee",
          successText:
            "Nous avons les premieres informations pour comprendre votre besoin. Un conseiller peut maintenant vous recontacter avec une reponse plus precise.",
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
                  nextStepId: "besoin-particulier",
                },
                {
                  label: "Professionnel",
                  value: "professionnel",
                  imageSlotLabel: "Image professionnel",
                  imageUrl: "/images/lead-qualifier/professionnel.png",
                  nextStepId: "besoin-pro",
                },
              ],
            },
            {
              id: "besoin-particulier",
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
              id: "besoin-pro",
              title: "Quel type d'espace faut-il gerer ?",
              options: [
                {
                  label: "Entreprise",
                  value: "entreprise",
                  imageSlotLabel: "Image entreprise",
                  imageUrl: "/images/lead-qualifier/entreprise.png",
                  nextStepId: "delai",
                },
                {
                  label: "Collectivite",
                  value: "collectivite",
                  imageSlotLabel: "Image collectivite",
                  imageUrl: "/images/lead-qualifier/collectivite.png",
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
        relatedPosts: demoBlogPosts.filter(
          (post) => post.href !== "/blog/se-proteger-vis-a-vis-jardin",
        ),
      },
    },
    { ...demoHomePage.sections[demoHomePage.sections.length - 1], id: "article-footer" },
  ],
};

const sectorLeadQualifier = (
  demoArticlePage.sections.find((section) => section.type === "article-detail")
    ?.fields as ArticleDetailFields
).leadQualifier;

function buildSectorPage({
  id,
  slug,
  title,
  heroTitle,
  heroSubtitle,
  servicesTitle,
  benefitTitle,
}: {
  id: string;
  slug: string;
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  servicesTitle: string;
  benefitTitle: string;
}): SitePage {
  return {
    id,
    slug,
    title,
    sections: [
      {
        id: `${id}-header`,
        type: "site-header",
        variant: "light-a",
        fields: {
          logoLabel: "Logo",
          logoImageUrl: "",
          navigation: [
            { label: "Prestations", href: "/prestations" },
            { label: "Realisations", href: "/realisations" },
            { label: "A propos", href: "/a-propos" },
            { label: "Ressources", href: "/blog" },
          ],
          cta: { label: "Demander un devis", href: "/contact" },
          phone: "06 00 00 00 00",
          phoneLabel: "Appeler",
        },
      },
      {
        id: `${id}-hero`,
        type: "sector-hero",
        variant: "ticker-a",
        fields: {
          title: heroTitle,
          subtitle: heroSubtitle,
          cta: { label: "Book a Table", href: "#qualification" },
          tickerImages: [
            { imageUrl: gardenImageA, alt: "Amenagement paysager realise" },
            { imageUrl: gardenImageB, alt: "Jardin entretenu" },
            { imageUrl: gardenImageC, alt: "Massif et plantations" },
            { imageUrl: gardenImageD, alt: "Espace vert structure" },
          ],
        },
      },
      {
        id: `${id}-services`,
        type: "sector-services",
        variant: "cards-a",
        fields: {
          title: servicesTitle,
          cta: { label: "Book a Table", href: "#qualification" },
          services: [
            {
              icon: "leaf",
              title: "Entretien sans charge mentale",
              description:
                "Passages planifies, suivi des saisons et interventions adaptees pour garder vos espaces verts nets sans y penser.",
            },
            {
              icon: "badgePercent",
              title: "Avantages et credit d'impot",
              description:
                "Une offre claire pour comprendre ce qui est eligible, optimiser le budget et presenter les bonnes options au client.",
            },
            {
              icon: "shield",
              title: "Un interlocuteur fiable",
              description:
                "Des prestations cadrees, des delais annonces et une equipe qui documente les besoins avant chaque intervention.",
            },
          ],
        },
      },
      {
        id: `${id}-benefits`,
        type: "sector-benefits",
        variant: "image-cards-a",
        fields: {
          title: benefitTitle,
          subtitle:
            "Des prestations pensees pour vendre plus simplement : benefices visibles, resultats propres et accompagnement lisible.",
          cards: [
            {
              imageUrl: gardenImageE,
              title: "Une image exterieure soignee",
              description:
                "Les abords sont nets, les circulations lisibles et le premier contact avec le lieu est plus qualitatif.",
            },
            {
              imageUrl: gardenImageF,
              title: "Des interventions adaptees",
              description:
                "Le rythme d'entretien est ajuste selon la saison, les usages et le niveau d'exigence attendu.",
            },
            {
              imageUrl: gardenImageG,
              title: "Un suivi durable",
              description:
                "Les choix techniques limitent les reprises inutiles et gardent les espaces propres plus longtemps.",
            },
          ],
        },
      },
      { ...demoHomePage.sections[8], id: `${id}-testimonials` },
      {
        id: `${id}-lead-qualifier`,
        type: "lead-qualifier",
        variant: "quiz-a",
        fields: sectorLeadQualifier,
      },
      {
        id: `${id}-extra-services`,
        type: "sector-extra-services",
        variant: "cards-a",
        fields: {
          title: "Beneficiez de plus de 40 ans d'experience pour vos exterieurs",
          cta: { label: "Book a Table", href: "#qualification" },
          services: [
            {
              imageUrl: gardenImageA,
              title: "Amenagement paysager",
              description:
                "Structurer les exterieurs avec des allees, massifs, plantations et zones de vie coherentes.",
              href: "/prestations/amenagement-exterieur",
            },
            {
              imageUrl: gardenImageB,
              title: "Entretien regulier",
              description:
                "Garder un rendu propre toute l'annee avec des passages adaptes au rythme du site.",
              href: "/prestations/entretien-paysager",
            },
            {
              imageUrl: gardenImageC,
              title: "Plantations et vegetaux",
              description:
                "Choisir les bonnes essences pour un resultat durable, vivant et facile a maintenir.",
              href: "/prestations/plantations",
            },
          ],
        },
      },
      { ...demoHomePage.sections[10], id: `${id}-faq` },
      { ...demoHomePage.sections[11], id: `${id}-footer` },
    ],
  };
}

export const demoSectorPages: SitePage[] = [
  buildSectorPage({
    id: "sector-particuliers",
    slug: "/secteurs/particuliers",
    title: "Secteur - Particuliers",
    heroTitle: "Paysagiste pour particuliers",
    heroSubtitle:
      "Creation, entretien et renovation de jardins pour profiter d'un exterieur propre, durable et agreable a vivre.",
    servicesTitle: "Nos prestations pour particuliers",
    benefitTitle: "Nous rendons votre jardin plus simple a vivre",
  }),
  buildSectorPage({
    id: "sector-entreprises",
    slug: "/secteurs/entreprises",
    title: "Secteur - Entreprises",
    heroTitle: "Paysagiste pour entreprises",
    heroSubtitle:
      "Des espaces verts professionnels, propres et coherents avec l'image de votre entreprise.",
    servicesTitle: "Nos prestations pour entreprises",
    benefitTitle: "Nous rendons la facade de votre entreprise exceptionnelle",
  }),
  buildSectorPage({
    id: "sector-collectivites",
    slug: "/secteurs/collectivites",
    title: "Secteur - Collectivites",
    heroTitle: "Paysagiste pour collectivites",
    heroSubtitle:
      "Entretien, gestion et amelioration des espaces publics avec une organisation claire et durable.",
    servicesTitle: "Nos prestations pour collectivites",
    benefitTitle: "Des espaces publics plus propres, lisibles et agreables",
  }),
];

const homeServicesSection = demoHomePage.sections.find(
  (section) => section.type === "services",
) as Extract<SectionInstance, { type: "services" }>;
const homeCenteredServicesSection = demoHomePage.sections.find(
  (section) => section.type === "services-centered",
) as Extract<SectionInstance, { type: "services-centered" }>;
const homeTestimonialsSection = demoHomePage.sections.find(
  (section) => section.type === "testimonials" && section.variant === "gallery-a",
) as Extract<SectionInstance, { type: "testimonials"; variant: "gallery-a" }>;
const homeFaqSection = demoHomePage.sections.find(
  (section) => section.type === "faq",
) as Extract<SectionInstance, { type: "faq" }>;

export const demoHubServices = [
  {
    title: "Creation de jardin",
    description:
      "Conception complete, choix des vegetaux et organisation des espaces pour creer un jardin coherent.",
    imageUrl: gardenImageA,
    href: "/prestations/creation-jardin",
  },
  {
    title: "Entretien paysager",
    description:
      "Tonte, taille, nettoyage et suivi saisonnier pour conserver un exterieur net toute l'annee.",
    imageUrl: gardenImageB,
    href: "/prestations/entretien-paysager",
  },
  {
    title: "Amenagement exterieur",
    description:
      "Massifs, bordures et circulations pour structurer le terrain et simplifier les usages quotidiens.",
    imageUrl: gardenImageC,
    href: "/prestations/amenagement-exterieur",
  },
  {
    title: "Terrasses et allees",
    description:
      "Des surfaces durables et lisibles qui relient naturellement la maison aux espaces de vie.",
    imageUrl: gardenImageD,
    href: "/prestations/terrasses-allees",
  },
  {
    title: "Plantations",
    description:
      "Des arbres, arbustes et vivaces adaptes au sol, a l'exposition et au niveau d'entretien souhaite.",
    imageUrl: gardenImageE,
    href: "/prestations/plantations",
  },
  {
    title: "Creation de pelouse",
    description:
      "Preparation du terrain, semis ou pose pour obtenir une pelouse reguliere et facile a entretenir.",
    imageUrl: gardenImageF,
    href: "/prestations/creation-pelouse",
  },
  {
    title: "Taille et elagage",
    description:
      "Des interventions soignees pour maitriser les volumes et preserver durablement les vegetaux.",
    imageUrl: gardenImageG,
    href: "/prestations/taille-elagage",
  },
  {
    title: "Conseil paysager",
    description:
      "Une lecture professionnelle du terrain pour prioriser les travaux et faire les bons choix.",
    imageUrl: serviceImage,
    href: "/prestations/conseil-paysager",
  },
];

export const demoServicesHubPage: SitePage = {
  id: "services-hub",
  slug: "/prestations",
  title: "Prestations",
  sections: [
    { ...homeHeaderSection, id: "services-hub-header" },
    {
      id: "services-hub-hero",
      type: "services-hub-hero",
      variant: "ticker-a",
      fields: {
        backgroundImageUrl: gardenImageD,
        title: "Des prestations paysageres pour chaque exterieur",
        subtitle:
          "De la premiere idee a l'entretien regulier, notre equipe prend en charge chaque etape avec une organisation claire et un resultat durable.",
        cta: { label: "Nous contacter", href: "/contact" },
        socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
        services: demoHubServices,
      },
    },
    { ...homeCenteredServicesSection, id: "services-hub-why-us" },
    {
      id: "services-hub-bento",
      type: "services-hub-bento",
      variant: "generator-a",
      fields: {
        title: "Toutes nos prestations",
        subtitle:
          "Une offre complete qui s'adapte a la taille du terrain, a vos priorites et au niveau d'accompagnement recherche.",
        services: demoHubServices,
      },
    },
    {
      id: "services-hub-benefits",
      type: "sector-services",
      variant: "cards-a",
      fields: {
        title: "Ce que vous apporte notre accompagnement",
        cta: { label: "Nous contacter", href: "/contact" },
        services: [
          {
            icon: "tree",
            title: "Un projet coherent",
            description:
              "Chaque intervention s'inscrit dans une vision globale de votre exterieur et de ses usages.",
          },
          {
            icon: "clock",
            title: "Un suivi plus simple",
            description:
              "Les etapes, les priorites et les besoins d'entretien sont annonces de maniere lisible.",
          },
          {
            icon: "shield",
            title: "Des choix durables",
            description:
              "Les vegetaux, les materiaux et les solutions techniques sont adaptes aux contraintes du terrain.",
          },
        ],
      },
    },
    {
      id: "services-hub-reviews",
      type: "testimonials",
      variant: "projects-a",
      fields: {
        title: "Des projets concrets, racontes par nos clients",
        subtitle:
          "Chaque avis est relie a une realisation pour vous permettre de voir le contexte, les choix effectues et le resultat obtenu.",
        reviews: relatedRealisationProjects.slice(0, 6).map((project, index) => ({
          text:
            [
              "Nous avons ete accompagnes avec beaucoup de clarte, du premier rendez-vous jusqu'a la livraison. Le jardin est maintenant plus beau et surtout beaucoup plus simple a vivre.",
              "L'equipe a su comprendre nos priorites et proposer des solutions coherentes avec la maison. Le chantier est reste propre et le resultat correspond exactement a nos attentes.",
              "Les conseils sur les plantations et les circulations ont vraiment change notre maniere d'utiliser l'exterieur. Nous recommandons cette equipe sans hesitation.",
            ][index % 3],
          author: ["Cox", "Marie L.", "Thomas R."][index % 3],
          city: project.city,
          avatarUrl: portraitImage,
          projectTitle: project.title,
          projectHref: project.href,
          projectImageUrl: project.imageUrl,
        })),
      },
    },
    { ...homeFaqSection, id: "services-hub-faq" },
    { ...homeFooterSection, id: "services-hub-footer" },
  ],
};

const servicesHubBenefitsSection = demoServicesHubPage.sections.find(
  (section) => section.id === "services-hub-benefits",
) as Extract<SectionInstance, { type: "sector-services" }>;

export const demoServiceDetailPages: SitePage[] = demoHubServices.map(
  (service, index) => {
    const slug = service.href.split("/").filter(Boolean).at(-1) ?? `prestation-${index + 1}`;

    return {
      id: `service-detail-${slug}`,
      slug: service.href,
      title: service.title,
      sections: [
        { ...homeHeaderSection, id: `service-${slug}-header` },
        {
          id: `service-${slug}-hero`,
          type: "services-hub-hero",
          variant: "ticker-a",
          fields: {
            backgroundImageUrl: service.imageUrl,
            title: service.title,
            subtitle: service.description,
            cta: { label: "Nous contacter", href: "/contact" },
            socialProof: { ratingLabel: "Excellent", reviewCount: "500 avis" },
            services: demoHubServices,
          },
        },
        { ...homeCenteredServicesSection, id: `service-${slug}-why-us` },
        { ...homeTestimonialsSection, id: `service-${slug}-reviews` },
        {
          ...servicesHubBenefitsSection,
          id: `service-${slug}-benefits`,
          fields: {
            ...servicesHubBenefitsSection.fields,
            title: `Les points forts de ${service.title.toLowerCase()}`,
          },
        },
        { ...homeFaqSection, id: `service-${slug}-faq` },
        { ...homeFooterSection, id: `service-${slug}-footer` },
      ],
    };
  },
);

export const demoAboutPage: SitePage = {
  id: "about",
  slug: "/a-propos",
  title: "A propos",
  sections: [
    { ...homeHeaderSection, id: "about-header" },
    {
      id: "about-hero",
      type: "about-hero",
      variant: "overlap-a",
      fields: {
        title: "Une passion du paysage transmise sur le terrain",
        subtitle:
          "Depuis plus de 40 ans, notre entreprise imagine, realise et entretient des exterieurs durables avec la meme exigence de proximite.",
        primaryCta: { label: "Nous contacter", href: "/contact" },
        secondaryCta: { label: "Voir nos prestations", href: "/prestations" },
        imageUrl: mowingImage,
        imageAlt: "Paysagiste entretenant un jardin soigne",
      },
    },
    { ...homeServicesSection, id: "about-services" },
    {
      id: "about-story",
      type: "about-story",
      variant: "family-a",
      fields: {
        imageUrl: gardenImageD,
        imageAlt: "Jardin realise par l'entreprise familiale",
        title: "Une entreprise familiale depuis 1985",
        description:
          "Apres avoir grandi au coeur de l'entreprise creee par son pere, Julien a naturellement pris le relais pour poursuivre l'histoire familiale. Son approche associe le respect de la tradition du metier et la modernisation des pratiques pour repondre aux enjeux actuels du paysage.",
        highlights: [
          {
            icon: "tree",
            title: "Un savoir-faire transmis",
            description:
              "Une connaissance du terrain construite au fil des saisons et partagee entre les generations.",
          },
          {
            icon: "shield",
            title: "Des engagements concrets",
            description:
              "Des conseils transparents, des chantiers soignes et des choix durables pour chaque exterieur.",
          },
        ],
      },
    },
    { ...homeCenteredServicesSection, id: "about-why-us" },
    { ...blogContactSection, id: "about-contact" },
    { ...homeFaqSection, id: "about-faq" },
    { ...homeFooterSection, id: "about-footer" },
  ],
};

export const demoContactPage: SitePage = {
  id: "contact",
  slug: "/contact",
  title: "Contact",
  sections: [
    { ...homeHeaderSection, id: "contact-header" },
    {
      ...blogContactSection,
      id: "contact-hero",
      variant: "page-a",
      fields: {
        ...blogContactSection.fields,
        title: "Nous contacter",
        subtitle:
          "Parlez-nous de votre projet, de votre terrain et de vos contraintes. Notre equipe vous recontacte avec une premiere reponse claire et adaptee.",
        formTitle: "Formulaire de contact",
        submitLabel: "Envoyer le formulaire",
      },
    },
    { ...homeFaqSection, id: "contact-faq" },
    { ...homeFooterSection, id: "contact-footer" },
  ],
};

export const demoSitePages: SitePage[] = [
  demoHomePage,
  demoServicesHubPage,
  ...demoServiceDetailPages,
  demoAboutPage,
  demoContactPage,
  demoBlogPage,
  demoRealisationsPage,
  demoRealisationDetailPage,
  demoArticlePage,
  ...demoSectorPages,
];
