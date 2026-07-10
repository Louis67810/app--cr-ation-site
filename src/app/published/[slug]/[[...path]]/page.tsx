import { notFound } from "next/navigation";
import { renderSection } from "@/components/site-sections";
import { getLocalPublication } from "@/lib/local-publications";
import { createClient } from "@/lib/supabase/server";
import type { SectionInstance, SitePage } from "@/lib/site-template";

export const dynamic = "force-dynamic";

function prefixPublishedLinks<T>(value: T, prefix: string, parentKey = ""): T {
  if (typeof value === "string") {
    if (
      parentKey === "href" &&
      value.startsWith("/") &&
      !value.startsWith(prefix)
    ) {
      return `${prefix}${value === "/" ? "" : value}` as T;
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => prefixPublishedLinks(item, prefix)) as T;
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        prefixPublishedLinks(item, prefix, key),
      ]),
    ) as T;
  }

  return value;
}

export default async function PublishedSitePage({
  params,
}: {
  params: Promise<{ slug: string; path?: string[] }>;
}) {
  const { slug, path } = await params;
  const supabase = await createClient();
  const { data: remotePublication } = await supabase
    .from("site_projects")
    .select("project_name, pages, published_at")
    .eq("published_slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();
  const localPublication = remotePublication
    ? null
    : await getLocalPublication(slug);
  const publication = remotePublication
    ? {
        projectName: remotePublication.project_name,
        pages: remotePublication.pages as SitePage[],
      }
    : localPublication;

  if (!publication) notFound();

  const pageSlug = path?.length ? `/${path.join("/")}` : "/";
  const page = publication.pages.find((item) => item.slug === pageSlug);

  if (!page) notFound();

  const prefix = `/published/${slug}`;
  const sections = page.sections.map((section) =>
    prefixPublishedLinks(section, prefix),
  ) as SectionInstance[];

  return (
    <main className="min-h-screen bg-white text-[#0f1112]">
      {sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}
    </main>
  );
}
