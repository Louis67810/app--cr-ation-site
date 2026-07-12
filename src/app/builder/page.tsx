import { SiteBuilderShell } from "@/components/builder/site-builder-shell";
import { demoSitePages } from "@/lib/demo-site";
import { createClient } from "@/lib/supabase/server";
import type { SitePage } from "@/lib/site-template";
import { redirect } from "next/navigation";
import { normalizeProjectKey } from "@/lib/project-key";

export const dynamic = "force-dynamic";

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const projectKey = normalizeProjectKey((await searchParams).project);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const ownerId = data?.claims?.sub;

  if (!ownerId) redirect("/login");

  const { data: project } = await supabase
    .from("site_projects")
    .select("project_name, pages")
    .eq("owner_id", ownerId)
    .eq("project_key", projectKey)
    .maybeSingle();

  const savedPages = Array.isArray(project?.pages)
    ? (project.pages as SitePage[])
    : demoSitePages;

  return (
    <SiteBuilderShell
      initialPages={savedPages}
      initialProjectName={project?.project_name ?? "Projet paysagiste"}
      projectKey={projectKey}
    />
  );
}
