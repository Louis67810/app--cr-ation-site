import { NextResponse } from "next/server";
import { normalizeProjectKey } from "@/lib/project-key";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const payload = await request.json() as { projectKey?: unknown; projectOwnerId?: unknown; recipientEmail?: unknown; enabled?: unknown };
  const ownerId = typeof payload.projectOwnerId === "string" ? payload.projectOwnerId : userId;
  if (ownerId !== userId) return NextResponse.json({ error: "Seul l’administrateur du projet peut configurer le récap." }, { status: 403 });
  const projectKey = normalizeProjectKey(payload.projectKey);
  const recipientEmail = typeof payload.recipientEmail === "string" ? payload.recipientEmail.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  const { error } = await supabase.from("monthly_recap_settings").upsert({ owner_id: ownerId, project_key: projectKey, recipient_email: recipientEmail, enabled: payload.enabled !== false, send_day: 1, updated_at: new Date().toISOString() }, { onConflict: "owner_id,project_key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: true });
}
