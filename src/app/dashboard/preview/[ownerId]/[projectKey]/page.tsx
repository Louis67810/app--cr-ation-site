import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { renderSection } from "@/components/site-sections";
import { synchronizeCmsRelations } from "@/lib/cms-relations";
import { demoSitePages } from "@/lib/demo-site";
import { getSiteBrand, siteBrandStyle } from "@/lib/site-brand";
import type { SitePage } from "@/lib/site-template";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardProjectPreview({
  params,
}: {
  params: Promise<{ ownerId: string; projectKey: string }>;
}) {
  const { ownerId, projectKey } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) redirect("/login");

  const { data: project } = await supabase
    .from("site_projects")
    .select("pages")
    .eq("owner_id", ownerId)
    .eq("project_key", projectKey)
    .maybeSingle();

  const isOwnDemo = ownerId === userId && projectKey === "default";
  if (!project && !isOwnDemo) notFound();

  const sourcePages = Array.isArray(project?.pages)
    ? (project.pages as SitePage[])
    : structuredClone(demoSitePages);
  const pages = synchronizeCmsRelations(sourcePages);
  const homePage = pages.find((page) => page.slug === "/") ?? pages[0];
  if (!homePage) notFound();
  const brand = getSiteBrand(pages);

  return (
    <main
      className="min-h-screen bg-white text-[#0f1112]"
      style={siteBrandStyle(brand) as CSSProperties}
    >
      {homePage.sections.map((section) => (
        <div key={section.id}>{renderSection(section, { brand })}</div>
      ))}
    </main>
  );
}
