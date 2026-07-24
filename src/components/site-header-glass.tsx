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
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
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

type ServiceMenuGroup = {
  title: string;
  links: Array<readonly [string, string]>;
};

const fallbackServiceMenuGroups: ServiceMenuGroup[] = [
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

function buildServiceMenuGroups(
  services: SiteHeaderGlassFields["serviceLinks"],
) {
  const links = Array.from(
    new Map(
      (services ?? [])
        .filter((service) => service.title.trim() && service.href.trim())
        .map((service) => [
          service.href,
          [service.title, service.href] as const,
        ]),
    ).values(),
  );
  if (!links.length) return fallbackServiceMenuGroups;

  const groupTitles = ["Créer", "Conception", "Aménager"];
  const groupSize = Math.ceil(links.length / groupTitles.length);
  const groups = groupTitles
    .map((title, index): ServiceMenuGroup => ({
      title,
      links: links.slice(index * groupSize, (index + 1) * groupSize),
    }))
    .filter((group) => group.links.length);

  groups.at(-1)?.links.push(["Toutes les prestations", "/prestations"]);
  return groups;
}

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
    <span aria-hidden className="cta-roll-text" data-text={value}>
      <span>{value}</span>
    </span>
  );
}

function getPublishedHome(pathname: string) {
  const match = pathname.match(/^\/published\/([^/]+)/);
  return match ? `/published/${match[1]}` : "/";
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
  const [mobileHeaderVisible, setMobileHeaderVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [drawerOffset, setDrawerOffset] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragOffset = useRef(0);
  const light = variant === "light-a" || pastHero;
  const compact = options?.viewport === "phone";
  const tablet = options?.viewport === "tablet";
  const desktopNavigation = options?.viewport
    ? compact || tablet
      ? "hidden"
      : "flex"
    : "hidden 2xl:flex";
  const mobileNavigation = options?.viewport
    ? compact || tablet
      ? "flex"
      : "hidden"
    : "flex 2xl:hidden";
  const desktopCta = options?.viewport
    ? compact || tablet
      ? "!hidden"
      : "!inline-flex"
    : "!hidden 2xl:!inline-flex";
  const phone = fields.phone?.trim() || "06 00 00 00 00";
  const logoImageUrl = light
    ? fields.brand?.logoOnLightUrl || fields.logoImageUrl
    : fields.brand?.logoOnDarkUrl || fields.logoImageUrl;
  const phoneHref = `tel:${phone.replace(/[^+\d]/g, "")}`;
  const homeHref = getPublishedHome(pathname);
  const serviceMenuGroups = buildServiceMenuGroups(fields.serviceLinks);
  const navigation = fields.navigation.length
    ? fields.navigation
    : [
        { label: "Prestations", href: "/prestations" },
        { label: "Réalisations", href: "/realisations" },
        { label: "À propos", href: "/a-propos" },
        { label: "Ressources", href: "/blog" },
      ];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPortalReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (options?.viewport) return;
    const hero = findHeroSection();
    if (!hero) return;

    let frame = 0;
    let previousScrollY = window.scrollY;
    const updateHeader = () => {
      const nextState = hero.getBoundingClientRect().bottom <= 96;
      const currentScrollY = window.scrollY;
      const isPhone = window.matchMedia("(max-width: 767px)").matches;
      setPastHero((current) => current === nextState ? current : nextState);

      if (!isPhone || !nextState) {
        setMobileHeaderVisible(true);
        previousScrollY = currentScrollY;
      } else {
        const scrollDelta = currentScrollY - previousScrollY;
        if (Math.abs(scrollDelta) >= 6) {
          setMobileHeaderVisible(scrollDelta < 0);
          previousScrollY = currentScrollY;
        }
      }
      frame = 0;
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHeader);
    };

    frame = window.requestAnimationFrame(updateHeader);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [options?.viewport]);

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

  const beginDrawerDrag = (clientX: number) => {
    dragStartX.current = clientX;
    dragOffset.current = 0;
  };

  const updateDrawerDrag = (clientX: number) => {
    if (dragStartX.current === null) return;
    const nextOffset = Math.max(0, clientX - dragStartX.current);
    dragOffset.current = nextOffset;
    setDrawerOffset(nextOffset);
  };

  const endDrawerDrag = () => {
    if (dragStartX.current === null) return;
    dragStartX.current = null;
    if (dragOffset.current > 90) closeMobile();
    else setDrawerOffset(0);
    dragOffset.current = 0;
  };

  const onDrawerPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("a, button, summary, input, select, textarea")
    ) {
      return;
    }
    beginDrawerDrag(event.clientX);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDrawerPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    updateDrawerDrag(event.clientX);
  };

  const onDrawerPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    endDrawerDrag();
  };

  const onDrawerMouseDown = (event: ReactMouseEvent<HTMLElement>) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("a, button, summary, input, select, textarea")
    ) {
      return;
    }
    beginDrawerDrag(event.clientX);
  };

  const onDrawerMouseMove = (event: ReactMouseEvent<HTMLElement>) => {
    updateDrawerDrag(event.clientX);
  };

  const onDrawerMouseUp = () => {
    endDrawerDrag();
  };

  const onDrawerTouchStart = (event: ReactTouchEvent<HTMLElement>) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("a, button, summary, input, select, textarea")
    ) {
      return;
    }
    const touch = event.touches[0];
    if (touch) beginDrawerDrag(touch.clientX);
  };

  const onDrawerTouchMove = (event: ReactTouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (touch) updateDrawerDrag(touch.clientX);
  };

  const onDrawerTouchEnd = () => {
    endDrawerDrag();
  };

  return (
    <PublishedPathContext.Provider value={homeHref === "/" ? "" : homeHref}>
      <header
        onMouseLeave={() => setActiveMenu(null)}
        className={`${options?.viewport ? "absolute" : pastHero ? "fixed" : "absolute md:fixed"} inset-x-0 top-0 z-[90] transform-gpu overflow-visible font-[var(--font-inter)] will-change-transform transition-[transform,background-color,color,border-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:duration-500 ${
          !options?.viewport && pastHero && !mobileHeaderVisible && !mobileOpen
            ? "-translate-y-full md:translate-y-0"
            : "translate-y-0"
        } ${
          light
            ? "border-b border-black/10 bg-white/95 text-black backdrop-blur-md"
            : activeMenu
              ? "border-b border-white/10 bg-[#080a09]/95 text-white backdrop-blur-xl"
              : "border-b border-white/10 bg-black/45 text-white backdrop-blur-md"
        }`}
      >
        <div className="relative z-20 mx-auto flex h-24 max-w-[1600px] items-center justify-between px-5 md:px-10 xl:px-20">
          <HeaderLink
            href={homeHref}
            className={`typo-body-small flex h-11 min-w-24 items-center justify-center rounded-lg px-3 ${
              light ? "bg-black/[0.06] text-black" : "bg-white/10 text-white"
            }`}
            ariaLabel="Accueil"
            disabled={options?.disableLinks}
          >
            {logoImageUrl ? (
              <span
                className="h-8 w-20 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${logoImageUrl})` }}
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
            className={`${desktopNavigation} typo-body-small h-full items-center gap-7 leading-none`}
          >
            {navigation.map((item) =>
              item.href === "/prestations" ? (
                <MegaMenuTrigger
                  key={item.href}
                  label={item.label}
                  kind="services"
                  href={item.href}
                  active={activeMenu === "services"}
                  onActivate={setActiveMenu}
                  disabled={options?.disableLinks}
                />
              ) : item.href === "/blog" ? (
                <MegaMenuTrigger
                  key={item.href}
                  label={item.label}
                  kind="resources"
                  href={item.href}
                  active={activeMenu === "resources"}
                  onActivate={setActiveMenu}
                  disabled={options?.disableLinks}
                />
              ) : (
                <HeaderLink
                  key={item.href}
                  href={item.href}
                  ariaLabel={item.label}
                  className="cta-roll whitespace-nowrap"
                  disabled={options?.disableLinks}
                >
                  <RollingText value={item.label} />
                </HeaderLink>
              ),
            )}
          </nav>

          <HeaderLink
            href={phoneHref}
            ariaLabel={`Appeler le ${phone}`}
            disabled={options?.disableLinks}
            className={`${desktopCta} site-cta site-cta-primary cta-roll rounded-full text-[#00d494]`}
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
            className={`${mobileNavigation} relative z-30 size-11 shrink-0 items-center justify-center`}
          >
            <Menu size={24} />
          </button>
        </div>

        <div
          aria-hidden={!activeMenu}
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
            activeMenu
              ? "grid-rows-[1fr] opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mx-auto max-w-[1600px] px-5 pb-14 pt-8 md:px-10 xl:px-20">
              {activeMenu === "resources" ? (
                <ResourcesMenu disabled={options?.disableLinks} />
              ) : (
                <ServicesMenu
                  groups={serviceMenuGroups}
                  disabled={options?.disableLinks}
                />
              )}
            </div>
          </div>
        </div>

        {portalReady ? (
          <>
            <DesktopBackdrop
              open={Boolean(activeMenu) && !options?.disableLinks}
              onClose={() => setActiveMenu(null)}
            />

            <MobileDrawer
              open={mobileOpen}
              disabled={options?.disableLinks}
              fields={fields}
              serviceGroups={serviceMenuGroups}
              homeHref={homeHref}
              offset={drawerOffset}
              onClose={closeMobile}
              onPointerDown={onDrawerPointerDown}
              onPointerMove={onDrawerPointerMove}
              onPointerUp={onDrawerPointerUp}
              onMouseDown={onDrawerMouseDown}
              onMouseMove={onDrawerMouseMove}
              onMouseUp={onDrawerMouseUp}
              onTouchStart={onDrawerTouchStart}
              onTouchMove={onDrawerTouchMove}
              onTouchEnd={onDrawerTouchEnd}
            />
          </>
        ) : null}
      </header>
      {!options?.viewport ? (
        <div
          aria-hidden={!pastHero}
          inert={!pastHero}
          className={`fixed inset-x-0 bottom-0 z-[70] flex h-[132px] transform-gpu items-end bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0.94)_55%,#fff_100%)] px-4 will-change-[transform,opacity] transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
            pastHero
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-full opacity-0"
          }`}
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
        >
          <HeaderLink
            href={phoneHref}
            ariaLabel={`Appeler le ${phone}`}
            className="site-cta site-cta-primary pointer-events-auto !flex w-full items-center justify-center rounded-full text-[#00d494]"
          >
            <Phone size={16} />
            <span>{fields.phoneLabel?.trim() || "Appeler"}</span>
          </HeaderLink>
        </div>
      ) : null}
    </PublishedPathContext.Provider>
  );
}

function MegaMenuTrigger({
  label,
  kind,
  href,
  active,
  onActivate,
  disabled,
}: {
  label: string;
  kind: MegaMenuKind;
  href: string;
  active: boolean;
  onActivate: (kind: MegaMenuKind) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex h-full items-center"
      onMouseEnter={() => onActivate(kind)}
      onFocus={() => onActivate(kind)}
    >
      <HeaderLink
        href={href}
        disabled={disabled}
        ariaLabel={label}
        className="cta-roll flex h-full items-center gap-1.5 whitespace-nowrap"
      >
        <RollingText value={label} />
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ease-in-out ${
            active ? "rotate-180" : ""
          }`}
        />
      </HeaderLink>
    </div>
  );
}

function ServicesMenu({
  groups,
  disabled,
}: {
  groups: ServiceMenuGroup[];
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-10">
      {groups.map((group) => (
        <div key={group.title}>
          <HeaderLink
            href="/prestations"
            disabled={disabled}
            className="typo-h5 inline-flex"
          >
            {group.title}
          </HeaderLink>
          <div className="mt-4 grid">
            {group.links.map(([title, href]) => (
              <HeaderLink
                key={href}
                href={href}
                ariaLabel={title}
                disabled={disabled}
                className="cta-roll typo-body-small !flex w-full !justify-between gap-4 border-b border-current/10 py-2.5 text-left leading-[1.5] last:border-b-0"
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

function DesktopBackdrop({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <button
      type="button"
      aria-label="Fermer le menu de navigation"
      tabIndex={open ? 0 : -1}
      onClick={onClose}
      onMouseEnter={onClose}
      className={`fixed inset-0 z-[80] hidden bg-black/60 backdrop-blur-[10px] transition-opacity duration-500 ease-in-out 2xl:block ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    />,
    document.body,
  );
}

function MobileDrawer({
  open,
  disabled,
  fields,
  serviceGroups,
  homeHref,
  offset,
  onClose,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: {
  open: boolean;
  disabled?: boolean;
  fields: SiteHeaderGlassFields;
  serviceGroups: ServiceMenuGroup[];
  homeHref: string;
  offset: number;
  onClose: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onMouseDown: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseMove: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseUp: () => void;
  onTouchStart: (event: ReactTouchEvent<HTMLElement>) => void;
  onTouchMove: (event: ReactTouchEvent<HTMLElement>) => void;
  onTouchEnd: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Fermer le menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-[95] bg-black/55 backdrop-blur-sm transition-opacity duration-500 ease-in-out 2xl:hidden ${
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
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="fixed inset-y-0 right-0 z-[100] w-full touch-pan-y overflow-y-auto bg-[#f6f6f4] text-[#0f1112] transition-transform duration-500 ease-in-out 2xl:hidden"
        style={{
          transform: open ? `translateX(${offset}px)` : "translateX(100%)",
        }}
      >
        <div className="relative flex min-h-full flex-col px-6 py-6 md:px-10 md:py-8">
          <div className="flex items-center justify-between">
            <HeaderLink
              href={homeHref}
              ariaLabel="Accueil"
              disabled={disabled}
              className="typo-body-small flex h-11 min-w-24 items-center justify-center rounded-lg bg-black/[0.06] px-3 text-black"
            >
              {fields.brand?.logoOnLightUrl || fields.logoImageUrl ? (
                <span
                  className="h-8 w-20 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${fields.brand?.logoOnLightUrl || fields.logoImageUrl})` }}
                  role="img"
                  aria-label={fields.logoLabel || "Logo"}
                />
              ) : (
                fields.logoLabel
              )}
            </HeaderLink>
            <button
              type="button"
              aria-label="Fermer le menu"
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              className="relative z-10 grid size-11 place-items-center"
            >
              <X size={24} />
            </button>
          </div>
          <nav
            aria-label="Navigation mobile"
            className="mt-10 flex flex-1 flex-col"
          >
            <details className="group/sub border-b border-black/10 py-1">
              <summary className="typo-body-small flex w-full cursor-pointer list-none items-center justify-between py-4 text-left leading-none [&::-webkit-details-marker]:hidden">
                Prestations
                <ChevronDown
                  size={16}
                  className="transition-transform duration-300 group-open/sub:rotate-180"
                />
              </summary>
              <div className="grid gap-1 pb-4">
                {serviceGroups
                  .flatMap((group) => group.links)
                  .map(([title, href]) => (
                    <HeaderLink
                      key={href}
                      href={href}
                      disabled={disabled}
                      className="typo-body-small flex items-center justify-between py-2 text-left leading-[1.4] text-black/70"
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
              className="typo-body-small block border-b border-black/10 py-5 leading-none"
            >
              Réalisations
            </HeaderLink>
            <HeaderLink
              href="/a-propos"
              disabled={disabled}
              className="typo-body-small block border-b border-black/10 py-5 leading-none"
            >
              À propos
            </HeaderLink>
            <details className="group/sub border-b border-black/10 py-1">
              <summary className="typo-body-small flex w-full cursor-pointer list-none items-center justify-between py-4 text-left leading-none [&::-webkit-details-marker]:hidden">
                Ressources
                <ChevronDown
                  size={16}
                  className="transition-transform duration-300 group-open/sub:rotate-180"
                />
              </summary>
              <div className="grid gap-1 pb-4">
                {resourceCards.map((card) => (
                  <HeaderLink
                    key={card.href}
                    href={card.href}
                    disabled={disabled}
                    className="typo-body-small flex items-center justify-between py-2 text-left leading-[1.4] text-black/70"
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
              className="typo-body-small block border-b border-black/10 py-5 leading-none"
            >
              Contact
            </HeaderLink>
          </nav>
        </div>
      </aside>
    </>,
    document.body,
  );
}
