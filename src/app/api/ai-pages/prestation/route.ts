import { NextResponse } from "next/server";
import { demoServiceDetailPages, demoSitePages } from "@/lib/demo-site";
import {
  generateServicePageCopy,
  type GeneratedServicePageCopy,
  type ServicePageTextTemplate,
} from "@/lib/service-page-generation";
import { normalizeProjectKey } from "@/lib/project-key";
import { createClient } from "@/lib/supabase/server";
import type {
  FaqFields,
  SectorServicesFields,
  ServicesHubHeroFields,
  SitePage,
  TestimonialsFields,
} from "@/lib/site-template";
import { visibleProjectImageAssets } from "@/lib/asset-visibility";
import { synchronizeCmsRelations } from "@/lib/cms-relations";

export const runtime = "nodejs";
export const maxDuration = 300;

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "nouvelle-prestation"
  );
}

function getServiceTemplate(page: SitePage): ServicePageTextTemplate {
  const hero = page.sections.find(
    (section) => section.type === "services-hub-hero",
  );
  const testimonials = page.sections.find(
    (section) =>
      section.type === "testimonials" && section.variant === "gallery-a",
  );
  const benefits = page.sections.find(
    (section) => section.type === "sector-services",
  );
  const faq = page.sections.find((section) => section.type === "faq");
  if (
    hero?.type !== "services-hub-hero" ||
    testimonials?.type !== "testimonials" ||
    testimonials.variant !== "gallery-a" ||
    benefits?.type !== "sector-services" ||
    faq?.type !== "faq"
  )
    throw new Error(
      "Le modèle Prestation doit contenir un hero, des témoignages, des bénéfices et une FAQ.",
    );

  return {
    pageTitle: page.title,
    heroTitle: hero.fields.title,
    heroSubtitle: hero.fields.subtitle,
    testimonialsTitle: testimonials.fields.title,
    benefitsTitle: benefits.fields.title,
    benefits: benefits.fields.services.map(({ title, description }) => ({
      title,
      description,
    })),
    faqTitle: faq.fields.title,
    faqItems: faq.fields.items.map(({ question, answer }) => ({
      question,
      answer,
    })),
  };
}

function uniqueServiceSlug(pages: SitePage[], suggestion: string) {
  const existing = new Set(pages.map((page) => page.slug));
  const base = slugify(suggestion);
  let candidate = base;
  let suffix = 2;
  while (existing.has(`/prestations/${candidate}`))
    candidate = `${base}-${suffix++}`;
  return candidate;
}

