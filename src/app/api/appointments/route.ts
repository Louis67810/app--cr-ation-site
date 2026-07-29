import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return {
    supabase,
    userId: data?.claims?.sub ? String(data.claims.sub) : "",
  };
}

export async function GET() {
  const { supabase, userId } = await authenticatedClient();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("prospect_appointments")
    .select(
      "id, place_id, prospect_name, attendee_name, attendee_email, attendee_phone, starts_at, time_zone, booking_uid, source_website, status, intake_snapshot, project_key, created_at",
    )
    .eq("owner_id", userId)
    .order("starts_at", { ascending: true });

  const { data: fallback, error: fallbackError } = await supabase
    .from("prospect_discoveries")
    .select("id, place_id, company, website, snapshot, discovered_at")
    .eq("owner_id", userId)
    .eq("status", "Rendez-vous")
    .order("discovered_at", { ascending: false });

  if (error && fallbackError) {
    return NextResponse.json(
      { error: "Les rendez-vous n’ont pas pu être chargés." },
      { status: 500 },
    );
  }

  const prospectByPlaceId = new Map(
    (fallback ?? []).map((row) => [row.place_id, row]),
  );
  const localAppointments = error ? [] : (data ?? []);
  const localByBookingUid = new Map(
    localAppointments
      .filter((appointment) => appointment.booking_uid)
      .map((appointment) => [appointment.booking_uid, appointment]),
  );
  const appointments = [...localAppointments] as Array<Record<string, unknown>>;
  const apiKey = process.env.CALCOM_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        "https://api.cal.com/v2/bookings?status=upcoming&limit=100&sortStart=asc",
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "cal-api-version": "2026-05-01",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        },
      );
      const payload = (await response.json()) as {
        data?: Array<{
          uid?: string;
          title?: string;
          status?: string;
          start?: string;
          attendees?: Array<{
            name?: string;
            email?: string;
            phoneNumber?: string;
            timeZone?: string;
          }>;
          metadata?: Record<string, unknown>;
        }>;
      };
      if (response.ok) {
        for (const booking of payload.data ?? []) {
          const uid = booking.uid?.trim() ?? "";
          if (!uid || localByBookingUid.has(uid)) continue;
          const attendee = booking.attendees?.[0];
          const placeId =
            typeof booking.metadata?.prospectPlaceId === "string"
              ? booking.metadata.prospectPlaceId
              : `cal-${uid}`;
          const prospect = prospectByPlaceId.get(placeId);
          const snapshot =
            prospect?.snapshot && typeof prospect.snapshot === "object"
              ? (prospect.snapshot as Record<string, unknown>)
              : {};
          const remoteAppointment = {
            id: crypto.randomUUID(),
            place_id: placeId,
            prospect_name:
              prospect?.company || attendee?.name || booking.title || "Rendez-vous",
            attendee_name: attendee?.name ?? "",
            attendee_email: attendee?.email ?? "",
            attendee_phone: attendee?.phoneNumber ?? "",
            starts_at: booking.start ?? new Date().toISOString(),
            time_zone: attendee?.timeZone ?? "Europe/Paris",
            booking_uid: uid,
            source_website:
              prospect?.website ||
              (typeof snapshot.website === "string" ? snapshot.website : null),
            status: booking.status ?? "scheduled",
            intake_snapshot: {},
            project_key: null,
            created_at: new Date().toISOString(),
          };
          appointments.push(remoteAppointment);
          if (!error) {
            const { data: inserted } = await supabase
              .from("prospect_appointments")
              .insert({ ...remoteAppointment, owner_id: userId })
              .select("id")
              .maybeSingle();
            if (inserted?.id) remoteAppointment.id = inserted.id;
          }
        }
      }
    } catch {
      // Local appointments remain usable if Cal.com is temporarily unavailable.
    }
  }

  const knownPlaceIds = new Set(
    appointments.map((appointment) => String(appointment.place_id ?? "")),
  );
  for (const row of fallback ?? []) {
    if (knownPlaceIds.has(row.place_id)) continue;
    const snapshot =
      row.snapshot && typeof row.snapshot === "object"
        ? (row.snapshot as Record<string, unknown>)
        : {};
    appointments.push({
      id: row.id,
      place_id: row.place_id,
      prospect_name: row.company,
      attendee_name: row.company,
      attendee_email:
        typeof snapshot.email === "string" ? snapshot.email : "",
      attendee_phone:
        typeof snapshot.phone === "string" ? snapshot.phone : "",
      starts_at: row.discovered_at,
      time_zone: "Europe/Paris",
      booking_uid: null,
      source_website: row.website,
      status: "scheduled",
      intake_snapshot: {},
      project_key: null,
      created_at: row.discovered_at,
    });
  }

  appointments.sort(
    (first, second) =>
      Date.parse(String(first.starts_at)) - Date.parse(String(second.starts_at)),
  );

  return NextResponse.json({
    appointments,
    migrationRequired: Boolean(error),
  });
}

export async function PATCH(request: Request) {
  const { supabase, userId } = await authenticatedClient();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const body = (await request.json()) as {
    id?: unknown;
    status?: unknown;
    intakeSnapshot?: unknown;
  };
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "Rendez-vous invalide." }, { status: 400 });
  }
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.status === "string") updates.status = body.status;
  if (body.intakeSnapshot && typeof body.intakeSnapshot === "object") {
    updates.intake_snapshot = body.intakeSnapshot;
  }
  const { error } = await supabase
    .from("prospect_appointments")
    .update(updates)
    .eq("owner_id", userId)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
