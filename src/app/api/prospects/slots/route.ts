import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CalSlotPayload = {
  data?: Record<
    string,
    Array<
      | string
      | {
          start?: string;
        }
    >
  >;
  error?: unknown;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims?.sub) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

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

  const start = request.nextUrl.searchParams.get("start") ?? "";
  const end = request.nextUrl.searchParams.get("end") ?? "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const maximumEnd = new Date(startDate);
  maximumEnd.setUTCDate(maximumEnd.getUTCDate() + 45);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate ||
    endDate > maximumEnd
  ) {
    return NextResponse.json(
      { error: "La période demandée est invalide." },
      { status: 400 },
    );
  }

  const endpoint = new URL("https://api.cal.com/v2/slots");
  endpoint.searchParams.set("eventTypeId", String(eventTypeId));
  endpoint.searchParams.set("start", startDate.toISOString());
  endpoint.searchParams.set("end", endDate.toISOString());
  endpoint.searchParams.set("timeZone", "Europe/Paris");

  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": "2024-09-04",
    },
    signal: AbortSignal.timeout(20_000),
  });
  const responseText = await response.text();
  let payload: CalSlotPayload = {};
  try {
    payload = JSON.parse(responseText) as CalSlotPayload;
  } catch {
    // A readable error is returned below.
  }

  if (!response.ok || !payload.data) {
    console.warn("[prospects/slots] Cal.com slots unavailable", {
      status: response.status,
      details: responseText.slice(0, 300),
    });
    return NextResponse.json(
      {
        error:
          "Cal.com n’a pas pu charger les créneaux. Vérifiez la clé et l’identifiant de l’événement.",
      },
      { status: response.status || 502 },
    );
  }

  const slots = Object.entries(payload.data)
    .flatMap(([date, entries]) =>
      entries.flatMap((entry) => {
        const startValue =
          typeof entry === "string" ? entry : entry?.start ?? "";
        return startValue ? [{ start: startValue, date }] : [];
      }),
    )
    .sort((first, second) => first.start.localeCompare(second.start));

  return NextResponse.json({ slots });
}