function applyGeneratedCopy(input: {
  pages: SitePage[];
  source: SitePage;
  copy: GeneratedServicePageCopy;
}) {
  const nextPages = structuredClone(input.pages);
  const slug = uniqueServiceSlug(
    nextPages,
    input.copy.slugSuggestion || input.copy.pageTitle,
  );
  const href = `/prestations/${slug}`;
  const page = structuredClone(input.source);
  page.id = `service-detail-${slug}`;
  page.slug = href;
  page.title = input.copy.pageTitle;
  delete page.editorial;

  page.sections = page.sections.map((section, index) => {
    const next = structuredClone(section);
    next.id = `service-${slug}-${index + 1}`;
    if (next.type === "services-hub-hero") {
      const fields: ServicesHubHeroFields = {
        ...next.fields,
        title: input.copy.hero.title,
        subtitle: input.copy.hero.subtitle,
      };
      return { ...next, fields };
    }
    if (next.type === "testimonials" && next.variant === "gallery-a") {
      const fields: TestimonialsFields = {
        ...next.fields,
        title: input.copy.testimonialsTitle,
      };
      return { ...next, fields };
    }
    if (next.type === "sector-services") {
      const fields: SectorServicesFields = {
        ...next.fields,
        title: input.copy.benefits.title,
        services: next.fields.services.map((service, itemIndex) => ({
          ...service,
          title:
            input.copy.benefits.items[itemIndex]?.title ?? service.title,
          description:
            input.copy.benefits.items[itemIndex]?.description ??
            service.description,
        })),
      };
      return { ...next, fields };
    }
    if (next.type === "faq") {
      const fields: FaqFields = {
        ...next.fields,
        title: input.copy.faq.title,
        items: next.fields.items.map((item, itemIndex) => ({
          question:
            input.copy.faq.items[itemIndex]?.question ?? item.question,
          answer: input.copy.faq.items[itemIndex]?.answer ?? item.answer,
        })),
      };
      return { ...next, fields };
    }
    return next;
  });

  const hero = page.sections.find(
    (section) => section.type === "services-hub-hero",
  );
  const heroImageUrl =
    hero?.type === "services-hub-hero"
      ? hero.fields.backgroundImageUrl
      : "";
  const hubEntry = {
    title: input.copy.pageTitle,
    description: input.copy.hero.subtitle,
    imageUrl: heroImageUrl,
    href,
  };
  nextPages.push(page);
  for (const currentPage of nextPages) {
    currentPage.sections = currentPage.sections.map((section) => {
      if (
        section.type !== "services-hub-hero" &&
        section.type !== "services-hub-bento"
      )
        return section;
      if (section.fields.services.some((service) => service.href === href))
        return section;
      return {
        ...section,
        fields: {
          ...section.fields,
          services: [...section.fields.services, hubEntry],
        },
      } as typeof section;
    });
  }
  return { pages: nextPages, page, href };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId)
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const payload = (await request.json()) as {
    projectKey?: unknown;
    projectOwnerId?: unknown;
    serviceName?: unknown;
    brief?: unknown;
    executionMode?: unknown;
    templatePageId?: unknown;
  };
  if (
    typeof payload.serviceName !== "string" ||
    !payload.serviceName.trim() ||
    typeof payload.brief !== "string" ||
    !payload.brief.trim() ||
    (payload.executionMode !== "test" && payload.executionMode !== "classic")
  )
    return NextResponse.json(
      { error: "Le nom, les informations et le mode sont obligatoires." },
      { status: 400 },
    );

  const projectKey = normalizeProjectKey(payload.projectKey);
  const projectOwnerId =
    typeof payload.projectOwnerId === "string"
      ? payload.projectOwnerId
      : userId;
  if (projectOwnerId !== userId) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("owner_id", projectOwnerId)
      .eq("project_key", projectKey)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership)
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { data: projectRow } = await supabase
    .from("site_projects")
    .select("project_name, pages")
    .eq("owner_id", projectOwnerId)
    .eq("project_key", projectKey)
    .maybeSingle();
  const projectName = projectRow?.project_name ?? "Projet paysagiste";
  const pages = Array.isArray(projectRow?.pages)
    ? (structuredClone(projectRow.pages) as SitePage[])
    : structuredClone(demoSitePages);
  const requestedTemplateId =
    typeof payload.templatePageId === "string"
      ? payload.templatePageId
      : "";
  const source =
    pages.find(
      (page) =>
        page.id === requestedTemplateId &&
        page.slug.startsWith("/prestations/") &&
        page.slug !== "/prestations",
    ) ??
    pages.find(
      (page) =>
        page.slug.startsWith("/prestations/") &&
        page.slug !== "/prestations",
    ) ??
    structuredClone(demoServiceDetailPages[0]);
  if (!source)
    return NextResponse.json(
      { error: "Aucun modèle de page Prestation n'est disponible." },
      { status: 400 },
    );

  try {
    const template = getServiceTemplate(source);
    const copy = await generateServicePageCopy({
      serviceName: payload.serviceName.trim(),
      brief: payload.brief.trim(),
      projectName,
      executionMode: payload.executionMode,
      template,
    });
    const generated = applyGeneratedCopy({ pages, source, copy });
    const { data: assetRows } = await supabase
      .from("project_assets")
      .select("public_url, original_name, title, storage_path")
      .eq("owner_id", projectOwnerId)
      .eq("project_key", projectKey)
      .order("created_at", { ascending: false });
    generated.pages = synchronizeCmsRelations(
      generated.pages,
      visibleProjectImageAssets(assetRows ?? []),
    );
    const generatedPage =
      generated.pages.find((page) => page.id === generated.page.id) ??
      generated.page;
    const values = {
      project_name: projectName,
      pages: generated.pages,
      updated_at: new Date().toISOString(),
    };
    const { error } =
      projectOwnerId === userId
        ? await supabase
            .from("site_projects")
            .upsert(
              { owner_id: userId, project_key: projectKey, ...values },
              { onConflict: "owner_id,project_key" },
            )
        : await supabase
            .from("site_projects")
            .update(values)
            .eq("owner_id", projectOwnerId)
            .eq("project_key", projectKey);
    if (error) throw new Error(error.message);

    await supabase.from("project_activity_events").insert({
      owner_id: projectOwnerId,
      project_key: projectKey,
      actor_user_id: userId,
      event_type: "page_created",
      entity_id: generated.page.id,
      entity_title: generatedPage.title,
      metadata: {
        slug: generated.href,
        pageType: "prestation",
        executionMode: payload.executionMode,
        templatePageId: source.id,
        structureLocked: true,
      },
    });

    return NextResponse.json(
      {
        page: generatedPage,
        pages: generated.pages,
        copy,
        warning:
          "La page a été ajoutée au CMS en brouillon. Sa structure, ses composants, ses styles, ses liens techniques et ses images n'ont pas été modifiés.",
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "La génération de la prestation a échoué.";
    console.error("[ai-pages/prestation] Generation failure", {
      projectKey,
      projectOwnerId,
      executionMode: payload.executionMode,
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: `${message}\n\nContexte serveur :\n- type : prestation\n- structure : verrouillée\n- mode : ${String(payload.executionMode)}\n- projet : ${projectKey}`,
      },
      { status: 500 },
    );
  }
}
