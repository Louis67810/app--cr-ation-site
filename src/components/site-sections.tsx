import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgePercent,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Home,
  Landmark,
  Leaf,
  Lightbulb,
  Menu,
  Phone,
  Scissors,
  ShieldCheck,
  Sprout,
  TreePine,
} from "lucide-react";
import { ArticleLeadQualifier } from "@/components/article-lead-qualifier";
import { ArticleQuiz } from "@/components/article-quiz";
import { BlogIndexSectionClient } from "@/components/blog-index-section-client";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { ContactFormSection } from "@/components/contact-form-section";
import { FaqAccordion } from "@/components/faq-accordion";
import { RealisationBeforeAfterShowcase } from "@/components/realisation-before-after-showcase";
import { ServiceAreasInteractive } from "@/components/service-areas-interactive";
import { SiteHeaderGlass } from "@/components/site-header-glass";
import { ServicesHubBento } from "@/components/services-hub-bento";
import { ServicesHubReviewsCarousel } from "@/components/services-hub-reviews-carousel";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import type {
  AboutHeroFields,
  AboutStoryFields,
  BlogAdviceFields,
  BlogIndexFields,
  ArticleDetailFields,
  ContactSectionFields,
  FaqFields,
  FooterFields,
  HeroFullImageFields,
  RecentProjectsFields,
  RealisationDetailBlock,
  RealisationDetailFields,
  RealisationsPageFields,
  SectionInstance,
  ServiceAreasFields,
  ServicesCardsFields,
  SiteHeaderGlassFields,
  SocialProofBandFields,
  SectorBenefitsFields,
  SectorExtraServicesFields,
  SectorHeroFields,
  SectorServicesFields,
  ServicesHubBentoFields,
  ServicesHubHeroFields,
  ServicesHubReviewsFields,
  TestimonialsFields,
  WorkMethodFields,
  SiteBrandSettings,
} from "@/lib/site-template";

type EditablePath = Array<string | number>;

type RenderSectionOptions = {
  editable?: boolean;
  disableLinks?: boolean;
  viewport?: "desktop" | "tablet" | "phone";
  onTextFocus?: () => void;
  onTextChange?: (path: EditablePath, value: string) => void;
  brand?: SiteBrandSettings;
};

function isEnabled(value?: string) {
  return ["1", "true", "oui", "yes", "on"].includes(
    value?.trim().toLowerCase() ?? "",
  );
}

function TemplateLink({
  href,
  className,
  style,
  children,
  ariaLabel,
  disabled,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className={className} style={style} aria-label={ariaLabel}>
        {children}
      </span>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link
        href={href}
        className={className}
        style={style}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} style={style} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

function EditableText({
  as: Component = "span",
  value,
  path,
  className,
  options,
}: {
  as?: "span" | "h1" | "h2" | "h3" | "p";
  value: string;
  path: EditablePath;
  className?: string;
  options?: RenderSectionOptions;
}) {
  if (!options?.editable) {
    return <Component className={className}>{value}</Component>;
  }

  return (
    <Component
      className={`${className ?? ""} outline-none focus:ring-2 focus:ring-[#0099ff]`}
      contentEditable
      data-editable-text
      suppressContentEditableWarning
      title="Double-clique pour modifier"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();
        options.onTextFocus?.();
        event.currentTarget.focus();
      }}
      onBlur={(event) => {
        options.onTextChange?.(path, event.currentTarget.innerText);
      }}
    >
      {value}
    </Component>
  );
}

function CtaLabel({
  value,
  path,
  options,
}: {
  value: string;
  path?: EditablePath;
  options?: RenderSectionOptions;
}) {
  if (options?.editable && path) {
    return <EditableText value={value} path={path} options={options} />;
  }

  return (
    <span className="cta-roll-text" data-text={value}>
      <span>{value}</span>
    </span>
  );
}

function SiteCta({
  variant,
  href,
  value,
  path,
  options,
}: {
  variant:
    "primary" | "secondary" | "explore" | "inverted" | "white" | "white-soft";
  href: string;
  value: string;
  path?: EditablePath;
  options?: RenderSectionOptions;
}) {
  const contactCta = variant === "primary" || variant === "inverted";
  const resolvedHref = contactCta ? "/contact" : href;
  const resolvedValue = contactCta ? "Nous contacter" : value;
  const className = {
    primary: "site-cta site-cta-primary cta-roll rounded-full text-[#00d494]",
    secondary:
      "site-cta site-cta-secondary cta-roll rounded-full text-white/80",
    explore: "service-explore-cta mt-6",
    inverted: "site-cta site-cta-inverted cta-roll rounded-full text-[#003441]",
    white:
      "site-cta cta-roll w-full justify-between rounded-full border-2 border-[var(--site-primary)] bg-white text-[var(--site-primary)] shadow-[0_101px_40px_rgba(0,0,0,0.01),0_57px_34px_rgba(0,0,0,0.05),0_25px_25px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.1),inset_0_2px_0_rgba(255,255,255,0.24)]",
    "white-soft":
      "site-cta cta-roll rounded-full border border-[rgba(0,0,0,0.04)] bg-white text-black/80",
  }[variant];

  return (
    <TemplateLink
      className={className}
      href={resolvedHref}
      disabled={options?.disableLinks}
    >
      {variant === "explore" ? (
        <>
          <span>{resolvedValue}</span>
          <ChevronRight size={20} strokeWidth={1.67} />
        </>
      ) : variant === "white" ? (
        <>
          {path ? (
            <CtaLabel
              value={resolvedValue}
              path={contactCta ? undefined : path}
              options={options}
            />
          ) : (
            <span>{resolvedValue}</span>
          )}
          <ChevronRight size={24} strokeWidth={2} />
        </>
      ) : path ? (
        <CtaLabel
          value={resolvedValue}
          path={contactCta ? undefined : path}
          options={options}
        />
      ) : (
        resolvedValue
      )}
    </TemplateLink>
  );
}

export function renderSection(
  section: SectionInstance,
  options?: RenderSectionOptions,
) {
  switch (section.type) {
    case "site-header":
      return (
        <SiteHeaderGlassA
          fields={section.fields}
          variant={section.variant}
          options={options}
        />
      );
    case "hero":
      return <HeroFullImageA fields={section.fields} options={options} />;
    case "social-proof":
      return <SocialProofBandA fields={section.fields} options={options} />;
    case "services":
      return (
        <ServicesCardsA
          fields={section.fields}
          centered={false}
          options={options}
        />
      );
    case "services-centered":
      return (
        <ServicesCardsA fields={section.fields} centered options={options} />
      );
    case "recent-projects":
      return (
        <RecentProjectsCityFilterA
          sectionId={section.id}
          fields={section.fields}
          options={options}
        />
      );
    case "work-method":
      return (
        <WorkMethodAlternatingA fields={section.fields} options={options} />
      );
    case "service-areas":
      return <ServiceAreasSectionA fields={section.fields} options={options} />;
    case "testimonials":
      return section.variant === "projects-a" ? (
        <ServicesHubReviewsA fields={section.fields} options={options} />
      ) : (
        <TestimonialsGalleryA fields={section.fields} options={options} />
      );
    case "blog-advice":
      return <BlogAdvicePostsA fields={section.fields} options={options} />;
    case "blog-index":
      return <BlogIndexSectionA fields={section.fields} options={options} />;
    case "article-detail":
      return <ArticleDetailA fields={section.fields} options={options} />;
    case "sector-hero":
      return <SectorHeroTickerA fields={section.fields} options={options} />;
    case "sector-services":
      return (
        <SectorServicesCardsA
          fields={section.fields}
          options={options}
          extraTopPadding={section.id === "services-hub-benefits"}
        />
      );
    case "sector-benefits":
      return <SectorBenefitsA fields={section.fields} options={options} />;
    case "lead-qualifier":
      return <ArticleLeadQualifier qualifier={section.fields} />;
    case "sector-extra-services":
      return <SectorExtraServicesA fields={section.fields} options={options} />;
    case "about-hero":
      return <AboutHeroA fields={section.fields} options={options} />;
    case "about-story":
      return <AboutStoryA fields={section.fields} options={options} />;
    case "services-hub-hero":
      return <ServicesHubHeroA fields={section.fields} options={options} />;
    case "services-hub-bento":
      return <ServicesHubBentoA fields={section.fields} options={options} />;
    case "realisations-page":
      return (
        <RealisationsPageA
          sectionId={section.id}
          fields={section.fields}
          options={options}
        />
      );
    case "realisation-detail":
      return <RealisationDetailA fields={section.fields} options={options} />;
    case "contact-section":
      return (
        <ContactSectionA
          fields={section.fields}
          variant={section.variant}
          options={options}
        />
      );
    case "faq":
      return <FaqSectionA fields={section.fields} options={options} />;
    case "site-footer":
      return (
        <SiteFooterLandscaperA fields={section.fields} options={options} />
      );
    default:
      return null;
  }
}

function SiteHeaderGlassA({
  fields,
  variant = "glass-a",
  options,
}: {
  fields: SiteHeaderGlassFields;
  variant?: "glass-a" | "light-a";
  options?: RenderSectionOptions;
}) {
  return (
    <SiteHeaderGlass fields={fields} variant={variant} options={options} />
  );

  /* Legacy header kept temporarily below while the interactive client header is stabilized. */
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";
  const light = variant === "light-a";
  const desktopNavigation = options?.viewport
    ? compact || tablet
      ? "hidden"
      : "flex"
    : "hidden xl:flex";
  const mobileNavigation = options?.viewport
    ? compact || tablet
      ? "block"
      : "hidden"
    : "block xl:hidden";
  const phone = fields.phone?.trim() || "06 00 00 00 00";
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;

  return (
    <header
      className={`${options?.viewport ? "absolute" : "relative md:fixed"} inset-x-0 top-0 z-[90] font-[var(--font-inter)] ${
        light
          ? "border-b border-black/10 bg-white/[0.03] text-black backdrop-blur-md transition-colors has-[.site-mega-root:hover]:bg-white/80 has-[.site-mega-root:focus-within]:bg-white/80"
          : "border-b border-white/10 bg-white/[0.03] text-white backdrop-blur-md transition-colors has-[.site-mega-root:hover]:bg-black/60 has-[.site-mega-root:focus-within]:bg-black/60"
      }`}
    >
      <div className="relative z-20 mx-auto flex min-h-20 max-w-[1600px] items-center justify-between px-5 py-[10px] md:px-10 xl:px-20">
        <TemplateLink
          href="/"
          className={`typo-body-small flex h-11 min-w-24 items-center justify-center rounded-lg px-3 ${
            light ? "bg-black/[0.06] text-[#102d28]" : "bg-white/10 text-white"
          }`}
          ariaLabel="Accueil"
          disabled={options?.disableLinks}
        >
          {fields.logoImageUrl ? (
            <span
              className="h-8 w-20 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${fields.logoImageUrl})` }}
              role="img"
              aria-label={fields.logoLabel || "Logo"}
            />
          ) : (
            <EditableText
              value={fields.logoLabel}
              path={["logoLabel"]}
              options={options}
            />
          )}
        </TemplateLink>
        <nav
          aria-label="Navigation principale"
          className={`${desktopNavigation} typo-body-small h-20 items-center gap-7 leading-none`}
        >
          <DesktopMegaMenu
            label="Prestations"
            light={light}
            disabled={options?.disableLinks}
            kind="services"
            preview={Boolean(options?.viewport)}
          />
          <TemplateLink
            href="/realisations"
            className="whitespace-nowrap"
            disabled={options?.disableLinks}
          >
            Réalisations
          </TemplateLink>
          <TemplateLink
            href="/a-propos"
            className="whitespace-nowrap"
            disabled={options?.disableLinks}
          >
            À propos
          </TemplateLink>
          <DesktopMegaMenu
            label="Ressources"
            light={light}
            disabled={options?.disableLinks}
            kind="resources"
            preview={Boolean(options?.viewport)}
          />
        </nav>
        <TemplateLink
          href={phoneHref}
          ariaLabel={`Appeler le ${phone}`}
          disabled={options?.disableLinks}
          className={`${desktopNavigation} site-cta site-cta-primary cta-roll rounded-full text-[#00d494]`}
        >
          <Phone size={16} />
          <CtaLabel
            value={fields.phoneLabel?.trim() || "Appeler"}
            path={["phoneLabel"]}
            options={options}
          />
        </TemplateLink>
        <details className={`${mobileNavigation} group relative`}>
          <summary
            aria-label="Ouvrir le menu"
            className={`grid size-11 cursor-pointer list-none place-items-center rounded-full [&::-webkit-details-marker]:hidden ${light ? "bg-black/[0.06]" : "bg-white/10"}`}
          >
            <Menu size={21} />
          </summary>
          <MobileNavigation
            phone={phone}
            phoneHref={phoneHref}
            light={light}
            disabled={options?.disableLinks}
          />
        </details>
      </div>
    </header>
  );
}

