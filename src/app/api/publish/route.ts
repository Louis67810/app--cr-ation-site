import { NextResponse } from "next/server";
import { slugifyProjectName } from "@/lib/local-publications";
import { createClient } from "@/lib/supabase/server";
import type { SitePage } from "@/lib/site-template";
import { normalizeProjectKey } from "@/lib/project-key";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const ownerId = data?.claims?.sub;

    if (!ownerId) {
      return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
    }

    const payload = (await request.json()) as {
      projectName?: string;
      projectKey?: string;
      pages?: SitePage[];
    };

    if (
      typeof payload.projectName !== "string" ||
      payload.projectName.trim().length === 0 ||
      !Array.isArray(payload.pages) ||
      payload.pages.length === 0
    ) {
      return NextResponse.json(
        { error: "Le projet ne contient aucune page publiable." },
        { status: 400 },
      );
    }

    const publishedAt = new Date().toISOString();
    const projectKey = normalizeProjectKey(payload.projectKey);
    const publishedSlug = `${slugifyProjectName(payload.projectName)}-${ownerId.slice(0, 8)}${projectKey === "default" ? "" : `-${projectKey}`}`;
    const { error } = await supabase.from("site_projects").upsert(
      {
        owner_id: ownerId,
        project_key: projectKey,
        project_name: payload.projectName.trim(),
        pages: payload.pages,
        published_slug: publishedSlug,
        published_at: publishedAt,
        updated_at: publishedAt,
      },
      { onConflict: "owner_id,project_key" },
    );

    if (error) throw error;

    return NextResponse.json({
      url: `/published/${publishedSlug}`,
      publishedAt,
    });
  } catch {
    return NextResponse.json(
      { error: "La publication locale a echoue." },
      { status: 500 },
    );
  }
}
