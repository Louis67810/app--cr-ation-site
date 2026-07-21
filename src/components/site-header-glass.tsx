"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, Menu, Phone, X } from "lucide-react";
import {
  createContext,
  useEffect,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { SiteHeaderGlassFields } from "@/lib/site-template";

type EditablePath = Array<string | number>;

type HeaderRenderOptions = {
  editable?: boolean;
  disableLinks?: boolean;
  viewport?: "desktop" | "tablet" | "phone";
  onTextFocus?: () => void;
  onTextChange?: (path: EditablePath, value: string) => void;
};

type MegaMenuKind = "services" | "resources";

const PublishedPathContext = createContext("");

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
    title: "Entretenir",
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

function HeaderLink({
  href,
  className,
  style,
  children,
  ariaLabel,
  disabled,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const publishedPath = useContext(PublishedPathContext);
  const resolvedHref =
    publishedPath &&
    href.startsWith("/") &&
    href !== publishedPath &&
    !href.startsWith(`${publishedPath}/`)
      ? `${publishedPath}${href === "/" ? "" : href}`
      : href;

  if (disabled) {
    return (
      <span className={className} style={style} aria-label={ariaLabel}>
        {children}
      </span>
    );
  }

  if (resolvedHref.startsWith("/")) {
    return (
      <Link
        href={resolvedHref}
        className={className}
        style={style}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={resolvedHref}
      className={className}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}

function EditableHeaderText({
  value,
  path,
  options,
}: {
  value: string;
  path: EditablePath;
  options?: HeaderRenderOptions;
}) {
  if (!options?.editable) return <span>{value}</span>;

  return (
    <span
      className="outline-none focus:ring-2 focus:ring-[#0099ff]"
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
    </span>
  );
}

function RollingText({ value }: { value: string }) {
  return (
    <span className="cta-roll-text" data-text={value}>
      <span>{value}</span>
    </span>
  );
}

function getPublishedHome(pathname: string) {
  const match = pathname.match(/^\/published\/([^/]+)/);
  return match ? `/published/${match[1]}` : "/";
}

function findHeroBackground() {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('main [style*="background-image"]'),
  );
  return candidates.find((element) => element.style.backgroundImage)?.style
    .backgroundImage;
}

function findHeroSection() {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("main section"),
  );
  return (
    sections.find((section) =>
      section.querySelector<HTMLElement>('[style*="background-image"]'),
    ) ?? sections[0]
  );
}

export function SiteHeaderGlass({
  fields,
  variant = "glass-a",
  options,
}: {
  fields: SiteHeaderGlassFields;
  variant?: "glass-a" | "light-a";
  options?: HeaderRenderOptions;
}) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<MegaMenuKind | null>(null);
  const [pastHero, setPastHero] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOffset, setDrawerOffset] = useState(0);
  const [heroBackground, setHeroBackground] = useState<string>();
  const dragStartX = useRef<number | null>(null);
  const dragOffset = useRef(0);
  const light = variant === "light-a" || pastHero;
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";
  const desktopNavigation = options?.viewport
    ? compact || tablet
      ? "hidden"
      : "flex"
    : "hidden xl:flex";
  const mobileNavigation = options?.viewport
    ? compact || tablet
      ? "flex"
      : "hidden"
    : "flex xl:hidden";
  const phone = fields.phone?.trim() || "06 00 00 00 00";
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;
  const homeHref = getPublishedHome(pathname);
  const menuHeight = activeMenu === "resources" ? 365 : 350;

  useEffect(() => {
    if (options?.viewport) return;
    const hero = findHeroSection();
    if (!hero) return;

    const updateTheme = () => {
      setPastHero(hero.getBoundingClientRect().bottom <= 80);
    };

    updateTheme();
    window.addEventListener("scroll", updateTheme, { passive: true });
    window.addEventListener("resize", updateTheme);
    return () => {
      window.removeEventListener("scroll", updateTheme);
      window.removeEventListener("resize", updateTheme);
    };
  }, [options?.viewport]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHeroBackground(findHeroBackground());
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const closeMobile = () => {
    setDrawerOffset(0);
    setMobileOpen(false);
  };

  const onDrawerPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDrawerPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragStartX.current === null) return;
    const nextOffset = Math.max(0, event.clientX - dragStartX.current);
    dragOffset.current = nextOffset;
    setDrawerOffset(nextOffset);
  };

  const onDrawerPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragStartX.current === null) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartX.current = null;
    if (dragOffset.current > 90) closeMobile();
    else setDrawerOffset(0);
    dragOffset.current = 0;
  };

  return (
    <PublishedPathContext.Provider value={homeHref === "/" ? "" : homeHref}>
      <header
        onMouseLeave={() => setActiveMenu(null)}
        className={`${options?.viewport ? "absolute" : "relative md:fixed"} inset-x-0 top-0 z-[90] overflow-visible font-[var(--font-inter)] transition-[height,background-color,color,border-color] duration-500 ease-in-out xl:overflow-hidden ${
          light
            ? "border-b border-black/10 bg-white/90 text-black backdrop-blur-md"
            : "border-b border-white/10 bg-white/[0.03] text-white backdrop-blur-md"
        }`}
        style={{ height: activeMenu ? 80 + menuHeight : 80 }}
      >
        <div className="relative z-20 mx-auto flex min-h-20 max-w-[1600px] items-center justify-between px-5 py-[10px] md:px-10 xl:px-20">
          <HeaderLink
            href={homeHref}
            className={`typo-body-small flex h-11 min-w-24 items-center justify-center rounded-lg px-3 ${
              light ? "bg-black/[0.06] text-black" : "bg-white/10 text-white"
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
              <EditableHeaderText
                value={fields.logoLabel}
                path={["logoLabel"]}
                options={options}
              />
            )}
          </HeaderLink>

          <nav
            aria-label="Navigation principale"
            className={`${desktopNavigation} typo-body-small h-20 items-center gap-7 leading-none`}
          >
            <MegaMenuTrigger
              label="Prestations"
              kind="services"
              active={activeMenu === "services"}
              onActivate={setActiveMenu}
            />
            <HeaderLink
              href="/realisations"
              className="cta-roll whitespace-nowrap"
              disabled={options?.disableLinks}
            >
              <RollingText value="Réalisations" />
            </HeaderLink>
            <HeaderLink
              href="/a-propos"
              className="cta-roll whitespace-nowrap"
              disabled={options?.disableLinks}
            >
              <RollingText value="À propos" />
            </HeaderLink>
            <MegaMenuTrigger
              label="Ressources"
              kind="resources"
              active={activeMenu === "resources"}
              onActivate={setActiveMenu}
            />
          </nav>

          <HeaderLink
            href={phoneHref}
            ariaLabel={`Appeler le ${phone}`}
            disabled={options?.disableLinks}
            className={`${desktopNavigation} site-cta site-cta-primary cta-roll rounded-full text-[#00d494]`}
          >
            <Phone size={16} />
            {options?.editable ? (
              <EditableHeaderText
                value={fields.phoneLabel?.trim() || "Appeler"}
                path={["phoneLabel"]}
                options={options}
              />
            ) : (
              <RollingText value={fields.phoneLabel?.trim() || "Appeler"} />
            )}
          </HeaderLink>

          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-navigation"
            onClick={() => setMobileOpen(true)}
            className={`${mobileNavigation} size-11 items-center justify-center`}
          >
            <Menu size={24} />
          </button>
        </div>

        <div
          aria-hidden={!activeMenu}
          className={`absolute inset-x-0 top-20 transition-opacity duration-300 ease-in-out ${
            activeMenu ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 xl:px-20">
            {activeMenu === "resources" ? (
              <ResourcesMenu disabled={options?.disableLinks} />
            ) : (
              <ServicesMenu disabled={options?.disableLinks} />
            )}
          </div>
        </div>

        {activeMenu && !options?.disableLinks ? (
          <span
            aria-hidden
            className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 bg-black/20 backdrop-blur-[7px]"
            style={{ top: 80 + menuHeight }}
          />
        ) : null}

        <MobileDrawer
          open={mobileOpen}
          disabled={options?.disableLinks}
          heroBackground={heroBackground}
          offset={drawerOffset}
          onClose={closeMobile}
          onPointerDown={onDrawerPointerDown}
          onPointerMove={onDrawerPointerMove}
          onPointerUp={onDrawerPointerUp}
        />
      </header>
    </PublishedPathContext.Provider>
  );
}

function MegaMenuTrigger({
  label,
  kind,
  active,
  onActivate,
}: {
  label: string;
  kind: MegaMenuKind;
  active: boolean;
  onActivate: (kind: MegaMenuKind) => void;
}) {
  return (
    <button
      type="button"
      className="cta-roll flex h-full items-center gap-1.5 whitespace-nowrap"
      aria-haspopup="true"
      aria-expanded={active}
      onMouseEnter={() => onActivate(kind)}
      onFocus={() => onActivate(kind)}
    >
      <RollingText value={label} />
      <ChevronDown
        size={14}
        className={`transition-transform duration-300 ease-in-out ${
          active ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

function ServicesMenu({ disabled }: { disabled?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-10">
      {serviceMenuGroups.map((group) => (
        <div key={group.title}>
          <HeaderLink
            href="/prestations"
            disabled={disabled}
            className="typo-h5 inline-flex"
          >
            {group.title}
          </HeaderLink>
          <div className="mt-4 divide-y divide-current/10">
            {group.links.map(([title, href]) => (
              <HeaderLink
                key={href}
                href={href}
                disabled={disabled}
                className="cta-roll typo-body-small flex items-center justify-between py-2 leading-[1.5]"
              >
                <RollingText value={title} />
                <ArrowUpRight size={15} className="opacity-40" />
              </HeaderLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResourcesMenu({ disabled }: { disabled?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {resourceCards.map((card) => (
        <HeaderLink
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
        </HeaderLink>
      ))}
    </div>
  );
}

function MobileDrawer({
  open,
  disabled,
  heroBackground,
  offset,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  open: boolean;
  disabled?: boolean;
  heroBackground?: string;
  offset: number;
  onClose: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Fermer le menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/35 transition-opacity duration-500 ease-in-out xl:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        id="site-mobile-navigation"
        aria-hidden={!open}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="fixed inset-y-0 right-0 z-50 w-[min(88vw,460px)] touch-pan-y overflow-y-auto text-white shadow-2xl transition-transform duration-500 ease-in-out xl:hidden"
        style={{
          backgroundImage: heroBackground,
          backgroundPosition: "center",
          backgroundSize: "cover",
          transform: open ? `translateX(${offset}px)` : "translateX(100%)",
        }}
      >
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative flex min-h-full flex-col px-6 py-6 md:px-10 md:py-8">
          <div className="flex items-center justify-between">
            <span className="typo-body-small opacity-60">Navigation</span>
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={onClose}
              className="grid size-11 place-items-center"
            >
              <X size={24} />
            </button>
          </div>
          <nav
            aria-label="Navigation mobile"
            className="mt-10 flex flex-1 flex-col"
          >
            <details className="group/sub border-b border-white/15 py-1">
              <summary className="typo-body-small flex cursor-pointer list-none items-center justify-between py-4 leading-none [&::-webkit-details-marker]:hidden">
                Prestations
                <ChevronDown
                  size={16}
                  className="transition-transform duration-300 group-open/sub:rotate-180"
                />
              </summary>
              <div className="grid gap-1 pb-4 pl-2">
                {serviceMenuGroups
                  .flatMap((group) => group.links)
                  .map(([title, href]) => (
                    <HeaderLink
                      key={href}
                      href={href}
                      disabled={disabled}
                      className="typo-body-small flex items-center justify-between py-2 leading-[1.4] opacity-70"
                    >
                      {title}
                      <ArrowUpRight size={15} />
                    </HeaderLink>
                  ))}
              </div>
            </details>
            <HeaderLink
              href="/realisations"
              disabled={disabled}
              className="typo-body-small block border-b border-white/15 py-5 leading-none"
            >
              Réalisations
            </HeaderLink>
            <HeaderLink
              href="/a-propos"
              disabled={disabled}
              className="typo-body-small block border-b border-white/15 py-5 leading-none"
            >
              À propos
            </HeaderLink>
            <details className="group/sub border-b border-white/15 py-1">
              <summary className="typo-body-small flex cursor-pointer list-none items-center justify-between py-4 leading-none [&::-webkit-details-marker]:hidden">
                Ressources
                <ChevronDown
                  size={16}
                  className="transition-transform duration-300 group-open/sub:rotate-180"
                />
              </summary>
              <div className="grid gap-1 pb-4 pl-2">
                {resourceCards.map((card) => (
                  <HeaderLink
                    key={card.href}
                    href={card.href}
                    disabled={disabled}
                    className="typo-body-small flex items-center justify-between py-2 leading-[1.4] opacity-70"
                  >
                    {card.title}
                    <ArrowUpRight size={15} />
                  </HeaderLink>
                ))}
              </div>
            </details>
            <HeaderLink
              href="/contact"
              disabled={disabled}
              className="typo-body-small block border-b border-white/15 py-5 leading-none"
            >
              Contact
            </HeaderLink>
          </nav>
          <p className="typo-body-small mt-10 leading-[1.5] text-white/50">
            Glissez le panneau vers la droite pour le fermer.
          </p>
        </div>
      </aside>
    </>,
    document.body,
  );
}