const serviceMenuGroups: Array<{
  title: string;
  links: Array<readonly [string, string]>;
}> = [
  {
    title: "Créer",
    links: [
      ["Création de jardin", "/prestations/creation-jardin"],
      ["Plantations", "/prestations/plantations"],
      ["Création de pelouse", "/prestations/creation-pelouse"],
    ],
  },
  {
    title: "Conception",
    links: [
      ["Entretien paysager", "/prestations/entretien-paysager"],
      ["Taille et élagage", "/prestations/taille-elagage"],
      ["Conseil paysager", "/prestations/conseil-paysager"],
    ],
  },
  {
    title: "Aménager",
    links: [
      ["Aménagement extérieur", "/prestations/amenagement-exterieur"],
      ["Terrasses et allées", "/prestations/terrasses-allees"],
      ["Toutes les prestations", "/prestations"],
    ],
  },
];

const resourceCards = [
  {
    title: "Conseils & articles",
    description:
      "Des réponses concrètes pour mieux comprendre et entretenir votre extérieur.",
    href: "/blog",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Nos réalisations",
    description:
      "Découvrez des jardins et aménagements réalisés pour nos clients.",
    href: "/realisations",
    image:
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Notre approche",
    description:
      "Une méthode simple, humaine et durable pour chaque projet paysager.",
    href: "/a-propos",
    image:
      "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=900&q=85",
  },
] as const;

