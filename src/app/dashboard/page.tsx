import { redirect } from "next/navigation";
import { DashboardShell, type DashboardInvitation, type DashboardProject, type DashboardTab } from "@/components/dashboard/dashboard-shell";
import { demoSitePages } from "@/lib/demo-site";
import { normalizeProjectKey } from "@/lib/project-key";
import type { SitePage } from "@/lib/site-template";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProjectRow = {
  owner_id: string;
  project_key: string;
  project_name: string;
  pages: unknown;
  published_slug: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function dashboardProject(project: ProjectRow, role: DashboardProject["role"]): DashboardProject {
  return {
    key: project.project_key,
    ownerId: project.owner_id,
    role,
    name: project.project_name,
    pages: Array.isArray(project.pages) ? project.pages as SitePage[] : [],
    publishedSlug: project.published_slug,
    publishedAt: project.published_at,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ project?: string; tab?: string }> }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) redirect("/login");

  const projectSelection = "owner_id, project_key, project_name, pages, published_slug, published_at, created_at, updated_at";
  const [{ data: ownedRows }, { data: memberships }] = await Promise.all([
    supabase.from("site_projects").select(projectSelection).eq("owner_id", userId).order("updated_at", { ascending: false }),
    supabase.from("project_members").select("owner_id, project_key").eq("user_id", userId),
  ]);

  const sharedRows = await Promise.all((memberships ?? []).map(async (membership) => {
    const { data } = await supabase.from("site_projects").select(projectSelection).eq("owner_id", membership.owner_id).eq("project_key", membership.project_key).maybeSingle();
    return data as ProjectRow | null;
  }));

  const projects: DashboardProject[] = [
    ...((ownedRows ?? []) as ProjectRow[]).map((project) => dashboardProject(project, "admin")),
    ...sharedRows.filter((project): project is ProjectRow => Boolean(project)).map((project) => dashboardProject(project, "collaborator")),
  ];

  const hasOwnedProjects = (ownedRows ?? []).length > 0;
  if ((hasOwnedProjects || (memberships ?? []).length === 0) && !projects.some((project) => project.key === "default" && project.ownerId === userId)) {
    projects.push({ key: "default", ownerId: userId, role: "admin", name: "Projet paysagiste", pages: demoSitePages, publishedSlug: null, publishedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDemo: true });
  }

  if (projects.length === 0) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const requestedKey = normalizeProjectKey(resolvedSearchParams.project);
  const selected = projects.find((project) => project.key === requestedKey) ?? projects[0];
  const allowedTabs: DashboardTab[] = ["overview", "traffic", "pages", "cms", "settings"];
  const requestedTab = allowedTabs.includes(resolvedSearchParams.tab as DashboardTab) ? resolvedSearchParams.tab as DashboardTab : "overview";
  const activeTab = requestedTab === "settings" && selected.role !== "admin" ? "overview" : requestedTab;

  let invitations: DashboardInvitation[] = [];
  if (selected.role === "admin") {
    const { data } = await supabase.from("project_invitations").select("id, email, token, status, accepted_user_id, created_at, accepted_at").eq("owner_id", userId).eq("project_key", selected.key).order("created_at", { ascending: false });
    invitations = (data ?? []) as DashboardInvitation[];
  }

  return <DashboardShell projects={projects} selectedKey={selected.key} activeTab={activeTab} invitations={invitations} />;
}
