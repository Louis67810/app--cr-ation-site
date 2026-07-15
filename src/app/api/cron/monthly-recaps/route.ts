import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function recapEmailHtml(input: { projectName: string; periodLabel: string; pages: number; articles: number; realisations: number; publications: number; visitors: number; pageViews: number; activity: Array<{ entity_title: string; event_type: string }> }) {
  const items = input.activity.length ? input.activity.slice(0, 12).map((event) => `<li style="padding:8px 0;border-bottom:1px solid #eeeeee;color:#444444">${escapeHtml(event.entity_title)} <span style="color:#999999">— ${escapeHtml(event.event_type.replaceAll("_", " "))}</span></li>`).join("") : "<li style=\"color:#999999\">Aucune nouvelle création enregistrée.</li>";
  return `<!doctype html><html><body style="margin:0;background:#f4f4f2;font-family:Arial,sans-serif;color:#1c1c1c"><div style="max-width:640px;margin:0 auto;padding:36px 18px"><div style="background:white;border:1px solid #e8e8e8;border-radius:16px;padding:30px"><p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888888;margin:0">Récap mensuel · ${escapeHtml(input.periodLabel)}</p><h1 style="font-family:Georgia,serif;font-size:30px;font-weight:400;margin:12px 0 8px">${escapeHtml(input.projectName)}</h1><p style="font-size:14px;line-height:1.6;color:#666666;margin:0 0 26px">Voici tout ce qui s’est passé sur votre site pendant le mois.</p><table role="presentation" style="width:100%;border-collapse:separate;border-spacing:8px"><tr><td style="background:#f7f7f6;border-radius:10px;padding:16px"><b style="font-size:24px">${input.pages}</b><br><span style="font-size:11px;color:#777777">Pages créées</span></td><td style="background:#f7f7f6;border-radius:10px;padding:16px"><b style="font-size:24px">${input.articles}</b><br><span style="font-size:11px;color:#777777">Articles</span></td></tr><tr><td style="background:#f7f7f6;border-radius:10px;padding:16px"><b style="font-size:24px">${input.realisations}</b><br><span style="font-size:11px;color:#777777">Réalisations</span></td><td style="background:#f7f7f6;border-radius:10px;padding:16px"><b style="font-size:24px">${input.visitors}</b><br><span style="font-size:11px;color:#777777">Visiteurs</span></td></tr></table><p style="font-size:12px;color:#777777;margin:18px 8px">${input.pageViews} vues de pages · ${input.publications} publication(s)</p><h2 style="font-family:Georgia,serif;font-size:20px;font-weight:400;margin:28px 0 8px">Activité</h2><ul style="list-style:none;margin:0;padding:0;font-size:12px">${items}</ul></div></div></body></html>`;
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!supabaseUrl || !serviceKey || !resendKey) return NextResponse.json({ error: "Variables serveur manquantes." }, { status: 500 });
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date();
  const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const periodStart = previousStart.toISOString().slice(0, 10);
  const currentStartIso = currentStart.toISOString();
  const previousStartIso = previousStart.toISOString();
  const dayOfMonth = now.getUTCDate();
  const { data: settings, error: settingsError } = await supabase.from("monthly_recap_settings").select("owner_id, project_key, recipient_email, send_day").eq("enabled", true).lte("send_day", dayOfMonth);
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 });
  let sent = 0;
  let failed = 0;

  for (const setting of settings ?? []) {
    const { data: existing } = await supabase.from("monthly_recap_deliveries").select("id, status").eq("owner_id", setting.owner_id).eq("project_key", setting.project_key).eq("period_start", periodStart).maybeSingle();
    if (existing?.status === "sent" || existing?.status === "processing") continue;
    let deliveryId = existing?.id as string | undefined;
    if (deliveryId) await supabase.from("monthly_recap_deliveries").update({ status: "processing", error_message: null }).eq("id", deliveryId);
    else {
      const { data: created, error } = await supabase.from("monthly_recap_deliveries").insert({ owner_id: setting.owner_id, project_key: setting.project_key, period_start: periodStart, recipient_email: setting.recipient_email, status: "processing" }).select("id").single();
      if (error || !created) continue;
      deliveryId = created.id;
    }
    if (!deliveryId) continue;
    try {
      const [{ data: project }, { data: events }, { data: traffic }] = await Promise.all([
        supabase.from("site_projects").select("project_name").eq("owner_id", setting.owner_id).eq("project_key", setting.project_key).maybeSingle(),
        supabase.from("project_activity_events").select("event_type, entity_title").eq("owner_id", setting.owner_id).eq("project_key", setting.project_key).gte("created_at", previousStartIso).lt("created_at", currentStartIso).order("created_at", { ascending: false }),
        supabase.from("project_traffic_daily").select("visitors, page_views").eq("owner_id", setting.owner_id).eq("project_key", setting.project_key).gte("day", periodStart).lt("day", currentStartIso.slice(0, 10)),
      ]);
      const activity = (events ?? []) as Array<{ event_type: string; entity_title: string }>;
      const totals = { pages: activity.filter((event) => event.event_type === "page_created").length, articles: activity.filter((event) => event.event_type === "article_created").length, realisations: activity.filter((event) => event.event_type === "realisation_created").length, publications: activity.filter((event) => event.event_type === "project_published").length, visitors: (traffic ?? []).reduce((sum, row) => sum + Number(row.visitors ?? 0), 0), pageViews: (traffic ?? []).reduce((sum, row) => sum + Number(row.page_views ?? 0), 0) };
      const projectName = project?.project_name ?? "Votre site";
      const periodLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(previousStart);
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": `monthly-recap-${setting.owner_id}-${setting.project_key}-${periodStart}` }, body: JSON.stringify({ from: process.env.RECAP_FROM_EMAIL ?? "Atelier <onboarding@resend.dev>", to: [setting.recipient_email], subject: `Récap ${periodLabel} — ${projectName}`, html: recapEmailHtml({ projectName, periodLabel, ...totals, activity }) }) });
      const result = await response.json() as { id?: string; message?: string };
      if (!response.ok) throw new Error(result.message ?? `Resend ${response.status}`);
      await supabase.from("monthly_recap_deliveries").update({ status: "sent", provider_message_id: result.id ?? null, error_message: null }).eq("id", deliveryId);
      sent += 1;
    } catch (error) {
      await supabase.from("monthly_recap_deliveries").update({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "Erreur inconnue" }).eq("id", deliveryId);
      failed += 1;
    }
  }
  return NextResponse.json({ checked: settings?.length ?? 0, sent, failed, periodStart });
}
