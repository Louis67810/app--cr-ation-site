import type {
  HubService,
  RealisationsPageFields,
  RecentProjectsFields,
  SitePage,
} from "@/lib/site-template";
import {
  visibleProjectImageAssets,
  type ProjectImageAsset,
} from "@/lib/asset-visibility";

type RealisationCard = RealisationsPageFields["projects"][number];

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "zone"
  );
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function serviceEntries(pages: SitePage[]) {
  return pages
    .filter(
      (page) =>
        page.slug.startsWith("/prestations/") &&
        page.slug !== "/prestations",
    )
    .map((page): HubService | null => {
      const hero = page.sections.find(
        (section) => section.type === "services-hub-hero",
      );
      if (hero?.type !== "services-hub-hero") return null;
      return {
        title: hero.fields.title || page.title,
        description: hero.fields.subtitle,
        imageUrl: hero.fields.backgroundImageUrl,
        href: page.slug,
      };
    })
    .filter((entry): entry is HubService => Boolean(entry));
}

function realisationEntries(pages: SitePage[]) {
  const index = pages
    .flatMap((page) => page.sections)
    .find((section) => section.type === "realisations-page");
  if (index?.type === "realisations-page" && index.fields.projects.length)
    return uniqueBy(index.fields.projects, (project) =>
      [
        project.href,
        project.city,
        project.title,
        project.imageUrl,
      ].join("|"),
    );

  return pages
    .filter(
      (page) =>
        page.slug.startsWith("/realisations/") &&
        page.slug !== "/realisations",
    )
    .map((page): RealisationCard | null => {
      const detail = page.sections.find(
        (section) => section.type === "realisation-detail",
      );
      if (detail?.type !== "realisation-detail") return null;
      const city =
        detail.fields.breadcrumbs.at(-1)?.label?.trim() || "Autres";
      return {
        city,
        category: city,
        imageUrl: detail.fields.heroImageUrl,
        alt: detail.fields.heroImageAlt,
        title: detail.fields.title,
        href: page.slug,
      };
    })
    .filter((entry): entry is RealisationCard => Boolean(entry));
}

function recentProjects(
  projects: RealisationCard[],
): RecentProjectsFields["projects"] {
  return projects.map((project) => ({
    city: project.city,
    imageUrl: project.imageUrl,
    alt: project.alt,
    compareEnabled: "non",
    beforeImageUrl: project.imageUrl,
    afterImageUrl: project.imageUrl,
  }));
}

function createZonePage(
  homePage: SitePage,
  city: string,
  projects: RealisationCard[],
) {
  const citySlug = slugify(city);
  const page = structuredClone(homePage);
  page.id = `zone-${citySlug}`;
  page.slug = `/zones/${citySlug}`;
  page.title = `Paysagiste à ${city}`;
  delete page.editorial;
  page.sections = page.sections.map((section, index) => {
    const next = structuredClone(section);
    next.id = `zone-${citySlug}-${index + 1}`;
    return next;
  });
  return updateZonePage(page, city, projects);
}

function updateZonePage(
  page: SitePage,
  city: string,
  projects: RealisationCard[],
) {
  const next = structuredClone(page);
  const cityProjects = projects.filter(
    (project) => project.city.toLowerCase() === city.toLowerCase(),
  );
  const firstImage = cityProjects[0]?.imageUrl;
  next.title = `Paysagiste à ${city}`;
  next.sections = next.sections.map((section) => {
    if (section.type === "hero") {
      return {
        ...section,
        fields: {
          ...section.fields,
          ...(firstImage ? { backgroundImageUrl: firstImage } : {}),
          title: `Paysagiste à ${city}`,
          subtitle: `Découvrez nos prestations paysagères et les réalisations menées autour de ${city}.`,
        },
      };
    }
    if (section.type === "recent-projects") {
      return {
        ...section,
        fields: {
          ...section.fields,
          title: `Nos réalisations à ${city}`,
          subtitle: `Découvrez les projets paysagers réalisés à ${city} et dans les communes voisines.`,
          cities: [city],
          projects: recentProjects(cityProjects),
        },
      };
    }
    return section;
  });
  return next;
}

