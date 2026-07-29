import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub ? String(authData.claims.sub) : "";
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const placeId = clean(body.placeId);
  const attendeeName = clean(body.attendeeName);
  const attendeeEmail = clean(body.attendeeEmail);
  const attendeePhone = clean(body.attendeePhone);
  const start = clean(body.start);
  const timeZone = clean(body.timeZone) || "Europe/Paris";
  const apiKey = process.env.CALCOM_API_KEY;
  const eventTypeId = Number(process.env.CALCOM_EVENT_TYPE_ID);

  if (!apiKey || !Number.isInteger(eventTypeId) || eventTypeId <= 0) {
    return NextResponse.json(
      {
        error:
          "Cal.com n’est pas configuré. Ajoutez CALCOM_API_KEY et CALCOM_EVENT_TYPE_ID dans Vercel.",
      },
      { status: 503 },
    );
  }
  if (!placeId || !attendeeName || !attendeeEmail || !start) {
    return NextResponse.json(
      { error: "Le nom, l’e-mail et le créneau sont obligatoires." },
      { status: 400 },
    );
  }

  const selectedStart = new Date(start);
  if (
    Number.isNaN(selectedStart.getTime()) ||
    selectedStart.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "Choisissez un créneau futur valide." },
      { status: 400 },
    );
  }

  const response = await fetch("https://api.cal.com/v2/bookings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "cal-api-version": "2026-02-25",
    },
    body: JSON.stringify({
      start: selectedStart.toISOString(),
      eventTypeId,
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        timeZone,
        language: "fr",
        ...(attendeePhone ? { phoneNumber: attendeePhone } : {}),
      },
      metadata: {
        source: "prospection",
        prospectPlaceId: placeId,
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const responseText = await response.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    // A readable API error is returned below.
  }

  if (!response.ok) {
    const error =
      typeof payload.error === "object" && payload.error
        ? JSON.stringify(payload.error)
        : responseText.slice(0, 300);
    return NextResponse.json(
      { error: `Cal.com a refusé ce créneau. ${error}` },
      { status: response.status },
    );
  }

  await supabase
    .from("prospect_discoveries")
    .update({ status: "Rendez-vous" })
    .eq("owner_id", userId)
    .eq("place_id", placeId);

  const bookingData =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : payload;
  const bookingUid =
    clean(bookingData.uid) ||
    clean(bookingData.id) ||
    clean(bookingData.bookingUid);
  const sourceWebsite = clean(body.sourceWebsite);
  const { error: appointmentError } = await supabase
    .from("prospect_appointments")
    .insert({
      owner_id: userId,
      place_id: placeId,
      prospect_name: clean(body.prospectName) || attendeeName,
      attendee_name: attendeeName,
      attendee_email: attendeeEmail,
      attendee_phone: attendeePhone,
      starts_at: selectedStart.toISOString(),
      time_zone: timeZone,
      booking_uid: bookingUid || null,
      source_website: sourceWebsite || null,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    });

  return NextResponse.json({
    ok: true,
    message: "Le rendez-vous est créé et l’invitation a été envoyée.",
    booking: payload.data ?? payload,
    warning: appointmentError
      ? "Le rendez-vous Cal.com est créé, mais la migration Rendez-vous doit encore être appliquée dans Supabase."
      : null,
  });
}
