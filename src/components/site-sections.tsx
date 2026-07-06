import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type {
  HeroFullImageFields,
  SectionInstance,
  ServicesCardsFields,
  SiteHeaderGlassFields,
  SocialProofBandFields,
} from "@/lib/site-template";

type EditablePath = Array<string | number>;

type RenderSectionOptions = {
  editable?: boolean;
  disableLinks?: boolean;
  viewport?: "desktop" | "tablet" | "phone";
  onTextFocus?: () => void;
  onTextChange?: (path: EditablePath, value: string) => void;
};

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
  variant: "primary" | "secondary" | "explore";
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
      return <ServicesCardsA fields={section.fields} options={options} />;
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
          className="flex h-11 w-24 items-center justify-center rounded-lg bg-white/10 text-xs font-medium text-white/70"
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
          className={`items-center text-[18px] leading-[102.88%] tracking-[-0.03em] text-white ${
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
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${fields.backgroundImageUrl})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(54%_54%_at_50%_50%,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.86)_100%)]" />
      <div className="relative z-10 mx-auto flex min-h-[var(--site-hero-height,95vh)] max-w-[1600px] items-end px-5 pb-12 pt-28 md:px-10 md:pb-20 xl:px-20">
        <div
          className={`grid w-full items-end ${
            compact || tablet
              ? "grid-cols-1 gap-10"
              : "gap-[105px] lg:grid-cols-[minmax(0,760px)_minmax(320px,448px)] lg:justify-between"
          }`}
        >
          <div className={compact ? "max-w-[330px]" : "max-w-[760px]"}>
            <EditableText
              as="h1"
              value={fields.title}
              path={["title"]}
              options={options}
              className={`font-serif leading-none text-white ${
                compact ? "text-5xl" : tablet ? "text-6xl" : "text-5xl md:text-7xl"
              }`}
            />
            <EditableText
              as="p"
              value={fields.subtitle}
              path={["subtitle"]}
              options={options}
              className={`mt-7 max-w-[660px] font-normal text-white/88 ${
                compact
                  ? "text-sm leading-7"
                  : tablet
                    ? "text-base leading-8"
                    : "text-base leading-8 md:text-xl md:leading-10"
              }`}
            />
            <div className={`mt-7 flex flex-wrap gap-3 ${compact ? "hidden" : ""}`}>
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
              <div className="flex flex-wrap items-center gap-[11px] text-[16px] leading-none">
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
              : "sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]"
        }`}
      >
        {fields.stats.map((stat, index) => (
          <div
            key={`${stat.value}-${index}`}
            className={`px-4 text-center md:px-10 ${
              index > 0 ? "lg:border-l lg:border-white/20" : ""
            }`}
          >
            <EditableText
              value={stat.value}
              path={["stats", index, "value"]}
              options={options}
              className="block font-serif text-5xl leading-none text-[#00d494]"
            />
            <EditableText
              as="p"
              value={stat.label}
              path={["stats", index, "label"]}
              options={options}
              className="mx-auto mt-4 max-w-[390px] text-sm font-medium leading-7 text-white/75"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesCardsA({
  fields,
  options,
}: {
  fields: ServicesCardsFields;
  options?: RenderSectionOptions;
}) {
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";

  return (
    <section className="bg-white px-5 pb-20 pt-32 font-[var(--font-inter)] md:px-10 md:pb-28 xl:px-20">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center justify-between gap-6 border-b border-black/15 pb-14">
          <EditableText
            as="h2"
            value={fields.title}
            path={["title"]}
            options={options}
            className="font-serif text-5xl leading-none text-[#0f1112] md:text-6xl"
          />
          <div className="hidden md:block">
            <SiteCta
              variant="primary"
              href={fields.cta.href}
              value={fields.cta.label}
              path={["cta", "label"]}
              options={options}
            />
          </div>
        </div>
        <div
          className={`mt-20 grid gap-6 ${
            compact ? "grid-cols-1" : tablet ? "grid-cols-2" : "md:grid-cols-3"
          }`}
        >
          {fields.services.map((service, index) => (
            <article
              key={`${service.href}-${index}`}
              className="service-card-shadow relative aspect-[514/638] min-h-[520px] overflow-hidden rounded-[18px] border border-black/[0.06] bg-cover bg-center"
              style={{ backgroundImage: `url(${service.imageUrl})` }}
            >
              <div className="absolute inset-x-0 top-[34%] h-[90%] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,#000_67.48%)]" />
              <div className="absolute inset-x-6 bottom-6 z-10 lg:inset-x-8 lg:bottom-8">
                <EditableText
                  as="h3"
                  value={service.title}
                  path={["services", index, "title"]}
                  options={options}
                  className="text-2xl font-semibold text-white"
                />
                <EditableText
                  as="p"
                  value={service.description}
                  path={["services", index, "description"]}
                  options={options}
                  className="mt-4 max-w-md text-sm font-medium leading-7 text-white/75 md:text-base md:leading-8"
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
