import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return {
    supabase,
    userId: data?.claims?.sub ? String(data.claims.sub) : "",
  };
}

export async function POST(request: Request) {
  const { supabase, userId } = await authenticatedClient();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json()) as {
    placeId?: unknown;
    prospectName?: unknown;
    phone?: unknown;
    startedAt?: unknown;
  };
  const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";
  if (!placeId) {
    return NextResponse.json({ error: "Prospect invalide." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("prospect_call_sessions")
    .insert({
      owner_id: userId,
      place_id: placeId,
      prospect_name:
        typeof body.prospectName === "string" ? body.prospectName : "",
      phone: typeof body.phone === "string" ? body.phone : "",
      started_at:
        typeof body.startedAt === "string"
          ? body.startedAt
          : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[prospects/calls] Insert unavailable", error.message);
    return NextResponse.json(
      { error: "L’historique des appels n’est pas encore configuré." },
      { status: 503 },
    );
  }

  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  const { supabase, userId } = await authenticatedClient();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: unknown;
    endedAt?: unknown;
    durationSeconds?: unknown;
    answered?: unknown;
    concluded?: unknown;
  };
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Appel invalide." }, { status: 400 });
  }

  const durationSeconds =
    typeof body.durationSeconds === "number"
      ? Math.max(0, Math.round(body.durationSeconds))
      : 0;
  const { error } = await supabase
    .from("prospect_call_sessions")
    .update({
      ended_at:
        typeof body.endedAt === "string"
          ? body.endedAt
          : new Date().toISOString(),
      duration_seconds: durationSeconds,
      answered: body.answered === true,
      concluded: body.concluded === true,
    })
    .eq("id", id)
    .eq("owner_id", userId);

  if (error) {
    return NextResponse.json(
      { error: "L’appel n’a pas été enregistré." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