export function synchronizeCmsRelations(
  sourcePages: SitePage[],
  sourceAssets: ProjectImageAsset[] = [],
) {
  let pages = structuredClone(sourcePages);
  const services = serviceEntries(pages);
  const projects = realisationEntries(pages);
  const cities = uniqueBy(
    projects.map((project) => project.city.trim()).filter(Boolean),
    (city) => city.toLocaleLowerCase("fr"),
  );
  const cleanAssetUrls = visibleProjectImageAssets(sourceAssets)
    .map((asset) => asset.public_url)
    .slice(0, 12);
  const homePage = pages.find((page) => page.slug === "/");

  if (homePage && cities.length) {
    for (const city of cities) {
      const href = `/zones/${slugify(city)}`;
      const existingIndex = pages.findIndex((page) => page.slug === href);
      if (existingIndex >= 0)
        pages[existingIndex] = updateZonePage(
          pages[existingIndex],
          city,
          projects,
        );
      else pages.push(createZonePage(homePage, city, projects));
    }
  }

  const areaEntries = cities.map((city) => {
    const cityProjects = projects.filter(
      (project) => project.city.toLowerCase() === city.toLowerCase(),
    );
    return {
      name: city,
      href: `/zones/${slugify(city)}`,
      imageUrl: cityProjects[0]?.imageUrl ?? "",
    };
  });
  const projectCities = new Set(
    cities.map((city) => city.toLocaleLowerCase("fr")),
  );

  pages = pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => {
      if (section.type === "services" && services.length) {
        return {
          ...section,
          fields: {
            ...section.fields,
            services: services.slice(0, 3),
          },
        };
      }
      if (
        (section.type === "services-hub-hero" ||
          section.type === "services-hub-bento") &&
        services.length
      ) {
        return {
          ...section,
          fields: { ...section.fields, services },
        } as typeof section;
      }
      if (section.type === "recent-projects" && projects.length) {
        const scoped =
          page.slug.startsWith("/zones/") && section.fields.cities[0]
            ? projects.filter(
                (project) =>
                  project.city.toLowerCase() ===
                  section.fields.cities[0].toLowerCase(),
              )
            : projects;
        return {
          ...section,
          fields: {
            ...section.fields,
            cities: uniqueBy(
              scoped.map((project) => project.city),
              (city) => city.toLocaleLowerCase("fr"),
            ),
            projects: recentProjects(scoped),
          },
        };
      }
      if (section.type === "realisation-detail" && projects.length) {
        return {
          ...section,
          fields: {
            ...section.fields,
            relatedFilters: cities,
            relatedProjects: projects
              .filter((project) => project.href !== page.slug)
              .slice(0, 8),
          },
        };
      }
      if (
        section.type === "testimonials" &&
        section.variant === "gallery-a" &&
        cleanAssetUrls.length
      ) {
        return {
          ...section,
          fields: {
            ...section.fields,
            images: cleanAssetUrls.slice(0, 8),
          },
        };
      }
      if (section.type === "service-areas" && areaEntries.length) {
        return {
          ...section,
          fields: { ...section.fields, areas: areaEntries },
        };
      }
      if (section.type === "site-footer" && areaEntries.length) {
        const groupIndex = section.fields.linkGroups.findIndex((group) =>
          /zones?\s+d['’]intervention/i.test(group.title),
        );
        if (groupIndex < 0) return section;
        return {
          ...section,
          fields: {
            ...section.fields,
            linkGroups: section.fields.linkGroups.map((group, index) =>
              index === groupIndex
                ? {
                    ...group,
                    links: areaEntries.map((area) => ({
                      label: area.name,
                      href: area.href,
                    })),
                  }
                : group,
            ),
          },
        };
      }
      if (
        page.slug.startsWith("/zones/") &&
        section.type === "realisations-page"
      ) {
        const city = cities.find(
          (candidate) =>
            `/zones/${slugify(candidate)}` === page.slug &&
            projectCities.has(candidate.toLocaleLowerCase("fr")),
        );
        if (!city) return section;
        const scoped = projects.filter(
          (project) => project.city.toLowerCase() === city.toLowerCase(),
        );
        return {
          ...section,
          fields: {
            ...section.fields,
            title: `Nos réalisations à ${city}`,
            filters: [city],
            heroImages: scoped.map((project) => ({
              imageUrl: project.imageUrl,
              alt: project.alt,
            })),
            projects: scoped,
          },
        };
      }
      return section;
    }),
  }));

  return pages;
}
