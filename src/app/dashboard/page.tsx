import { redirect } from "next/navigation";
import { DashboardShell, type DashboardProject } from "@/components/dashboard/dashboard-shell";
import { demoSitePages } from "@/lib/demo-site";
import { normalizeProjectKey } from "@/lib/project-key";
import type { SitePage } from "@/lib/site-template";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const ownerId = authData?.claims?.sub;

  if (!ownerId) redirect("/login");

  const { data } = await supabase
    .from("site_projects")
    .select("project_key, project_name, pages, published_slug, published_at, created_at, updated_at")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  const projects: DashboardProject[] = (data ?? []).map((project) => ({
    key: project.project_key,
    name: project.project_name,
    pages: Array.isArray(project.pages) ? (project.pages as SitePage[]) : [],
    publishedSlug: project.published_slug,
    publishedAt: project.published_at,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  }));

  if (projects.length === 0) {
    projects.push({
      key: "default",
      name: "Projet paysagiste",
      pages: demoSitePages,
      publishedSlug: null,
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    });
  }

  const resolvedSearchParams = await searchParams;
  const requestedKey = normalizeProjectKey(resolvedSearchParams.project);
  const selected = projects.find((project) => project.key === requestedKey) ?? projects[0];
  const activeTab = ["overview", "traffic", "pages", "cms"].includes(resolvedSearchParams.tab ?? "")
    ? (resolvedSearchParams.tab as "overview" | "traffic" | "pages" | "cms")
    : "overview";

  return <DashboardShell projects={projects} selectedKey={selected.key} activeTab={activeTab} />;
}
