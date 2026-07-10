import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SitePage } from "@/lib/site-template";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const ownerId = data?.claims?.sub;

  if (!ownerId) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    projectName?: string;
    pages?: SitePage[];
  };

  if (!payload.projectName || !Array.isArray(payload.pages)) {
    return NextResponse.json({ error: "Brouillon invalide." }, { status: 400 });
  }

  const { error } = await supabase.from("site_projects").upsert(
    {
      owner_id: ownerId,
      project_key: "default",
      project_name: payload.projectName,
      pages: payload.pages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,project_key" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
