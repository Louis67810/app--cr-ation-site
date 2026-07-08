import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { FaqAccordion } from "@/components/faq-accordion";
import { ServiceAreasInteractive } from "@/components/service-areas-interactive";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import type {
  BlogAdviceFields,
  FaqFields,
  FooterFields,
  HeroFullImageFields,
  RecentProjectsFields,
  SectionInstance,
  ServiceAreasFields,
  ServicesCardsFields,
  SiteHeaderGlassFields,
  SocialProofBandFields,
  TestimonialsFields,
  WorkMethodFields,
} from "@/lib/site-template";

type EditablePath = Array<string | number>;

type RenderSectionOptions = {
  editable?: boolean;
  disableLinks?: boolean;
  viewport?: "desktop" | "tablet" | "phone";
  onTextFocus?: () => void;
  onTextChange?: (path: EditablePath, value: string) => void;
};

function isEnabled(value?: string) {
  return ["1", "true", "oui", "yes", "on"].includes(
    value?.trim().toLowerCase() ?? "",
  );
}

function TemplateLink({
  href,
  className,
  children,
  ariaLabel,
  disabled,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className={className} aria-label={ariaLabel}>
        {children}
      </span>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} aria-label={ariaLabel}>
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
  path: EditablePath;
  options?: RenderSectionOptions;
}) {
  if (options?.editable) {
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
  variant: "primary" | "secondary" | "explore" | "inverted";
  href: string;
  value: string;
  path?: EditablePath;
  options?: RenderSectionOptions;
}) {
  const className = {
    primary: "site-cta site-cta-primary cta-roll rounded-full text-[#00d494]",
    secondary:
      "site-cta site-cta-secondary cta-roll rounded-full text-white/80",
    explore: "service-explore-cta mt-6",
    inverted: "site-cta site-cta-inverted cta-roll rounded-full text-[#003441]",
  }[variant];

  return (
    <TemplateLink className={className} href={href} disabled={options?.disableLinks}>
      {variant === "explore" ? (
        <>
          <span>{value}</span>
          <ChevronRight size={20} strokeWidth={1.67} />
        </>
      ) : path ? (
        <CtaLabel value={value} path={path} options={options} />
      ) : (
        value
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
      return <SiteHeaderGlassA fields={section.fields} options={options} />;
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
        <ServicesCardsA
          fields={section.fields}
          centered
          options={options}
        />
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
      return <WorkMethodAlternatingA fields={section.fields} options={options} />;
    case "service-areas":
      return <ServiceAreasSectionA fields={section.fields} options={options} />;
    case "testimonials":
      return <TestimonialsGalleryA fields={section.fields} options={options} />;
    case "blog-advice":
      return <BlogAdvicePostsA fields={section.fields} options={options} />;
    case "faq":
      return <FaqSectionA fields={section.fields} options={options} />;
    case "site-footer":
      return <SiteFooterLandscaperA fields={section.fields} options={options} />;
    default:
      return null;
  }
}

function SiteHeaderGlassA({
  fields,
  options,
}: {
  fields: SiteHeaderGlassFields;
  options?: RenderSectionOptions;
}) {
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";

  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-white/[0.03] font-[var(--font-inter)] backdrop-blur-md">
      <div className="mx-auto flex min-h-20 max-w-[1600px] items-center justify-between px-5 py-[10px] md:px-10 xl:px-20">
        <TemplateLink
          href="/"
          className="typo-body-small flex h-11 w-24 items-center justify-center rounded-lg bg-white/10 text-white/70"
          ariaLabel="Accueil"
          disabled={options?.disableLinks}
        >
          <EditableText
            value={fields.logoLabel}
            path={["logoLabel"]}
            options={options}
          />
        </TemplateLink>
        <nav
          className={`typo-button items-center text-white ${
            compact ? "hidden" : "flex"
          } ${tablet ? "gap-4" : "gap-7"}`}
        >
          {fields.navigation.map((item, index) => (
            <TemplateLink
              key={`${item.href}-${index}`}
              href={item.href}
              className="transition hover:text-white/70"
              disabled={options?.disableLinks}
            >
              <EditableText
                value={item.label}
                path={["navigation", index, "label"]}
                options={options}
              />
            </TemplateLink>
          ))}
        </nav>
        <SiteCta
          variant="primary"
          href={fields.cta.href}
          value={fields.cta.label}
          path={["cta", "label"]}
          options={options}
        />
      </div>
    </header>
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
      <div className="absolute inset-0 bg-[radial-gradient(40.85%_40.85%_at_50%_50%,rgba(0,0,0,0.2232)_0%,rgba(0,0,0,0.93)_100%)]" />
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
    <section className="bg-[#003441] px-5 py-10 font-[var(--font-inter)] text-white">
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
              className="typo-stat block text-[#00d494]"
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
    <section className="bg-white px-5 pb-20 pt-32 font-[var(--font-inter)] md:px-10 md:pt-[192px] md:pb-28 xl:px-20">
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
                  value="Explorer"
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
  options,
}: {
  ratingLabel: string;
  reviewCount: string;
  ratingPath: EditablePath;
  countPath: EditablePath;
  align?: "left" | "center";
  options?: RenderSectionOptions;
}) {
  return (
    <div className={`flex ${align === "center" ? "justify-center" : "justify-start"}`}>
      <div className="social-proof-pill inline-flex min-h-[73px] max-w-full items-center gap-3 overflow-hidden rounded-[19px] border border-black/[0.06] bg-white/70 px-5 py-4 shadow-[0_6px_4px_rgba(0,0,0,0.01),0_3px_3px_rgba(0,0,0,0.02),0_1px_1px_rgba(0,0,0,0.02)] backdrop-blur-[6.3px] max-sm:flex-wrap max-sm:gap-3">
        <Image
          src="/images/google-logo.svg"
          width={110}
          height={36}
          alt="Google"
          className="h-auto w-[100px] shrink-0"
        />
        <span className="h-[18px] w-px shrink-0 bg-black/14" />
        <EditableText
          value={ratingLabel}
          path={ratingPath}
          options={options}
          className="typo-body-small font-medium text-black/78"
        />
        <span className="review-stars shrink-0 text-[19px] leading-none tracking-[1px] text-[#F6BB06]">
          {"\u2605\u2605\u2605\u2605\u2605"}
        </span>
        <span className="h-[18px] w-px shrink-0 bg-black/14" />
        <EditableText
          value={reviewCount}
          path={countPath}
          options={options}
          className="typo-body-small font-medium text-black/78"
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
                    compact
                      ? "order-2"
                      : !imageFirst && !stacked
                        ? "order-2"
                        : ""
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
            <BlogPostText post={featured} index={0} featured options={options} />
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
        className="rounded-[9px] bg-[#003441]/[0.08] px-4 py-3 text-[16px] leading-[1.19] tracking-[-0.02em] text-[#003441]"
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
    <footer className="relative overflow-hidden bg-[#003441] font-[var(--font-inter)] text-white">
      <div
        className="absolute left-[-7px] top-0 h-[1109px] w-[calc(100%+14px)] bg-cover bg-top"
        style={{
          backgroundImage: `url(${fields.backgroundImageUrl})`,
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(37.3%_36.12%_at_49.97%_0%,rgba(0,52,65,0.558)_0%,rgba(0,52,65,0.93)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,52,65,0.08)_0%,rgba(0,52,65,0.72)_48%,rgba(0,52,65,0.96)_100%)]" />
      <div className="relative mx-auto max-w-[1600px] px-5 pb-16 pt-56 md:px-10 xl:px-20">
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

        <div className="mt-64 grid gap-14 border-t border-white/10 pt-20 lg:grid-cols-[minmax(280px,520px)_1fr]">
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
                        path={["linkGroups", groupIndex, "links", linkIndex, "label"]}
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
