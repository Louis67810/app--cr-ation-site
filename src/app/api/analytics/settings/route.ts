import { NextResponse } from "next/server";
import { normalizeProjectKey } from "@/lib/project-key";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const payload = await request.json() as {
    projectKey?: unknown;
    projectOwnerId?: unknown;
    gaPropertyId?: unknown;
    gaMeasurementId?: unknown;
    gscSiteUrl?: unknown;
  };
  const projectKey = normalizeProjectKey(payload.projectKey);
  const projectOwnerId = typeof payload.projectOwnerId === "string" ? payload.projectOwnerId : userId;
  if (projectOwnerId !== userId) return NextResponse.json({ error: "Seul le propriétaire peut modifier cette connexion." }, { status: 403 });

  const gaPropertyId = typeof payload.gaPropertyId === "string" ? payload.gaPropertyId.trim().replace(/^properties\//, "") : "";
  const gaMeasurementId = typeof payload.gaMeasurementId === "string" ? payload.gaMeasurementId.trim().toUpperCase() : "";
  const gscSiteUrl = typeof payload.gscSiteUrl === "string" ? payload.gscSiteUrl.trim() : "";
  if (gaPropertyId && !/^\d+$/.test(gaPropertyId)) return NextResponse.json({ error: "L’identifiant de propriété GA4 doit contenir uniquement des chiffres." }, { status: 400 });
  if (gaMeasurementId && !/^G-[A-Z0-9]+$/.test(gaMeasurementId)) return NextResponse.json({ error: "L’identifiant de mesure doit commencer par G-." }, { status: 400 });
  if (gscSiteUrl && !gscSiteUrl.startsWith("https://") && !gscSiteUrl.startsWith("http://") && !gscSiteUrl.startsWith("sc-domain:")) {
    return NextResponse.json({ error: "La propriété Search Console doit être une URL ou commencer par sc-domain:." }, { status: 400 });
  }

  const connection = {
    owner_id: projectOwnerId,
    project_key: projectKey,
    ga_property_id: gaPropertyId,
    ga_measurement_id: gaMeasurementId,
    gsc_site_url: gscSiteUrl,
    updated_at: new Date().toISOString(),
  };
  const { data: previous } = await supabase.from("project_analytics_connections").select("ga_property_id, gsc_site_url").eq("owner_id", projectOwnerId).eq("project_key", projectKey).maybeSingle();
  if (previous && (previous.ga_property_id !== gaPropertyId || previous.gsc_site_url !== gscSiteUrl)) {
    await Promise.all([
      supabase.from("project_page_performance").delete().eq("owner_id", projectOwnerId).eq("project_key", projectKey),
      supabase.from("project_analytics_summary").delete().eq("owner_id", projectOwnerId).eq("project_key", projectKey),
    ]);
  }
  const { error } = await supabase.from("project_analytics_connections").upsert(connection, { onConflict: "owner_id,project_key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection });
}