function DesktopMegaMenu({
  label,
  light,
  disabled,
  kind,
  preview,
}: {
  label: string;
  light: boolean;
  disabled?: boolean;
  kind: "services" | "resources";
  preview: boolean;
}) {
  const panelPosition = preview
    ? "absolute left-0 right-0 top-full"
    : "fixed inset-x-0 top-20";
  const panelTheme = light
    ? "border-black/10 bg-white/80 text-black backdrop-blur-md"
    : "border-white/10 bg-black/60 text-white backdrop-blur-md";

  return (
    <div className="site-mega-root group/menu flex h-full items-center">
      <button
        type="button"
        className="flex h-full items-center gap-1.5 whitespace-nowrap"
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          size={14}
          className="transition-transform duration-200 group-hover/menu:rotate-180 group-focus-within/menu:rotate-180"
        />
      </button>
      {!disabled ? (
        <span className="pointer-events-none fixed inset-x-0 bottom-0 top-20 -z-10 hidden bg-black/20 backdrop-blur-[7px] group-hover/menu:block group-focus-within/menu:block" />
      ) : null}
      <div
        className={`${panelPosition} ${panelTheme} invisible border-b opacity-0 shadow-[0_30px_70px_rgba(0,0,0,.18)] transition-opacity duration-200 group-hover/menu:visible group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:opacity-100`}
      >
        <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 xl:px-20">
          {kind === "services" ? (
            <div className="grid grid-cols-3 gap-10">
              {serviceMenuGroups.map((group) => (
                <div key={group.title}>
                  <TemplateLink
                    href="/prestations"
                    disabled={disabled}
                    className="typo-h5 inline-flex"
                  >
                    {group.title}
                  </TemplateLink>
                  <div className="mt-4 divide-y divide-current/10">
                    {group.links.map(([title, href]) => (
                      <TemplateLink
                        key={href}
                        href={href}
                        disabled={disabled}
                        className="typo-body-small flex items-center justify-between py-2 leading-[1.5]"
                      >
                        {title}
                        <ArrowUpRight size={15} className="opacity-40" />
                      </TemplateLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {resourceCards.map((card) => (
                <TemplateLink
                  key={card.href}
                  href={card.href}
                  disabled={disabled}
                  className="group/card block"
                >
                  <span className="block aspect-[1.9/1] overflow-hidden rounded-[16px] bg-white/10">
                    <span
                      className="block h-full w-full bg-cover bg-center transition-transform duration-300 group-hover/card:scale-[1.025]"
                      style={{ backgroundImage: `url(${card.image})` }}
                    />
                  </span>
                  <strong className="typo-h5 mt-4 block">{card.title}</strong>
                  <span className="typo-body-small mt-2 block leading-[1.5] opacity-60">
                    {card.description}
                  </span>
                </TemplateLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileNavigation({
  phone,
  phoneHref,
  light,
  disabled,
}: {
  phone: string;
  phoneHref: string;
  light: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`absolute right-0 top-[54px] w-[min(360px,calc(100vw-24px))] overflow-y-auto rounded-[20px] border p-4 shadow-2xl backdrop-blur-md ${light ? "border-black/10 bg-white/[0.03] text-black" : "border-white/10 bg-white/[0.03] text-white"}`}
    >
      <details className="group/sub border-b border-current/10 py-1">
        <summary className="typo-body-small flex cursor-pointer list-none items-center justify-between py-3 leading-none [&::-webkit-details-marker]:hidden">
          Prestations
          <ChevronDown
            size={16}
            className="transition group-open/sub:rotate-180"
          />
        </summary>
        <div className="grid gap-1 pb-3 pl-2">
          {serviceMenuGroups
            .flatMap((group) => group.links)
            .map(([title, href]) => (
              <TemplateLink
                key={href}
                href={href}
                disabled={disabled}
                className="typo-body-small py-2 leading-none opacity-70"
              >
                {title}
              </TemplateLink>
            ))}
        </div>
      </details>
      <TemplateLink
        href="/realisations"
        disabled={disabled}
        className="typo-body-small block border-b border-current/10 py-4 leading-none"
      >
        Réalisations
      </TemplateLink>
      <TemplateLink
        href="/a-propos"
        disabled={disabled}
        className="typo-body-small block border-b border-current/10 py-4 leading-none"
      >
        À propos
      </TemplateLink>
      <details className="group/sub border-b border-current/10 py-1">
        <summary className="typo-body-small flex cursor-pointer list-none items-center justify-between py-3 leading-none [&::-webkit-details-marker]:hidden">
          Ressources
          <ChevronDown
            size={16}
            className="transition group-open/sub:rotate-180"
          />
        </summary>
        <div className="grid gap-1 pb-3 pl-2">
          {resourceCards.map((card) => (
            <TemplateLink
              key={card.href}
              href={card.href}
              disabled={disabled}
              className="typo-body-small py-2 leading-none opacity-70"
            >
              {card.title}
            </TemplateLink>
          ))}
        </div>
      </details>
      <TemplateLink
        href="/contact"
        disabled={disabled}
        className="typo-body-small block border-b border-current/10 py-4 leading-none"
      >
        Contact
      </TemplateLink>
      <TemplateLink
        href={phoneHref}
        disabled={disabled}
        className="site-cta site-cta-primary cta-roll mt-4 rounded-full text-[#00d494]"
      >
        <Phone size={16} /> Appeler · {phone}
      </TemplateLink>
    </div>
  );
}

function HeroFullImageA({
  fields,
  options,
}: {
  fields: HeroFullImageFields;
  options?: RenderSectionOptions;
}) {
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";

  return (
    <section className="relative min-h-[var(--site-hero-height,95vh)] overflow-hidden bg-[#162539] font-[var(--font-inter)] text-white">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{
          backgroundImage: `url(${fields.backgroundImageUrl})`,
          backgroundPosition: "top center",
        }}
      />
      <div
        className={`absolute inset-0 ${
          compact
            ? "bg-[radial-gradient(40.85%_40.85%_at_50%_34%,rgba(0,0,0,0.2232)_0%,rgba(0,0,0,0.93)_100%)]"
            : tablet
              ? "bg-[radial-gradient(40.85%_40.85%_at_50%_50%,rgba(0,0,0,0.2232)_0%,rgba(0,0,0,0.93)_100%)]"
              : "bg-[radial-gradient(40.85%_40.85%_at_50%_34%,rgba(0,0,0,0.2232)_0%,rgba(0,0,0,0.93)_100%)] md:bg-[radial-gradient(40.85%_40.85%_at_50%_50%,rgba(0,0,0,0.2232)_0%,rgba(0,0,0,0.93)_100%)]"
        }`}
      />
      <div
        className={`relative z-10 mx-auto flex min-h-[var(--site-hero-height,95vh)] max-w-[1600px] items-end px-5 pb-12 md:px-10 md:pb-20 xl:px-20 ${
          compact ? "pt-44" : "pt-44 md:pt-28"
        }`}
      >
        <div
          className={`grid w-full items-end ${
            compact || tablet
              ? "grid-cols-1 gap-10"
              : "gap-16 lg:grid-cols-[minmax(0,988px)_minmax(320px,448px)] lg:justify-between"
          }`}
        >
          <div className={compact ? "max-w-[330px]" : "max-w-[988px]"}>
            <EditableText
              as="h1"
              value={fields.title}
              path={["title"]}
              options={options}
              className="typo-h1 text-white"
            />
            <EditableText
              as="p"
              value={fields.subtitle}
              path={["subtitle"]}
              options={options}
              className="typo-body-large mt-7 max-w-[858px] text-white/88"
            />
            <div
              className={`hero-cta-group mt-7 flex flex-wrap gap-3 ${
                compact ? "flex-col" : "max-md:flex-col"
              }`}
            >
              <SiteCta
                variant="secondary"
                href={fields.primaryCta.href}
                value={fields.primaryCta.label}
                path={["primaryCta", "label"]}
                options={options}
              />
              <SiteCta
                variant="primary"
                href={fields.secondaryCta.href}
                value={fields.secondaryCta.label}
                path={["secondaryCta", "label"]}
                options={options}
              />
            </div>
          </div>
          <aside
            className={`w-full max-w-[320px] rounded-2xl border border-white/[0.04] bg-white/[0.04] p-4 shadow-2xl shadow-black/30 backdrop-blur-[12px] ${
              compact ? "hidden" : "lg:justify-self-end"
            }`}
          >
            <Image
              src="/images/google-logo.svg"
              width={68}
              height={22}
              alt="Google"
              className="h-auto w-[68px]"
            />
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <div className="typo-body-small flex flex-wrap items-center gap-[11px]">
                <EditableText
                  value={fields.reviewRatingLabel}
                  path={["reviewRatingLabel"]}
                  options={options}
                  className="text-white/80"
                />
                <span className="h-5 w-px bg-white/14" />
                <span className="review-stars text-[20px] leading-none tracking-[1px] text-[#F6BB06]">
                  {"\u2605\u2605\u2605\u2605\u2605"}
                </span>
                <EditableText
                  value={fields.reviewCount}
                  path={["reviewCount"]}
                  options={options}
                  className="font-medium text-white"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function SocialProofBandA({
  fields,
  options,
}: {
  fields: SocialProofBandFields;
  options?: RenderSectionOptions;
}) {
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";

  return (
    <section className="bg-[var(--site-primary)] px-5 py-10 font-[var(--font-inter)] text-white">
      <div
        className={`mx-auto grid max-w-[1600px] gap-8 ${
          compact
            ? "grid-cols-1"
            : tablet
              ? "grid-cols-3"
              : "md:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]"
        }`}
      >
        {fields.stats.map((stat, index) => (
          <div
            key={`${stat.value}-${index}`}
            className={`social-proof-item px-4 text-center md:px-10 ${
              index > 0 ? "social-proof-divider" : ""
            }`}
          >
            <EditableText
              value={stat.value}
              path={["stats", index, "value"]}
              options={options}
              className="typo-stat block text-[var(--site-accent)]"
            />
            <EditableText
              as="p"
              value={stat.label}
              path={["stats", index, "label"]}
              options={options}
              className="typo-body-small mx-auto mt-4 max-w-[390px] text-white/75"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesCardsA({
  fields,
  centered = false,
  options,
}: {
  fields: ServicesCardsFields;
  centered?: boolean;
  options?: RenderSectionOptions;
}) {
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";

  return (
    <section
      id={centered ? undefined : "prestations"}
      className="bg-white px-5 pb-20 pt-32 font-[var(--font-inter)] md:px-10 md:pt-[192px] md:pb-28 xl:px-20"
    >
      <div className="mx-auto max-w-[1600px]">
        <div
          className={`flex gap-6 pb-14 ${
            centered
              ? "flex-col items-center text-center"
              : "items-center justify-between border-b border-black/15"
          }`}
        >
          <div>
            {centered ? (
              <SocialProofPill
                ratingLabel={fields.socialProof?.ratingLabel ?? "Excellent"}
                reviewCount={fields.socialProof?.reviewCount ?? "500 avis"}
                ratingPath={["socialProof", "ratingLabel"]}
                countPath={["socialProof", "reviewCount"]}
                align="center"
                options={options}
              />
            ) : null}
            <EditableText
              as="h2"
              value={fields.title}
              path={["title"]}
              options={options}
              className={`typo-h2 text-[#0f1112] ${
                centered ? "mx-auto mt-5 max-w-[760px]" : ""
              }`}
            />
          </div>
          <div className={centered ? "block" : "hidden md:block"}>
            <SiteCta
              variant="primary"
              href={fields.cta.href}
              value={fields.cta.label}
              path={["cta", "label"]}
              options={options}
            />
          </div>
          {centered ? (
            <div className="h-px w-[300px] max-w-full bg-black/15" />
          ) : null}
        </div>
        <div
          className={`${centered ? "mt-10" : "mt-20"} grid gap-5 ${
            compact || tablet ? "grid-cols-1" : "lg:grid-cols-3"
          }`}
        >
          {fields.services.map((service, index) => (
            <article
              key={`${service.href}-${index}`}
              className="service-card-shadow relative aspect-[514/638] min-h-[520px] w-full overflow-hidden rounded-[18px] border border-black/[0.06] bg-white"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${service.imageUrl})` }}
              />
              <div className="absolute inset-x-0 bottom-0 h-[60%] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.72)_42%,#000_100%)]" />
              <div className="absolute inset-x-6 bottom-6 z-10 flex flex-col lg:inset-x-8 lg:bottom-8">
                <EditableText
                  as="h3"
                  value={service.title}
                  path={["services", index, "title"]}
                  options={options}
                  className="typo-h4 text-white"
                />
                <EditableText
                  as="p"
                  value={service.description}
                  path={["services", index, "description"]}
                  options={options}
                  className="typo-body-medium mt-4 w-full text-white/75"
                />
                <SiteCta
                  variant="explore"
                  href={service.href}
                  value="Découvrir la prestation"
                  options={options}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProofPill({
  ratingLabel,
  reviewCount,
  ratingPath,
  countPath,
  align = "center",
  tone = "light",
  options,
}: {
  ratingLabel: string;
  reviewCount: string;
  ratingPath: EditablePath;
  countPath: EditablePath;
  align?: "left" | "center";
  tone?: "light" | "dark";
  options?: RenderSectionOptions;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={`flex ${align === "center" ? "justify-center" : "justify-start"}`}
    >
      <div
        className={`social-proof-pill inline-flex min-h-[73px] max-w-full items-center gap-3 overflow-hidden rounded-[19px] px-5 py-4 backdrop-blur-[6.3px] max-sm:flex-wrap max-sm:gap-3 ${
          dark
            ? "border border-white/[0.04] bg-white/[0.03] shadow-none"
            : "border border-black/[0.06] bg-white/70 shadow-[0_6px_4px_rgba(0,0,0,0.01),0_3px_3px_rgba(0,0,0,0.02),0_1px_1px_rgba(0,0,0,0.02)]"
        }`}
      >
        <Image
          src="/images/google-logo.svg"
          width={110}
          height={36}
          alt="Google"
          className="h-auto w-[100px] shrink-0"
        />
        <span
          className={`h-[18px] w-px shrink-0 ${dark ? "bg-white/14" : "bg-black/14"}`}
        />
        <EditableText
          value={ratingLabel}
          path={ratingPath}
          options={options}
          className={`typo-body-small font-medium ${dark ? "text-white/80" : "text-black/78"}`}
        />
        <span className="review-stars shrink-0 text-[19px] leading-none tracking-[1px] text-[#F6BB06]">
          {"\u2605\u2605\u2605\u2605\u2605"}
        </span>
        <span
          className={`h-[18px] w-px shrink-0 ${dark ? "bg-white/14" : "bg-black/14"}`}
        />
        <EditableText
          value={reviewCount}
          path={countPath}
          options={options}
          className={`typo-body-small font-medium ${dark ? "text-white" : "text-black/78"}`}
        />
      </div>
    </div>
  );
}

function RecentProjectsCityFilterA({
  sectionId,
  fields,
  options,
}: {
  sectionId: string;
  fields: RecentProjectsFields;
  options?: RenderSectionOptions;
}) {
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";
  const groupName = `recent-projects-${sectionId}`;
  const cities = fields.cities.filter((city) => city.trim().length > 0);

  return (
    <section className="recent-projects-section border-b border-black/10 bg-[#f7f7f7] px-5 pt-20 font-[var(--font-inter)] md:px-10 md:pt-28 xl:px-20">
      <div className="mx-auto max-w-[1600px] text-center">
        <SocialProofPill
          ratingLabel={fields.socialProof.ratingLabel}
          reviewCount={fields.socialProof.reviewCount}
          ratingPath={["socialProof", "ratingLabel"]}
          countPath={["socialProof", "reviewCount"]}
          align="center"
          options={options}
        />
        <EditableText
          as="h2"
          value={fields.title}
          path={["title"]}
          options={options}
          className="typo-h1 mx-auto mt-5 max-w-[780px] text-[#0f1112]"
        />
        <EditableText
          as="p"
          value={fields.subtitle}
          path={["subtitle"]}
          options={options}
          className="typo-body-large mx-auto mt-4 max-w-[540px] text-black/68"
        />
        <div className="mt-5">
          <SiteCta
            variant="primary"
            href={fields.cta.href}
            value={fields.cta.label}
            path={["cta", "label"]}
            options={options}
          />
        </div>

        <div className="recent-projects-tabs mx-auto mt-14 inline-flex max-w-full items-center gap-2 overflow-x-auto rounded-full border border-black/10 bg-white p-2.5 shadow-[0_13px_5px_rgba(0,0,0,0.01),0_7px_4px_rgba(0,0,0,0.03),0_3px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.05)]">
          {cities.map((city, index) => (
            <label
              key={`${city}-${index}`}
              className="typo-body-small cursor-pointer whitespace-nowrap rounded-full px-4 py-0.5 text-center text-black/68 transition-colors has-[:checked]:bg-black/[0.03]"
            >
              <input
                type="radio"
                name={groupName}
                defaultChecked={index === 0}
                className="peer sr-only"
              />
              <EditableText
                value={city}
                path={["cities", index]}
                options={options}
              />
            </label>
          ))}
        </div>

        <div
          className={`recent-projects-panels relative mt-10 overflow-hidden ${
            compact
              ? "columns-1"
              : tablet
                ? "columns-2"
                : "columns-1 md:columns-2 xl:columns-3"
          } gap-5 text-left`}
        >
          {cities.map((city, cityIndex) => (
            <div
              key={`${city}-panel-${cityIndex}`}
              className={`recent-projects-panel city-panel-${cityIndex} hidden`}
            >
              {fields.projects
                .filter((project) => project.city === city)
                .map((photo, photoIndex) => (
                  <figure
                    key={`${photo.imageUrl}-${photoIndex}`}
                    className="service-card-shadow mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-black/[0.09] bg-white p-0 last:mb-0"
                    style={{
                      ["--project-card-height" as string]: `${[548, 419, 545, 687, 458][photoIndex % 5]}px`,
                    }}
                  >
                    {isEnabled(photo.compareEnabled) ? (
                      <BeforeAfterSlider
                        beforeImageUrl={photo.beforeImageUrl}
                        afterImageUrl={photo.afterImageUrl}
                        alt={photo.alt}
                        className="h-[var(--project-card-height)]"
                      />
                    ) : (
                      <div
                        className="h-[var(--project-card-height)] bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${photo.imageUrl})`,
                        }}
                        role="img"
                        aria-label={photo.alt}
                      />
                    )}
                  </figure>
                ))}
            </div>
          ))}
          <div className="pointer-events-none absolute inset-x-[-1px] bottom-0 h-80 bg-[linear-gradient(178.53deg,rgba(247,247,247,0)_1.25%,#f7f7f7_98.75%)]" />
        </div>
      </div>
    </section>
  );
}

function WorkMethodAlternatingA({
  fields,
  options,
}: {
  fields: WorkMethodFields;
  options?: RenderSectionOptions;
}) {
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";

  return (
    <section className="bg-[#f6f6f4] py-20 font-[var(--font-inter)] md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10 xl:px-20">
        <div className="max-w-[940px] text-left">
          <SocialProofPill
            ratingLabel={fields.socialProof.ratingLabel}
            reviewCount={fields.socialProof.reviewCount}
            ratingPath={["socialProof", "ratingLabel"]}
            countPath={["socialProof", "reviewCount"]}
            align="left"
            options={options}
          />
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h1 mt-9 text-[#0f1112]"
          />
          <EditableText
            as="p"
            value={fields.subtitle}
            path={["subtitle"]}
            options={options}
            className="typo-body-large mt-4 max-w-[540px] text-black/68"
          />
          <div className="mt-6">
            <SiteCta
              variant="primary"
              href={fields.cta.href}
              value={fields.cta.label}
              path={["cta", "label"]}
              options={options}
            />
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-5">
        {fields.steps.map((step, index) => {
          const imageFirst = index % 2 === 0;
          const stacked = compact || tablet;

          return (
            <article
              key={`${step.title}-${index}`}
              className={`grid overflow-hidden bg-[#f6f6f4] ${
                stacked ? "grid-cols-1" : "grid-cols-[0.78fr_1fr]"
              }`}
            >
              <div
                className={`min-h-[360px] bg-cover bg-center max-md:order-2 md:min-h-[520px] lg:min-h-[868px] ${
                  compact ? "order-2" : !imageFirst && !stacked ? "order-2" : ""
                }`}
                style={{ backgroundImage: `url(${step.imageUrl})` }}
                role="img"
                aria-label={step.title}
              />
              <div
                className={`flex flex-col justify-center gap-8 px-5 py-10 max-md:order-1 md:px-12 lg:px-24 lg:py-24 ${
                  compact ? "order-1" : ""
                }`}
              >
                <EditableText
                  as="h3"
                  value={step.title}
                  path={["steps", index, "title"]}
                  options={options}
                  className="typo-h3 text-black"
                />
                <EditableText
                  as="p"
                  value={step.description}
                  path={["steps", index, "description"]}
                  options={options}
                  className="typo-body-large text-black/68"
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ServiceAreasSectionA({
  fields,
  options,
}: {
  fields: ServiceAreasFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="bg-white px-5 py-20 font-[var(--font-inter)] md:px-10 md:py-28 xl:px-20">
      <div className="mx-auto max-w-[1600px]">
        <SocialProofPill
          ratingLabel={fields.socialProof.ratingLabel}
          reviewCount={fields.socialProof.reviewCount}
          ratingPath={["socialProof", "ratingLabel"]}
          countPath={["socialProof", "reviewCount"]}
          align="center"
          options={options}
        />
        <div className="mx-auto mt-4 flex max-w-[1040px] flex-col items-center gap-4 text-center">
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h1 text-[#0f1112]"
          />
          <EditableText
            as="p"
            value={fields.subtitle}
            path={["subtitle"]}
            options={options}
            className="typo-body-large max-w-[876px] text-black/68"
          />
        </div>
        <div className="mt-4 flex justify-center">
          <SiteCta
            variant="primary"
            href={fields.cta.href}
            value={fields.cta.label}
            path={["cta", "label"]}
            options={options}
          />
        </div>
        <div className="mx-auto mt-10 h-px w-[418px] max-w-full bg-black/10" />
        <div className="mt-24 max-lg:mt-14">
          <ServiceAreasInteractive
            areas={fields.areas}
            disableLinks={options?.disableLinks}
          />
        </div>
      </div>
    </section>
  );
}

function TestimonialsGalleryA({
  fields,
  options,
}: {
  fields: TestimonialsFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="bg-[#f6f6f4] px-5 py-20 font-[var(--font-inter)] md:px-10 md:py-28 xl:px-20">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-start justify-between gap-6 max-md:flex-col">
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h2 max-w-[946px] text-[#0f1112]"
          />
          <SocialProofPill
            ratingLabel={fields.socialProof.ratingLabel}
            reviewCount={fields.socialProof.reviewCount}
            ratingPath={["socialProof", "ratingLabel"]}
            countPath={["socialProof", "reviewCount"]}
            align="left"
            options={options}
          />
        </div>
        <div className="mt-12 h-px w-full bg-black/17" />
        <TestimonialsCarousel reviews={fields.reviews} images={fields.images} />
      </div>
    </section>
  );
}

function BlogAdvicePostsA({
  fields,
  options,
}: {
  fields: BlogAdviceFields;
  options?: RenderSectionOptions;
}) {
  const posts = fields.posts;
  const featured = posts[0];
  const gridPosts = posts.slice(1, 4);

  return (
    <section className="bg-white px-5 py-20 font-[var(--font-inter)] md:px-10 md:py-28 xl:px-20">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start">
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h2 text-[#0f1112]"
          />
          <SiteCta
            variant="primary"
            href={fields.cta.href}
            value={fields.cta.label}
            path={["cta", "label"]}
            options={options}
          />
        </div>
        <div className="mt-12 h-px w-full bg-black/17" />
        {featured ? (
          <article className="mt-24 grid items-center gap-16 lg:grid-cols-[minmax(0,684px)_minmax(0,813px)]">
            <BlogPostText
              post={featured}
              index={0}
              featured
              options={options}
            />
            <BlogPostImage post={featured} className="h-[542px]" />
          </article>
        ) : null}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {gridPosts.map((post, index) => (
            <article key={`${post.title}-${index}`} className="grid gap-8">
              <BlogPostImage post={post} className="h-[330px]" />
              <BlogPostText post={post} index={index + 1} options={options} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogIndexSectionA({
  fields,
  options,
}: {
  fields: BlogIndexFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="bg-white px-5 py-20 font-[var(--font-inter)] md:px-10 md:py-28 xl:px-20">
      <div className="mx-auto max-w-[1600px]">
        <BlogIndexSectionClient
          title={
            <EditableText
              as="h2"
              value={fields.title}
              path={["title"]}
              options={options}
              className="typo-h2 text-[#0f1112]"
            />
          }
          posts={fields.posts}
          searchPlaceholder={fields.searchPlaceholder}
          loadMoreLabel={fields.loadMoreLabel}
          disableLinks={options?.disableLinks}
        />
      </div>
    </section>
  );
}

function ContactSectionA({
  fields,
  variant = "form-a",
  options,
}: {
  fields: ContactSectionFields;
  variant?: "form-a" | "page-a";
  options?: RenderSectionOptions;
}) {
  if (variant === "page-a") {
    return (
      <section
        id="contact"
        className="relative min-h-[1092px] overflow-hidden bg-[#162539] font-[var(--font-inter)] text-white"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fields.backgroundImageUrl})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(85.14%_232.52%_at_140.9%_44.55%,rgba(0,0,0,0.2232)_0%,rgba(0,0,0,0.93)_100%)]" />
        <div className="relative mx-auto grid min-h-[1092px] max-w-[1600px] items-center gap-14 px-5 pb-20 pt-40 md:px-10 md:pt-44 lg:grid-cols-[minmax(0,634px)_minmax(380px,509px)] lg:justify-between lg:px-20 lg:py-[180px] xl:px-[134px]">
          <div className="flex flex-col items-start">
            <SocialProofPill
              ratingLabel={fields.socialProof.ratingLabel}
              reviewCount={fields.socialProof.reviewCount}
              ratingPath={["socialProof", "ratingLabel"]}
              countPath={["socialProof", "reviewCount"]}
              align="left"
              tone="dark"
              options={options}
            />
            <EditableText
              as="h1"
              value={fields.title}
              path={["title"]}
              options={options}
              className="typo-h2 mt-7 text-white"
            />
            <EditableText
              as="p"
              value={fields.subtitle}
              path={["subtitle"]}
              options={options}
              className="typo-body-large mt-7 max-w-[634px] text-white/80"
            />
          </div>

          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-[37px] md:p-8 lg:justify-self-end">
            <EditableText
              value={fields.formTitle}
              path={["formTitle"]}
              options={options}
              className="block text-[28px] font-semibold leading-[1.23] tracking-[-0.02em] text-white md:text-[32px]"
            />
            <div className="mt-8">
              <ContactFormSection
                fields={fields.fields}
                submitLabel={fields.submitLabel}
                size="large"
                recipientEmail={options?.brand?.email}
              />
            </div>
            <p className="mt-7 text-center text-[16px] font-semibold text-white">
              Ils nous ont fait confiance
            </p>
            <div
              className="mt-3 grid grid-cols-5 gap-3"
              aria-label="Entreprises clientes"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={`contact-proof-${index}`}
                  className="h-[33px] rounded bg-white/[0.06]"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="contact"
      className="bg-white px-5 py-20 font-[var(--font-inter)] md:px-10 md:py-28 xl:px-20"
    >
      <div className="relative mx-auto min-h-[890px] max-w-[1600px] overflow-hidden rounded-[48px] border border-black/16 bg-[#162539] max-lg:min-h-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fields.backgroundImageUrl})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(81.31%_221.66%_at_131.28%_-4.49%,rgba(0,0,0,0.2184)_0%,rgba(0,0,0,0.91)_100%)]" />
        <div className="relative grid gap-12 px-6 py-16 md:px-12 lg:grid-cols-[minmax(0,615px)_minmax(360px,509px)] lg:justify-between lg:px-[8.4%] lg:py-[99px]">
          <div className="flex flex-col items-start gap-6 pt-16 max-lg:pt-0">
            <EditableText
              as="h2"
              value={fields.title}
              path={["title"]}
              options={options}
              className="typo-h2 max-w-[615px] text-white"
            />
            <EditableText
              as="p"
              value={fields.subtitle}
              path={["subtitle"]}
              options={options}
              className="typo-body-small max-w-[584px] text-white"
            />
            <SiteCta
              variant="secondary"
              href={fields.cta.href}
              value={fields.cta.label}
              path={["cta", "label"]}
              options={options}
            />
            <div className="mt-auto max-lg:mt-8">
              <SocialProofPill
                ratingLabel={fields.socialProof.ratingLabel}
                reviewCount={fields.socialProof.reviewCount}
                ratingPath={["socialProof", "ratingLabel"]}
                countPath={["socialProof", "reviewCount"]}
                align="left"
                tone="dark"
                options={options}
              />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-[37px]">
            <EditableText
              value={fields.formTitle}
              path={["formTitle"]}
              options={options}
              className="typo-h5 block font-semibold text-white"
            />
            <div className="mt-8">
              <ContactFormSection
                fields={fields.fields}
                submitLabel={fields.submitLabel}
                recipientEmail={options?.brand?.email}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function slugifyHeading(value: string, index: number) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "section"}-${index}`;
}

function ArticleDetailA({
  fields,
  options,
}: {
  fields: ArticleDetailFields;
  options?: RenderSectionOptions;
}) {
  const headings = fields.blocks
    .map((block, index) =>
      block.kind === "heading"
        ? {
            id: slugifyHeading(block.text, index),
            text: block.text,
            level: block.level,
          }
        : null,
    )
    .filter(Boolean) as Array<{ id: string; text: string; level: "h2" | "h3" }>;

  return (
    <section className="bg-[#f6f6f4] font-[var(--font-inter)] text-[#0f1112]">
      <div className="px-5 pb-20 pt-40 md:px-10 md:pt-48 xl:px-20">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,760px)_auto]">
            <div className="flex flex-col items-start gap-6">
              <nav className="typo-body-small flex flex-wrap items-center gap-2 text-black/80">
                {fields.breadcrumbs.map((item, index) => (
                  <span
                    key={`${item.href}-${index}`}
                    className="inline-flex items-center gap-2"
                  >
                    <TemplateLink
                      href={item.href}
                      disabled={options?.disableLinks}
                      className="hover:text-[var(--site-primary)]"
                    >
                      {item.label}
                    </TemplateLink>
                    {index < fields.breadcrumbs.length - 1 ? (
                      <ChevronRight size={20} className="text-[var(--site-accent)]" />
                    ) : null}
                  </span>
                ))}
              </nav>
              <EditableText
                as="h1"
                value={fields.title}
                path={["title"]}
                options={options}
                className="typo-h1 max-w-[760px] leading-[0.98] text-[#0f1112]"
              />
              <EditableText
                as="p"
                value={fields.subtitle}
                path={["subtitle"]}
                options={options}
                className="typo-body-large max-w-[634px] text-[#0f1112]/80"
              />
              <div className="flex flex-wrap gap-3">
                <SiteCta
                  variant="white-soft"
                  href={fields.primaryCta.href}
                  value={fields.primaryCta.label}
                  path={["primaryCta", "label"]}
                  options={options}
                />
                <SiteCta
                  variant="primary"
                  href={fields.secondaryCta.href}
                  value={fields.secondaryCta.label}
                  path={["secondaryCta", "label"]}
                  options={options}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <div className="typo-body-small inline-flex h-[61px] items-center gap-3 rounded-3xl border border-[#0f1112]/[0.09] bg-white px-5 font-medium text-[#0f1112]/80">
                <Clock3 size={22} strokeWidth={1.5} />
                {fields.readingTime}
              </div>
              <div className="typo-body-small inline-flex h-[61px] items-center gap-3 rounded-3xl border border-[#0f1112]/[0.09] bg-white px-5 font-medium text-[#0f1112]/80">
                <CalendarDays size={22} strokeWidth={1.5} />
                {fields.updatedLabel} {fields.updatedAt}
              </div>
            </div>
          </div>

          <div
            className="mt-20 min-h-[620px] rounded-[17px] bg-cover bg-center md:min-h-[760px] lg:min-h-[1015px]"
            style={{ backgroundImage: `url(${fields.heroImageUrl})` }}
            role="img"
            aria-label={fields.heroImageAlt}
          />
        </div>
      </div>

      <div className="rounded-t-[56px] border border-black/[0.09] bg-white px-5 py-16 md:px-10 md:py-24 xl:px-20">
        <div className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-[474px_minmax(0,1055px)] lg:gap-[70px]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-black/[0.09] bg-[#f6f6f4] p-8">
              <EditableText
                value={fields.tocTitle}
                path={["tocTitle"]}
                options={options}
                className="typo-h4 block text-[#0f1112]"
              />
              <div className="mt-6 grid gap-3">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`typo-body-small text-black/80 transition hover:text-[var(--site-primary)] ${
                      heading.level === "h3" ? "pl-4" : ""
                    }`}
                  >
                    {heading.text}
                  </a>
                ))}
              </div>
            </div>

            <div className="relative mt-6 min-h-[556px] overflow-hidden rounded-3xl bg-[var(--site-primary)] p-8 pt-10 text-white md:p-10 md:pt-12">
              <div
                className="absolute inset-x-0 bottom-0 h-[207px] bg-cover bg-center opacity-55"
                style={{ backgroundImage: `url(${fields.heroImageUrl})` }}
              />
              <div className="site-brand-article-fade absolute inset-x-0 bottom-0 h-[229px]" />
              <div className="relative z-10 flex min-h-[335px] flex-col items-start">
                <SocialProofPill
                  ratingLabel={fields.socialProof.ratingLabel}
                  reviewCount={fields.socialProof.reviewCount}
                  ratingPath={["socialProof", "ratingLabel"]}
                  countPath={["socialProof", "reviewCount"]}
                  align="left"
                  tone="dark"
                  options={options}
                />
                <EditableText
                  as="h2"
                  value={fields.sidebarCtaTitle}
                  path={["sidebarCtaTitle"]}
                  options={options}
                  className="typo-h3 mt-8 text-white"
                />
                <div className="mt-8 w-full">
                  <SiteCta
                    variant="white"
                    href={fields.sidebarCta.href}
                    value={fields.sidebarCta.label}
                    path={["sidebarCta", "label"]}
                    options={options}
                  />
                </div>
              </div>
            </div>
          </aside>

          <article id="article" className="grid scroll-mt-28 gap-5">
            {fields.blocks.map((block, index) => {
              if (block.kind === "paragraph") {
                const sizeClass =
                  block.size === "large"
                    ? "typo-body-large"
                    : block.size === "small"
                      ? "typo-body-small"
                      : "typo-body-medium";
                return (
                  <EditableText
                    key={index}
                    as="p"
                    value={block.text}
                    path={["blocks", index, "text"]}
                    options={options}
                    className={`${sizeClass} text-black/68`}
                  />
                );
              }

              if (block.kind === "heading") {
                const headingId = slugifyHeading(block.text, index);

                return (
                  <div
                    key={index}
                    id={headingId}
                    className={`scroll-mt-28 ${index === 0 ? "" : block.level === "h3" ? "pt-3" : "pt-8"}`}
                  >
                    <EditableText
                      as={block.level}
                      value={block.text}
                      path={["blocks", index, "text"]}
                      options={options}
                    className={`${block.level === "h3" ? "typo-h4" : "typo-h3"} ${block.alignment === "center" ? "text-center" : ""} text-[var(--site-primary)]`}
                    />
                  </div>
                );
              }

              if (block.kind === "quiz") {
                const quiz = fields.quizzes.find(
                  (item) => item.id === block.quizId,
                );

                if (!quiz) {
                  return null;
                }

                return <ArticleQuiz key={index} quiz={quiz} />;
              }

              if (block.kind === "table") {
                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-[33px] border border-[color:color-mix(in_srgb,var(--site-primary)_21%,transparent)] bg-[color:color-mix(in_srgb,var(--site-primary)_6%,transparent)]"
                  >
                    <div className="bg-[var(--site-primary)] px-8 py-7 text-center">
                      <EditableText
                        value={block.title}
                        path={["blocks", index, "title"]}
                        options={options}
                        className="typo-h5 text-white"
                      />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] border-collapse">
                        <thead>
                          <tr className="bg-[color:color-mix(in_srgb,var(--site-primary)_10%,transparent)]">
                            {block.columns.map((column, columnIndex) => (
                              <th
                                key={`${column}-${columnIndex}`}
                                className="px-12 py-10 text-left font-serif text-[20px] leading-[1.3] tracking-[-0.04em] text-[var(--site-primary)]"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className={
                                rowIndex % 2 === 1 ? "bg-[color:color-mix(in_srgb,var(--site-primary)_2%,transparent)]" : ""
                              }
                            >
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={`${cell}-${cellIndex}`}
                                  className="px-12 py-10 font-serif text-[20px] leading-[1.3] tracking-[-0.04em] text-[var(--site-primary)]"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              if (block.kind === "callout") {
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 rounded-3xl border border-[#d59e1e]/30 bg-[linear-gradient(180deg,rgba(255,208,0,0.19)_0%,rgba(255,253,242,0.12)_100%)] px-6 py-10 md:px-12"
                  >
                    <Lightbulb size={32} className="shrink-0 text-[#e2c54a]" />
                    <div>
                      {block.title ? (
                        <EditableText
                          as="h3"
                          value={block.title}
                          path={["blocks", index, "title"]}
                          options={options}
                          className="typo-h5 mb-2 text-[var(--site-primary)]"
                        />
                      ) : null}
                      <EditableText
                        as="p"
                        value={block.text}
                        path={["blocks", index, "text"]}
                        options={options}
                        className="typo-body-medium text-black/68"
                      />
                    </div>
                  </div>
                );
              }

              if (block.kind === "image") {
                const widthClass =
                  block.size === "small"
                    ? "max-w-[520px]"
                    : block.size === "medium"
                      ? "max-w-[760px]"
                      : "w-full";
                const alignmentClass =
                  block.alignment === "left"
                    ? "mr-auto"
                    : block.alignment === "right"
                      ? "ml-auto"
                      : "mx-auto";
                return (
                  <figure
                    key={index}
                    className={`${widthClass} ${alignmentClass}`}
                  >
                    <div
                      className="aspect-[16/10] rounded-[28px] bg-cover bg-center"
                      style={{ backgroundImage: `url(${block.imageUrl})` }}
                      role="img"
                      aria-label={block.alt}
                    />
                    {block.caption ? (
                      <figcaption className="typo-body-small mt-3 text-center text-black/45">
                        {block.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              }

              if (block.kind === "cards") {
                const columns = block.columns ?? 2;
                const gridClass =
                  columns === 1
                    ? "md:grid-cols-1"
                    : columns === 2
                      ? "md:grid-cols-2"
                      : columns === 3
                        ? "md:grid-cols-3"
                        : "md:grid-cols-2 xl:grid-cols-4";
                return (
                  <div key={index}>
                    {block.title ? (
                      <h2 className="typo-h3 mb-8 text-[var(--site-primary)]">
                        {block.title}
                      </h2>
                    ) : null}
                    <div className={`grid gap-4 ${gridClass}`}>
                      {block.cards.map((card, cardIndex) => (
                        <div
                          key={`${card.title}-${cardIndex}`}
                          className="rounded-[40px] border border-black/10 bg-white p-10 shadow-[0_31px_12px_rgba(0,0,0,0.01),0_17px_10px_rgba(0,0,0,0.03),0_8px_8px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.05)]"
                        >
                          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-[color:color-mix(in_srgb,var(--site-accent)_12%,white)] text-[var(--site-primary)]">
                            {card.icon === "leaf" ? (
                              <Leaf size={32} />
                            ) : card.icon === "shield" ? (
                              <ShieldCheck size={32} />
                            ) : card.icon === "sprout" ? (
                              <Sprout size={32} />
                            ) : card.icon === "tree" ? (
                              <TreePine size={32} />
                            ) : (
                              <Lightbulb size={32} strokeWidth={2} />
                            )}
                          </div>
                          <h3 className="typo-h4 text-black">{card.title}</h3>
                          <p className="typo-body-small mt-5 text-black/60">
                            {card.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <p key={index} className="typo-body-medium text-black/68">
                  {block.text}{" "}
                  <TemplateLink
                    href={block.href}
                    disabled={options?.disableLinks}
                          className="font-medium text-[var(--site-primary)] underline decoration-[var(--site-primary)] underline-offset-4"
                  >
                    {block.label}
                  </TemplateLink>
                </p>
              );
            })}
          </article>
        </div>
      </div>

      <ArticleLeadQualifier qualifier={fields.leadQualifier} />

      <div className="px-5 py-20 md:px-10 md:py-28 xl:px-20">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex items-center justify-between gap-10 border-b border-black/17 pb-8 max-md:flex-col max-md:items-start">
            <EditableText
              as="h2"
              value={fields.relatedTitle}
              path={["relatedTitle"]}
              options={options}
              className="typo-h2 text-[#0f1112]"
            />
          </div>
          <div className="mt-16 grid gap-7 lg:grid-cols-2">
            {fields.relatedPosts.slice(0, 4).map((post, index) => (
              <TemplateLink
                key={`${post.href}-${index}`}
                href={post.href}
                disabled={options?.disableLinks}
                className="group rounded-[40px] border border-transparent bg-white p-5 transition hover:border-black/10 hover:shadow-[0_31px_12px_rgba(0,0,0,0.01),0_17px_10px_rgba(0,0,0,0.03),0_8px_8px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.05)]"
              >
                <div className="relative h-[360px] overflow-hidden rounded-[20px] max-sm:h-[260px]">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url(${post.imageUrl})` }}
                  />
                  <span className="typo-body-small absolute right-8 top-8 rounded-[9px] bg-[var(--site-primary)] px-4 py-[3px] leading-[1.19] text-white">
                    {post.category}
                  </span>
                </div>
                <div className="px-5 pb-5 pt-8">
                  <div className="flex items-end justify-between gap-4">
                    <h3 className="typo-h4 max-w-[610px] leading-[1.45] tracking-[-0.02em] text-black">
                      {post.title}
                    </h3>
                    <time className="typo-body-small shrink-0 leading-[1.19] text-black/60">
                      {post.date}
                    </time>
                  </div>
                </div>
              </TemplateLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const sectorIconMap = {
  badgePercent: BadgePercent,
  building: Building2,
  clock: Clock3,
  home: Home,
  landmark: Landmark,
  leaf: Leaf,
  scissors: Scissors,
  shield: ShieldCheck,
  sprout: Sprout,
  tree: TreePine,
};

function getSectorIcon(name: string) {
  return sectorIconMap[name as keyof typeof sectorIconMap] ?? Leaf;
}

function getRealisationDetailGroups(blocks: RealisationDetailBlock[]) {
  const groups: Array<{
    blocks: Array<{ block: RealisationDetailBlock; index: number }>;
    separator?: Extract<RealisationDetailBlock, { kind: "image" }>;
  }> = [];
  let current: Array<{ block: RealisationDetailBlock; index: number }> = [];

  blocks.forEach((block, index) => {
    if (block.kind === "image") {
      groups.push({ blocks: current, separator: block });
      current = [];
      return;
    }

    if (block.kind === "heading" && current.length > 0) {
      groups.push({ blocks: current });
      current = [];
    }

    current.push({ block, index });
  });

  if (current.length > 0) {
    groups.push({ blocks: current });
  }

  return groups.filter((group) => group.blocks.length > 0 || group.separator);
}

function RealisationDetailA({
  fields,
  options,
}: {
  fields: RealisationDetailFields;
  options?: RenderSectionOptions;
}) {
  const headings = fields.blocks
    .map((block, index) =>
      block.kind === "heading"
        ? { id: slugifyHeading(block.text, index), text: block.text }
        : null,
    )
    .filter(Boolean) as Array<{ id: string; text: string }>;
  const contentGroups = getRealisationDetailGroups(fields.blocks);

  return (
    <section className="bg-white font-[var(--font-inter)] text-[#0f1112]">
      <div className="relative min-h-[860px] overflow-hidden bg-[#162539] text-white md:min-h-[980px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fields.heroImageUrl})` }}
          role="img"
          aria-label={fields.heroImageAlt}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.48)_0%,rgba(0,0,0,0.94)_100%)]" />
        <div className="relative z-10 mx-auto flex min-h-[860px] max-w-[1600px] items-end px-5 pb-24 pt-36 md:min-h-[980px] md:px-10 md:pb-28 xl:px-20">
          <div className="max-w-[1148px]">
            <nav className="typo-body-small flex flex-wrap items-center gap-2 text-white/80">
              {fields.breadcrumbs.map((item, index) => (
                <span
                  key={`${item.href}-${index}`}
                  className="inline-flex items-center gap-2"
                >
                  <TemplateLink
                    href={item.href}
                    disabled={options?.disableLinks}
                    className="hover:text-white"
                  >
                    {item.label}
                  </TemplateLink>
                  {index < fields.breadcrumbs.length - 1 ? (
                    <ChevronRight size={20} className="text-[var(--site-accent)]" />
                  ) : null}
                </span>
              ))}
            </nav>
            <EditableText
              as="h1"
              value={fields.title}
              path={["title"]}
              options={options}
              className="typo-h2 mt-6 max-w-[1148px] leading-[1.03] tracking-[-0.06em] text-white"
            />
            <EditableText
              as="p"
              value={fields.subtitle}
              path={["subtitle"]}
              options={options}
              className="typo-body-large mt-7 max-w-[634px] text-white"
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <SiteCta
                variant="secondary"
                href={fields.primaryCta.href}
                value={fields.primaryCta.label}
                path={["primaryCta", "label"]}
                options={options}
              />
              <SiteCta
                variant="primary"
                href={fields.secondaryCta.href}
                value={fields.secondaryCta.label}
                path={["secondaryCta", "label"]}
                options={options}
              />
            </div>
          </div>
        </div>
      </div>

      <div id="avant-apres" className="px-5 py-20 md:px-10 md:py-28 xl:px-20">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-16">
          <EditableText
            as="h2"
            value={fields.beforeAfterTitle}
            path={["beforeAfterTitle"]}
            options={options}
            className="typo-h1 max-w-[760px] text-center leading-[0.98] text-[#0f1112]"
          />
          <RealisationBeforeAfterShowcase slides={fields.beforeAfterSlides} />
        </div>
      </div>

      <div id="detail" className="bg-[#f6f6f4]">
        {contentGroups.map((group, groupIndex) => (
          <div key={`realisation-detail-group-${groupIndex}`}>
            {group.blocks.length > 0 ? (
              <div className="px-5 pb-14 pt-[136px] md:px-10 md:pb-20 md:pt-[160px] xl:px-20">
                <div className="mx-auto grid max-w-[1324px] items-start gap-14 lg:grid-cols-[minmax(0,924px)_383px] lg:gap-[151px]">
                  <article className="grid auto-rows-max content-start gap-5 self-start">
                    {group.blocks.map(({ block, index }) => (
                      <RealisationDetailBlockRenderer
                        key={index}
                        block={block}
                        index={index}
                        options={options}
                      />
                    ))}
                  </article>

                  <RealisationDetailSidebar
                    fields={fields}
                    headings={headings}
                    options={options}
                  />
                </div>
              </div>
            ) : null}

            {group.separator ? (
              <div
                className="h-[520px] w-full rounded-xl bg-cover bg-center md:h-[760px] lg:h-[1049px]"
                style={{ backgroundImage: `url(${group.separator.imageUrl})` }}
                role="img"
                aria-label={group.separator.alt}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="px-5 py-20 md:px-10 md:py-28 xl:px-20">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex items-center justify-between gap-8 border-b border-black/11 pb-8 max-lg:flex-col max-lg:items-start">
            <EditableText
              as="h2"
              value={fields.relatedTitle}
              path={["relatedTitle"]}
              options={options}
              className="typo-h2 max-w-[1025px] leading-[1.1] text-[#0f1112]"
            />
            <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-2xl bg-[#ededed] p-2">
              {fields.relatedFilters.map((filter, index) => (
                <span
                  key={`${filter}-${index}`}
                  className={`typo-body-small shrink-0 rounded-[9px] border border-transparent px-6 py-3 leading-[1.19] text-black ${
                    index === 0 ? "border-black/12 bg-white" : ""
                  }`}
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            {fields.relatedProjects.slice(0, 4).map((project, index) => (
              <article
                key={`${project.title}-${index}`}
                className="rounded-[40px] bg-white p-5"
              >
                <div className="relative h-[495px] overflow-hidden rounded-[20px] max-md:h-[340px] max-sm:h-[260px]">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out hover:scale-105"
                    style={{ backgroundImage: `url(${project.imageUrl})` }}
                    role="img"
                    aria-label={project.alt}
                  />
                  <span className="typo-body-small absolute right-8 top-8 rounded-[9px] bg-white px-4 py-[3px] leading-[1.19] text-black">
                    {project.category}
                  </span>
                </div>
                <div className="px-5 pb-5 pt-8">
                  <h3 className="typo-h4 block max-w-[710px] leading-[1.45] tracking-[-0.02em] text-black">
                    {project.title}
                  </h3>
                  <TemplateLink
                    href={project.href}
                    disabled={options?.disableLinks}
                    className="site-cta site-cta-primary cta-roll mt-6 inline-flex rounded-full text-[#00d494]"
                    ariaLabel={project.title}
                  >
                    <CtaLabel value="Voir la réalisation en détail" options={options} />
                  </TemplateLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RealisationDetailSidebar({
  fields,
  headings,
  options,
}: {
  fields: RealisationDetailFields;
  headings: Array<{ id: string; text: string }>;
  options?: RenderSectionOptions;
}) {
  return (
    <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
      <div className="grid gap-6">
        <EditableText
          value={fields.tocTitle}
          path={["tocTitle"]}
          options={options}
          className="typo-h4 text-[#0f1112]"
        />
        <div className="grid gap-4">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className="typo-body-small text-black/80 transition hover:text-[var(--site-primary)]"
            >
              {heading.text}
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-[20px] border border-black/11 bg-white p-8">
        <p className="text-[16px] leading-[2.35] tracking-[-0.02em] text-black/90">
          {fields.testimonial.text}
        </p>
        <div className="mt-5 h-px bg-black/[0.06]" />
        <div className="mt-5 flex items-center gap-3">
          <Image
            src={fields.testimonial.avatarUrl}
            alt={fields.testimonial.authorName}
            width={48}
            height={48}
            className="h-12 w-12 rounded-[9px] object-cover"
          />
          <div>
            <p className="text-[16px] font-medium leading-[1.03] tracking-[-0.02em] text-black">
              {fields.testimonial.authorName}
            </p>
            <p className="mt-3 text-[14px] leading-[1.03] tracking-[-0.02em] text-black/70">
              {fields.testimonial.authorRole}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function RealisationDetailBlockRenderer({
  block,
  index,
  options,
}: {
  block: RealisationDetailBlock;
  index: number;
  options?: RenderSectionOptions;
}) {
  if (block.kind === "heading") {
    return (
      <div id={slugifyHeading(block.text, index)} className="scroll-mt-28">
        <EditableText
          as="h2"
          value={block.text}
          path={["blocks", index, "text"]}
          options={options}
          className="typo-h2 leading-[1.05] tracking-[-0.02em] text-black"
        />
      </div>
    );
  }

  if (block.kind === "paragraph") {
    return (
      <EditableText
        as="p"
        value={block.text}
        path={["blocks", index, "text"]}
        options={options}
        className="typo-body-small tracking-[-0.02em] text-black/60"
      />
    );
  }

  if (block.kind === "image") {
    return (
      <div
        className="min-h-[420px] rounded-xl bg-cover bg-center md:min-h-[620px] lg:min-h-[760px]"
        style={{ backgroundImage: `url(${block.imageUrl})` }}
        role="img"
        aria-label={block.alt}
      />
    );
  }

  if (block.kind === "bento") {
    const images = block.images.slice(0, 3);

    return (
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-[386px_minmax(0,1fr)]">
          {images.slice(0, 2).map((image, imageIndex) => (
            <div
              key={`${image.alt}-${imageIndex}`}
              className="min-h-[360px] rounded-xl bg-cover bg-center md:min-h-[458px]"
              style={{ backgroundImage: `url(${image.imageUrl})` }}
              role="img"
              aria-label={image.alt}
            />
          ))}
        </div>
        {images[2] ? (
          <div
            className="min-h-[420px] rounded-xl bg-cover bg-center md:min-h-[692px]"
            style={{ backgroundImage: `url(${images[2].imageUrl})` }}
            role="img"
            aria-label={images[2].alt}
          />
        ) : null}
      </div>
    );
  }

  if (block.kind === "cards") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {block.cards.map((card, cardIndex) => {
          const Icon = getSectorIcon(card.icon ?? "leaf");

          return (
            <div
              key={`${card.title}-${cardIndex}`}
              className="rounded-[40px] border border-black/10 bg-white p-10 shadow-[0_31px_12px_rgba(0,0,0,0.01),0_17px_10px_rgba(0,0,0,0.03),0_8px_8px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.05)]"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-[color:color-mix(in_srgb,var(--site-accent)_12%,white)] text-[var(--site-primary)]">
                <Icon size={32} strokeWidth={2} />
              </div>
              <h3 className="typo-h4 text-black">{card.title}</h3>
              <p className="typo-body-small mt-5 text-black/60">{card.text}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <h3 className="typo-h4 text-black">{block.title}</h3>
      <BeforeAfterSlider
        beforeImageUrl={block.beforeImageUrl}
        afterImageUrl={block.afterImageUrl}
        alt={block.alt}
        className="h-[420px] rounded-[35px] md:h-[585px]"
      />
    </div>
  );
}

function SectorHeroTickerA({
  fields,
  options,
}: {
  fields: SectorHeroFields;
  options?: RenderSectionOptions;
}) {
  const tickerImages =
    fields.tickerImages.length > 0 ? fields.tickerImages : [];
  const repeatedImages = [...tickerImages, ...tickerImages];

  return (
    <section className="overflow-hidden bg-[#f6f6f4] pt-36 font-[var(--font-inter)] text-[#0f1112] md:pt-44">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center px-5 text-center md:px-10 xl:px-20">
        <EditableText
          as="h1"
          value={fields.title}
          path={["title"]}
          options={options}
          className="typo-h1 max-w-[760px] leading-[0.98] text-[#0f1112]"
        />
        <EditableText
          as="p"
          value={fields.subtitle}
          path={["subtitle"]}
          options={options}
          className="typo-body-large mt-7 max-w-[634px] text-[#0f1112]/80"
        />
        <div className="mt-7">
          <TemplateLink
            href="/contact"
            disabled={options?.disableLinks}
            className="site-cta site-cta-primary cta-roll rounded-full text-[#00d494]"
          >
            <CtaLabel value="Nous contacter" options={options} />
          </TemplateLink>
        </div>
      </div>

      <div className="mt-20 overflow-hidden pb-16">
        <div className="sector-image-track flex w-max gap-4">
          {repeatedImages.map((image, index) => (
            <div
              key={`${image.imageUrl}-${index}`}
              className="h-[360px] w-[330px] shrink-0 rounded-[9px] bg-cover bg-center md:h-[520px] md:w-[480px] xl:h-[638px] xl:w-[589px]"
              style={{ backgroundImage: `url(${image.imageUrl})` }}
              role="img"
              aria-label={image.alt}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SectorServicesCardsA({
  fields,
  options,
  extraTopPadding = false,
}: {
  fields: SectorServicesFields;
  options?: RenderSectionOptions;
  extraTopPadding?: boolean;
}) {
  return (
    <section
      className={`bg-white px-5 pb-20 font-[var(--font-inter)] md:px-10 md:pb-28 xl:px-20 ${
        extraTopPadding ? "pt-40 md:pt-48" : "pt-20 md:pt-28"
      }`}
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center justify-between gap-8 border-b border-black/17 pb-8 max-md:flex-col max-md:items-start">
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h2 text-[#0f1112]"
          />
          <SiteCta
            variant="primary"
            href={fields.cta.href}
            value={fields.cta.label}
            path={["cta", "label"]}
            options={options}
          />
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {fields.services.map((service, index) => {
            const Icon = getSectorIcon(service.icon);

            return (
              <article
                key={`${service.title}-${index}`}
                className="min-h-[420px] rounded-[40px] bg-[#fbfbfb] p-10"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--site-primary)_21%,transparent)] bg-[color:color-mix(in_srgb,var(--site-accent)_12%,white)] text-[var(--site-primary)]">
                  <Icon size={32} strokeWidth={2} />
                </div>
                <EditableText
                  as="h3"
                  value={service.title}
                  path={["services", index, "title"]}
                  options={options}
                  className="typo-h4 mt-6 block leading-[1.45] tracking-[-0.02em] text-black"
                />
                <EditableText
                  as="p"
                  value={service.description}
                  path={["services", index, "description"]}
                  options={options}
                  className="typo-body-small mt-6 block leading-[2.52] text-black/60"
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectorBenefitsA({
  fields,
  options,
}: {
  fields: SectorBenefitsFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="bg-white px-5 py-20 font-[var(--font-inter)] md:px-10 md:py-28 xl:px-20">
      <div className="mx-auto max-w-[1600px]">
        <div className="mx-auto max-w-[1025px] text-center">
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h2 text-[#0f1112]"
          />
          <EditableText
            as="p"
            value={fields.subtitle}
            path={["subtitle"]}
            options={options}
            className="typo-body-large mx-auto mt-6 max-w-[634px] text-[#0f1112]/80"
          />
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {fields.cards.map((card, index) => (
            <article
              key={`${card.title}-${index}`}
              className="overflow-hidden rounded-[18px] border border-black/[0.06] bg-white p-3 shadow-[0_20px_8px_rgba(0,0,0,0.01),0_11px_7px_rgba(0,0,0,0.02),0_5px_5px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div
                className="relative flex min-h-[620px] items-end overflow-hidden rounded-md bg-cover bg-center"
                style={{ backgroundImage: `url(${card.imageUrl})` }}
              >
                <div className="absolute inset-x-0 bottom-0 h-[64%] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_16%,rgba(255,255,255,0.72)_44%,#fff_72%,#fff_100%)]" />
                <div className="relative z-10 w-full px-6 pb-10 pt-28">
                  <EditableText
                    as="h3"
                    value={card.title}
                    path={["cards", index, "title"]}
                    options={options}
                    className="typo-h4 block leading-[1.1] text-[#0f1112]"
                  />
                  <EditableText
                    as="p"
                    value={card.description}
                    path={["cards", index, "description"]}
                    options={options}
                    className="typo-body-small mt-5 block leading-[2.2] text-black/70"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectorExtraServicesA({
  fields,
  options,
}: {
  fields: SectorExtraServicesFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="bg-white px-5 py-20 font-[var(--font-inter)] md:px-10 md:py-28 xl:px-20">
      <div className="mx-auto max-w-[1324px]">
        <div className="flex items-end justify-between gap-8 max-lg:flex-col max-lg:items-start">
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h2 max-w-[1025px] leading-[1.1] text-[#0f1112]"
          />
          <SiteCta
            variant="primary"
            href={fields.cta.href}
            value={fields.cta.label}
            path={["cta", "label"]}
            options={options}
          />
        </div>
        <div className="mt-12 h-px w-full bg-black/[0.06]" />
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fields.services.map((service, index) => (
            <TemplateLink
              key={`${service.href}-${index}`}
              href={service.href}
              disabled={options?.disableLinks}
              className="group flex min-h-[560px] items-end rounded-2xl bg-cover bg-center p-6"
              style={
                {
                  backgroundImage: `url(${service.imageUrl})`,
                } as React.CSSProperties
              }
            >
              <div className="w-full rounded-md bg-white px-6 py-8 transition-transform duration-300 group-hover:-translate-y-1">
                <EditableText
                  as="h3"
                  value={service.title}
                  path={["services", index, "title"]}
                  options={options}
                  className="typo-h4 block leading-[1.1] text-[#0f1112]"
                />
                <EditableText
                  as="p"
                  value={service.description}
                  path={["services", index, "description"]}
                  options={options}
                  className="typo-body-small mt-5 block leading-[2.2] text-black/70"
                />
              </div>
            </TemplateLink>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutHeroA({
  fields,
  options,
}: {
  fields: AboutHeroFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="overflow-hidden bg-white font-[var(--font-inter)]">
      <div className="relative min-h-[980px] overflow-hidden bg-[#001c23] px-5 pt-40 text-white md:px-10 md:pt-52 xl:min-h-[1100px] xl:px-20">
        <div className="pointer-events-none absolute bottom-[-120px] left-[-560px] h-[657px] w-[871px] rounded-[50%] border border-white/[0.06] bg-white/[0.02]" />
        <div className="pointer-events-none absolute bottom-[-120px] right-[-560px] h-[657px] w-[871px] rounded-[50%] border border-white/[0.06] bg-white/[0.02]" />
        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center text-center">
          <EditableText
            as="h1"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h1 text-white"
          />
          <EditableText
            as="p"
            value={fields.subtitle}
            path={["subtitle"]}
            options={options}
            className="typo-body-large mt-7 max-w-[634px] text-white/80"
          />
          <div className="mt-7 flex flex-wrap justify-center gap-3 max-sm:w-full max-sm:flex-col">
            <SiteCta
              variant="secondary"
              href={fields.secondaryCta.href}
              value={fields.secondaryCta.label}
              path={["secondaryCta", "label"]}
              options={options}
            />
            <SiteCta
              variant="primary"
              href={fields.primaryCta.href}
              value={fields.primaryCta.label}
              path={["primaryCta", "label"]}
              options={options}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-[280px] max-w-[1324px] px-5 pb-20 md:px-10 md:pb-28 xl:px-0">
        <div
          className="h-[520px] rounded-[24px] bg-cover bg-center shadow-[0_30px_70px_rgba(0,28,35,0.16)] md:h-[720px] md:rounded-[32px] xl:h-[905px]"
          style={{ backgroundImage: `url(${fields.imageUrl})` }}
          role="img"
          aria-label={fields.imageAlt}
        />
      </div>
    </section>
  );
}

function AboutStoryA({
  fields,
  options,
}: {
  fields: AboutStoryFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="bg-[#001c23] px-5 py-20 font-[var(--font-inter)] text-white md:px-10 md:py-28 xl:px-20 xl:py-[165px]">
      <div className="mx-auto grid max-w-[1600px] items-center gap-12 lg:grid-cols-[minmax(0,786px)_minmax(0,710px)] xl:gap-24">
        <div
          className="min-h-[520px] rounded-[24px] bg-cover bg-center md:min-h-[660px] md:rounded-[32px] xl:min-h-[779px]"
          style={{ backgroundImage: `url(${fields.imageUrl})` }}
          role="img"
          aria-label={fields.imageAlt}
        />

        <div>
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h2 max-w-[710px] text-white"
          />
          <EditableText
            as="p"
            value={fields.description}
            path={["description"]}
            options={options}
            className="typo-body-large mt-8 max-w-[634px] text-white/80"
          />

          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {fields.highlights.map((highlight, index) => {
              const Icon = getSectorIcon(highlight.icon);

              return (
                <article
                  key={`${highlight.title}-${index}`}
                  className="min-h-[285px] rounded-[25px] bg-white/[0.04] p-8"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[3px] bg-[color:color-mix(in_srgb,var(--site-accent)_12%,white)] text-[var(--site-primary)]">
                    <Icon size={24} strokeWidth={1.75} />
                  </div>
                  <EditableText
                    as="h3"
                    value={highlight.title}
                    path={["highlights", index, "title"]}
                    options={options}
                    className="typo-h5 mt-4 block normal-case text-white"
                  />
                  <EditableText
                    as="p"
                    value={highlight.description}
                    path={["highlights", index, "description"]}
                    options={options}
                    className="typo-body-small mt-2 block text-white/60"
                  />
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesHubHeroA({
  fields,
  options,
}: {
  fields: ServicesHubHeroFields;
  options?: RenderSectionOptions;
}) {
  const tickerServices = fields.services.length > 0 ? fields.services : [];
  const repeatedServices = [...tickerServices, ...tickerServices];

  return (
    <section className="relative min-h-[1060px] overflow-hidden bg-[#162539] font-[var(--font-inter)] text-white max-md:min-h-[900px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${fields.backgroundImageUrl})` }}
      />
      <div className="absolute inset-0 bg-black/48" />

      <div className="relative z-10 mx-auto flex min-h-[930px] max-w-[1600px] items-center px-5 pb-24 pt-40 md:px-10 md:pt-44 xl:px-20">
        <div className="max-w-[760px]">
          <SocialProofPill
            ratingLabel={fields.socialProof.ratingLabel}
            reviewCount={fields.socialProof.reviewCount}
            ratingPath={["socialProof", "ratingLabel"]}
            countPath={["socialProof", "reviewCount"]}
            align="left"
            tone="dark"
            options={options}
          />
          <EditableText
            as="h1"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h1 mt-7 text-white"
          />
          <EditableText
            as="p"
            value={fields.subtitle}
            path={["subtitle"]}
            options={options}
            className="typo-body-large mt-7 max-w-[634px] text-white/80"
          />
          <div className="mt-7">
            <SiteCta
              variant="primary"
              href={fields.cta.href}
              value={fields.cta.label}
              path={["cta", "label"]}
              options={options}
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-7 z-10 overflow-hidden">
        <div className="services-hub-ticker flex w-max gap-3">
          {repeatedServices.map((service, index) => (
            <TemplateLink
              key={`${service.href}-ticker-${index}`}
              href={service.href}
              disabled={options?.disableLinks}
              className="flex h-[91px] w-[220px] shrink-0 items-center gap-4 rounded-2xl bg-white p-3 text-[#12110f] shadow-lg shadow-black/10"
            >
              <span
                className="h-[67px] w-[67px] shrink-0 rounded-md bg-cover bg-center"
                style={{ backgroundImage: `url(${service.imageUrl})` }}
              />
              <span className="text-[17px] font-medium leading-[1.1] tracking-[-0.04em]">
                {service.title}
              </span>
            </TemplateLink>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesHubBentoA({
  fields,
  options,
}: {
  fields: ServicesHubBentoFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="bg-[#001c23] px-5 py-24 font-[var(--font-inter)] text-white md:px-10 md:py-32 xl:px-20">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-end justify-between gap-10 border-b border-white/17 pb-10 max-lg:flex-col max-lg:items-start">
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h2 max-w-[946px] text-white"
          />
          <EditableText
            as="p"
            value={fields.subtitle}
            path={["subtitle"]}
            options={options}
            className="max-w-[520px] text-[16px] leading-[2.35] tracking-[-0.02em] text-white/68 lg:text-right"
          />
        </div>
        <div className="mt-16">
          <ServicesHubBento services={fields.services} />
        </div>
      </div>
    </section>
  );
}

function ServicesHubReviewsA({
  fields,
  options,
}: {
  fields: ServicesHubReviewsFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="overflow-x-clip bg-white py-24 font-[var(--font-inter)] text-[#0a141b] md:py-32">
      <div className="mx-auto flex max-w-[1324px] items-start justify-between gap-16 px-5 pb-16 md:px-10 max-lg:flex-col max-lg:gap-6 xl:px-0">
        <EditableText
          as="h2"
          value={fields.title}
          path={["title"]}
          options={options}
          className="typo-h2 max-w-[774px] leading-[1.28] tracking-[-0.04em] text-[#0a141b]"
        />
        <EditableText
          as="p"
          value={fields.subtitle}
          path={["subtitle"]}
          options={options}
          className="max-w-[550px] text-[16px] leading-[2.35] tracking-[-0.02em] text-black/70 lg:text-right"
        />
      </div>
      <ServicesHubReviewsCarousel reviews={fields.reviews} />
    </section>
  );
}

function RealisationsPageA({
  sectionId,
  fields,
  options,
}: {
  sectionId: string;
  fields: RealisationsPageFields;
  options?: RenderSectionOptions;
}) {
  const tickerImages = fields.heroImages.length > 0 ? fields.heroImages : [];
  const cardHeights = [
    "h-[548px]",
    "h-[419px]",
    "h-[545px]",
    "h-[687px]",
    "h-[458px]",
  ];
  const tickerColumns = Array.from({ length: 5 }, (_, columnIndex) =>
    tickerImages.filter((_, imageIndex) => imageIndex % 5 === columnIndex),
  ).map((column) => (column.length > 0 ? column : tickerImages));
  const groupName = `realisations-city-${sectionId}`;
  const cities = fields.filters.filter((city) => city.trim().length > 0);

  return (
    <section className="realisations-page-section bg-white font-[var(--font-inter)] text-[#0f1112]">
      <div className="relative overflow-hidden bg-[#f6f6f4] pt-36 md:pt-44">
        <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col items-center px-5 text-center md:px-10 xl:px-20">
          <EditableText
            as="h1"
            value={fields.title}
            path={["title"]}
            options={options}
            className="typo-h1 max-w-[760px] leading-[0.98] text-[#0f1112]"
          />
          <EditableText
            as="p"
            value={fields.subtitle}
            path={["subtitle"]}
            options={options}
            className="typo-body-large mt-7 max-w-[634px] text-[#0f1112]/80"
          />
          <div className="mt-7">
            <TemplateLink
              href="/contact"
              disabled={options?.disableLinks}
              className="site-cta site-cta-primary cta-roll rounded-full text-[#00d494]"
            >
              <CtaLabel value="Nous contacter" options={options} />
            </TemplateLink>
          </div>
        </div>

        <div className="relative mt-20 h-[760px] overflow-hidden max-md:h-[520px]">
          <div className="absolute left-1/2 top-0 grid w-[2260px] -translate-x-1/2 grid-cols-5 gap-5 max-md:w-[1180px] max-md:grid-cols-3">
            {tickerColumns.map((column, columnIndex) => {
              const repeatedColumn = [...column, ...column];

              return (
                <div
                  key={`realisations-column-${columnIndex}`}
                  className={`h-[980px] overflow-hidden max-md:h-[720px] ${
                    columnIndex > 2 ? "max-md:hidden" : ""
                  }`}
                >
                  <div className="realisations-ticker-column flex flex-col gap-5">
                    {repeatedColumn.map((image, imageIndex) => (
                      <div
                        key={`${image.imageUrl}-${columnIndex}-${imageIndex}`}
                        className={`service-card-shadow w-full shrink-0 overflow-hidden rounded-2xl border border-black/[0.09] bg-white ${
                          cardHeights[
                            (imageIndex + columnIndex) % cardHeights.length
                          ]
                        }`}
                      >
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${image.imageUrl})` }}
                          role="img"
                          aria-label={image.alt}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[linear-gradient(180deg,#f6f6f4_0%,rgba(246,246,244,0)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] bg-[linear-gradient(180deg,rgba(246,246,244,0)_0%,#f6f6f4_100%)]" />
        </div>
      </div>

      <div
        id="realisations"
        className="px-5 pb-20 pt-40 md:px-10 md:pb-28 md:pt-48 xl:px-20"
      >
        <div className="mx-auto max-w-[1600px]">
          <div className="flex items-center justify-between gap-8 max-lg:flex-col max-lg:items-start">
            <EditableText
              as="h2"
              value={fields.listTitle}
              path={["listTitle"]}
              options={options}
              className="typo-h2 max-w-[1025px] leading-[1.1] text-[#0f1112]"
            />
            <div className="realisations-city-tabs flex max-w-full items-center gap-2 overflow-x-auto rounded-2xl bg-[#ededed] p-2">
              {cities.map((city, index) => (
                <label
                  key={`${city}-${index}`}
                  className="typo-body-small shrink-0 cursor-pointer rounded-[9px] border border-transparent px-6 py-3 leading-[1.19] text-black outline-none transition-colors has-[:checked]:border-black/12 has-[:checked]:bg-white has-[:focus-visible]:ring-0"
                >
                  <input
                    type="radio"
                    name={groupName}
                    defaultChecked={index === 0}
                    className="sr-only"
                  />
                  <EditableText
                    value={city}
                    path={["filters", index]}
                    options={options}
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="mt-10 h-px w-full bg-black/11" />

          <div className="mt-16">
            {cities.map((city, cityIndex) => (
              <div
                key={`${city}-panel-${cityIndex}`}
                className={`realisations-city-panel realisations-city-panel-${cityIndex} hidden grid gap-8 lg:grid-cols-2`}
              >
                {fields.projects
                  .map((project, projectIndex) => ({ project, projectIndex }))
                  .filter(({ project }) => project.city === city)
                  .map(({ project, projectIndex }) => (
                    <article
                      key={`${project.title}-${projectIndex}`}
                      className="rounded-[40px] bg-white p-5"
                    >
                      <div className="relative h-[495px] overflow-hidden rounded-[20px] max-md:h-[340px] max-sm:h-[260px]">
                        <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out hover:scale-105"
                          style={{
                            backgroundImage: `url(${project.imageUrl})`,
                          }}
                          role="img"
                          aria-label={project.alt}
                        />
                        <EditableText
                          value={project.category}
                          path={["projects", projectIndex, "category"]}
                          options={options}
                          className="typo-body-small absolute right-8 top-8 rounded-[9px] bg-white px-4 py-[3px] leading-[1.19] text-black"
                        />
                      </div>
                      <div className="px-5 pb-5 pt-8">
                        <EditableText
                          as="h3"
                          value={project.title}
                          path={["projects", projectIndex, "title"]}
                          options={options}
                          className="typo-h4 block max-w-[710px] leading-[1.45] tracking-[-0.02em] text-black"
                        />
                        <TemplateLink
                          href="/contact"
                          disabled={options?.disableLinks}
                          className="site-cta site-cta-primary cta-roll mt-6 inline-flex rounded-full text-[#00d494]"
                          style={{ paddingRight: 20 }}
                          ariaLabel={project.title}
                        >
                          <CtaLabel value="Nous contacter" options={options} />
                          <span className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/35 bg-black/25 text-white">
                            <ArrowUpRight size={16} strokeWidth={1.33} />
                          </span>
                        </TemplateLink>
                      </div>
                    </article>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function BlogPostImage({
  post,
  className,
}: {
  post: BlogAdviceFields["posts"][number];
  className: string;
}) {
  return (
    <div
      className={`group overflow-hidden rounded-[9px] ${className}`}
      role="img"
      aria-label={post.title}
    >
      <div
        className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${post.imageUrl})` }}
      />
    </div>
  );
}

function BlogPostText({
  post,
  index,
  featured,
  options,
}: {
  post: BlogAdviceFields["posts"][number];
  index: number;
  featured?: boolean;
  options?: RenderSectionOptions;
}) {
  return (
    <div className="flex flex-col items-start gap-6">
      <EditableText
        value={post.category}
        path={["posts", index, "category"]}
        options={options}
        className="rounded-[9px] bg-[color:color-mix(in_srgb,var(--site-primary)_8%,transparent)] px-4 py-[7px] text-[16px] leading-[1.19] tracking-[-0.02em] text-[var(--site-primary)]"
      />
      <div className="grid gap-4">
        <EditableText
          as="h3"
          value={post.title}
          path={["posts", index, "title"]}
          options={options}
          className={`${featured ? "typo-h3" : "typo-h4"} text-[#12110f]`}
        />
        <EditableText
          as="p"
          value={post.excerpt}
          path={["posts", index, "excerpt"]}
          options={options}
          className="typo-body-medium text-[#12110f]/70"
        />
      </div>
      <TemplateLink
        href={post.href}
        disabled={options?.disableLinks}
        className="inline-flex items-center gap-1 text-[18px] font-semibold leading-[22px] text-[#12110f]"
      >
        Lire l&apos;astuce
        <ArrowUpRight size={24} />
      </TemplateLink>
    </div>
  );
}

function FaqSectionA({
  fields,
  options,
}: {
  fields: FaqFields;
  options?: RenderSectionOptions;
}) {
  return (
    <section className="border-b border-black/10 bg-[#f9fafb] px-5 py-20 font-[var(--font-inter)] md:px-10 md:py-28 xl:px-20">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-start justify-between gap-8 max-lg:flex-col">
          <div>
            <SocialProofPill
              ratingLabel={fields.socialProof.ratingLabel}
              reviewCount={fields.socialProof.reviewCount}
              ratingPath={["socialProof", "ratingLabel"]}
              countPath={["socialProof", "reviewCount"]}
              align="left"
              options={options}
            />
            <EditableText
              as="h2"
              value={fields.title}
              path={["title"]}
              options={options}
              className="typo-h1 mt-9 text-[#0f1112]"
            />
          </div>
          <SiteCta
            variant="primary"
            href={fields.cta.href}
            value={fields.cta.label}
            path={["cta", "label"]}
            options={options}
          />
        </div>
        <div className="mt-14 h-px w-full bg-black/11" />
        <div className="mt-10">
          <FaqAccordion items={fields.items} />
        </div>
      </div>
    </section>
  );
}

function SiteFooterLandscaperA({
  fields,
  options,
}: {
  fields: FooterFields;
  options?: RenderSectionOptions;
}) {
  return (
    <footer className="bg-[var(--site-primary)] font-[var(--font-inter)] text-white">
      <div className="relative min-h-[970px] overflow-hidden">
        <div
          className="absolute left-[-7px] top-0 h-[1109px] w-[calc(100%+14px)] bg-cover bg-top"
          style={{
            backgroundImage: `url(${fields.backgroundImageUrl})`,
            backgroundPosition: "center top",
          }}
        />
        <div className="site-brand-footer-overlay absolute inset-x-[-1px] top-0 h-[970px]" />
        <div className="site-brand-footer-radial absolute inset-0" />
        <div className="relative mx-auto flex min-h-[970px] max-w-[1600px] items-center justify-center px-5 py-24 md:px-10 xl:px-20">
          <div className="mx-auto flex max-w-[760px] flex-col items-center gap-6 text-center">
            <EditableText
              as="h2"
              value={fields.title}
              path={["title"]}
              options={options}
              className="typo-h1 text-white"
            />
            <EditableText
              as="p"
              value={fields.subtitle}
              path={["subtitle"]}
              options={options}
              className="typo-body-large max-w-[634px] text-white"
            />
            <SiteCta
              variant="inverted"
              href={fields.cta.href}
              value={fields.cta.label}
              path={["cta", "label"]}
              options={options}
            />
          </div>
        </div>
      </div>

      <div className="relative bg-[var(--site-primary)]">
        <div className="mx-auto grid max-w-[1600px] gap-14 border-t border-white/10 px-5 py-20 md:px-10 lg:grid-cols-[minmax(280px,520px)_1fr] xl:px-20">
          <div>
            <EditableText
              value={fields.logoLabel}
              path={["logoLabel"]}
              options={options}
              className="typo-h4 block text-white"
            />
            <EditableText
              as="p"
              value={fields.copyright}
              path={["copyright"]}
              options={options}
              className="typo-body-small mt-8 font-semibold text-white"
            />
            <div className="mt-8 grid gap-8">
              <div>
                <EditableText
                  value={fields.addressLabel}
                  path={["addressLabel"]}
                  options={options}
                  className="typo-body-small block text-white/52"
                />
                <EditableText
                  as="p"
                  value={fields.address}
                  path={["address"]}
                  options={options}
                  className="typo-body-small mt-1 font-semibold text-white"
                />
              </div>
              <div>
                <EditableText
                  value={fields.contactLabel}
                  path={["contactLabel"]}
                  options={options}
                  className="typo-body-small block text-white/52"
                />
                <EditableText
                  as="p"
                  value={fields.phone}
                  path={["phone"]}
                  options={options}
                  className="typo-body-small mt-1 font-semibold text-white"
                />
                <EditableText
                  as="p"
                  value={fields.email}
                  path={["email"]}
                  options={options}
                  className="typo-body-small mt-1 font-semibold text-white"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {fields.linkGroups.map((group, groupIndex) => (
              <div key={`${group.title}-${groupIndex}`}>
                <EditableText
                  value={group.title}
                  path={["linkGroups", groupIndex, "title"]}
                  options={options}
                  className="typo-h5 block uppercase text-white"
                />
                <div className="mt-7 grid gap-5">
                  {group.links.map((link, linkIndex) => (
                    <TemplateLink
                      key={`${link.label}-${linkIndex}`}
                      href={link.href}
                      disabled={options?.disableLinks}
                      className="typo-body-small text-white/48 transition hover:text-white"
                    >
                      <EditableText
                        value={link.label}
                        path={[
                          "linkGroups",
                          groupIndex,
                          "links",
                          linkIndex,
                          "label",
                        ]}
                        options={options}
                      />
                    </TemplateLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
