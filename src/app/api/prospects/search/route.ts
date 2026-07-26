import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type PlacesTextSearchResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    googleMapsUri?: string;
    rating?: number;
    userRatingCount?: number;
    businessStatus?: string;
  }>;
  nextPageToken?: string;
  error?: { message?: string };
};

type PageSpeedResponse = {
  lighthouseResult?: {
    finalUrl?: string;
    categories?: {
      performance?: { score?: number };
      seo?: { score?: number };
    };
  };
  error?: { code?: number; message?: string; status?: string };
};

type PageSpeedAudit = {
  performance: number | null;
  seo: number | null;
  finalUrl: string;
  status: "complete" | "failed";
};

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeCityKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreOpportunity({
  hasWebsite,
  performance,
  seo,
  ssl,
  rating,
  reviewCount,
}: {
  hasWebsite: boolean;
  performance: number | null;
  seo: number | null;
  ssl: boolean | null;
  rating: number | null;
  reviewCount: number;
}): number | null {
  if (!hasWebsite) return 100;
  if (performance === null && seo === null) return null;

  const performanceGap = performance === null ? 0 : 100 - performance;
  const seoGap = seo === null ? 0 : 100 - seo;
  const availableWeight =
    (performance === null ? 0 : 0.55) + (seo === null ? 0 : 0.35);
  const securityGap = ssl === false ? 10 : 0;
  const businessQualityBonus =
    rating !== null && rating >= 4.5 && reviewCount >= 10
      ? 5
      : rating !== null && rating >= 4 && reviewCount >= 5
        ? 3
        : 0;

  return clampScore(
    (performanceGap * 0.55 + seoGap * 0.35) /
      Math.max(availableWeight / 0.9, 0.01) +
      securityGap +
      businessQualityBonus,
  );
}

function isHttps(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

async function auditPage(
  website: string,
  apiKey: string,
): Promise<PageSpeedAudit> {
  try {
    async function requestAudit(withApiKey: boolean) {
      const endpoint = new URL(
        "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
      );
      endpoint.searchParams.set("url", website);
      endpoint.searchParams.set("strategy", "mobile");
      endpoint.searchParams.append("category", "performance");
      endpoint.searchParams.append("category", "seo");
      if (withApiKey) endpoint.searchParams.set("key", apiKey);

      const response = await fetch(endpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(25_000),
      });
      const responseText = await response.text();
      let payload: PageSpeedResponse = {};
      try {
        payload = JSON.parse(responseText) as PageSpeedResponse;
      } catch {
        // The HTTP status and a short response excerpt are logged below.
      }
      return { response, payload, responseText };
    }

    let result = await requestAudit(true);
    if (
      !result.response.ok &&
      [400, 401, 403].includes(result.response.status)
    ) {
      console.warn("[prospects/search] PageSpeed key rejected, retrying", {
        website,
        status: result.response.status,
        message: result.payload.error?.message,
      });
      result = await requestAudit(false);
    }

    const { response, payload, responseText } = result;

    if (!response.ok || !payload.lighthouseResult) {
      console.warn("[prospects/search] PageSpeed audit failed", {
        website,
        status: response.status,
        message:
          payload.error?.message ??
          responseText.slice(0, 240) ??
          "Empty PageSpeed response",
      });
      return {
        performance: null,
        seo: null,
        finalUrl: website,
        status: "failed",
      };
    }

    const performanceScore =
      payload.lighthouseResult.categories?.performance?.score;
    const seoScore = payload.lighthouseResult.categories?.seo?.score;

    return {
      performance:
        typeof performanceScore === "number"
          ? clampScore(performanceScore * 100)
          : null,
      seo:
        typeof seoScore === "number" ? clampScore(seoScore * 100) : null,
      finalUrl: payload.lighthouseResult.finalUrl || website,
      status: "complete",
    };
  } catch (error) {
    console.warn("[prospects/search] PageSpeed audit unavailable", {
      website,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      performance: null,
      seo: null,
      finalUrl: website,
      status: "failed",
    };
  }
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
) {
  const output = new Array<R>(values.length);
  let cursor = 0;

  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(values[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, worker),
  );
  return output;
}

async function handleSearch(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims?.sub) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: {
    city?: unknown;
    sector?: unknown;
    excludedPlaceIds?: unknown;
  };
  try {
    body = (await request.json()) as {
      city?: unknown;
      sector?: unknown;
      excludedPlaceIds?: unknown;
    };
  } catch {
    return NextResponse.json(
      { error: "La demande de recherche est invalide." },
      { status: 400 },
    );
  }

  const city = normalizeText(body.city);
  const sector = normalizeText(body.sector, "Paysagistes");
  const userId = String(authData.claims.sub);
  const seenPlaceIds = new Set(
    Array.isArray(body.excludedPlaceIds)
      ? body.excludedPlaceIds
          .filter((value): value is string => typeof value === "string")
          .slice(0, 500)
      : [],
  );

  if (city.length < 2 || city.length > 80) {
    return NextResponse.json(
      { error: "Indiquez une ville valide." },
      { status: 400 },
    );
  }

  if (sector.length < 2 || sector.length > 80) {
    return NextResponse.json(
      { error: "Indiquez un secteur valide." },
      { status: 400 },
    );
  }

  const placesApiKey =
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_API_KEY;
  const pageSpeedApiKey =
    process.env.GOOGLE_PAGESPEED_API_KEY ??
    process.env.GOOGLE_PAGESPEED_INSIGHTS_API_KEY ??
    placesApiKey;

  if (!placesApiKey) {
    return NextResponse.json(
      {
        error:
          "La recherche Google Places n’est pas configurée. Ajoutez GOOGLE_PLACES_API_KEY dans les variables d’environnement Vercel.",
      },
      { status: 503 },
    );
  }

  if (!pageSpeedApiKey) {
    return NextResponse.json(
      {
        error:
          "PageSpeed n’est pas configuré. Ajoutez GOOGLE_PAGESPEED_API_KEY dans les variables d’environnement Vercel.",
      },
      { status: 503 },
    );
  }

  console.info("[prospects/search] Places search started", { city, sector });

  const { data: previousDiscoveries, error: previousDiscoveriesError } =
    await supabase
      .from("prospect_discoveries")
      .select("place_id")
      .eq("owner_id", userId)
      .limit(5000);
  const deduplicationReady = !previousDiscoveriesError;

  if (previousDiscoveriesError) {
    console.warn("[prospects/search] Prospect memory unavailable", {
      code: previousDiscoveriesError.code,
      message: previousDiscoveriesError.message,
    });
  } else {
    for (const discovery of previousDiscoveries ?? []) {
      if (typeof discovery.place_id === "string") {
        seenPlaceIds.add(discovery.place_id);
      }
    }
  }

  const uniquePlaces = new Map<
    string,
    NonNullable<PlacesTextSearchResponse["places"]>[number]
  >();
  let pageToken: string | undefined;
  let skippedPreviouslySeen = 0;

  for (let page = 0; page < 3 && uniquePlaces.size < 20; page += 1) {
    const placesResponse = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": placesApiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.businessStatus,nextPageToken",
        },
        body: JSON.stringify({
          textQuery: `${sector} à ${city}`,
          languageCode: "fr",
          regionCode: "FR",
          includePureServiceAreaBusinesses: true,
          pageSize: 20,
          ...(pageToken ? { pageToken } : {}),
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );

    const placesPayload =
      (await placesResponse.json()) as PlacesTextSearchResponse;

    if (!placesResponse.ok) {
      return NextResponse.json(
        {
          error:
            placesPayload.error?.message ??
            "Google Places n’a pas pu effectuer la recherche.",
        },
        { status: placesResponse.status },
      );
    }

    for (const place of placesPayload.places ?? []) {
      const placeKey = place.id ?? place.displayName?.text;
      if (
        !placeKey ||
        !place.displayName?.text ||
        (place.businessStatus && place.businessStatus !== "OPERATIONAL")
      ) {
        continue;
      }
      if (seenPlaceIds.has(placeKey)) {
        skippedPreviouslySeen += 1;
        continue;
      }
      uniquePlaces.set(placeKey, place);
      if (uniquePlaces.size >= 20) break;
    }

    pageToken = placesPayload.nextPageToken;
    if (!pageToken) break;
  }

  const prospects = await mapWithConcurrency(
    Array.from(uniquePlaces.values()),
    20,
    async (place, index) => {
      const website = place.websiteUri ?? "";
      const audit = website
        ? await auditPage(website, pageSpeedApiKey)
        : {
            performance: null,
            seo: null,
            finalUrl: "",
            status: "failed" as const,
          };
      const ssl = website ? isHttps(audit.finalUrl || website) : null;
      const rating =
        typeof place.rating === "number" ? place.rating : null;
      const reviewCount =
        typeof place.userRatingCount === "number"
          ? place.userRatingCount
          : 0;
      const opportunity = scoreOpportunity({
        hasWebsite: Boolean(website),
        performance: audit.performance,
        seo: audit.seo,
        ssl,
        rating,
        reviewCount,
      });

      return {
        id: place.id ?? `${city}-${index}`,
        company: place.displayName?.text ?? "Entreprise",
        activity: sector,
        city,
        address: place.formattedAddress ?? "",
        website,
        mapsUrl: place.googleMapsUri ?? "",
        contact: "",
        phone: place.nationalPhoneNumber ?? "",
        email: "",
        rating,
        reviewCount,
        performance: audit.performance,
        ssl,
        seo: audit.seo,
        opportunity,
        status: "Nouveau" as const,
        auditStatus: website
          ? audit.status
          : ("unavailable" as const),
      };
    },
  );

  prospects.sort((first, second) => {
    if (first.opportunity === null) return 1;
    if (second.opportunity === null) return -1;
    if (second.opportunity !== first.opportunity) {
      return second.opportunity - first.opportunity;
    }
    return second.reviewCount - first.reviewCount;
  });

  if (prospects.length > 0) {
    const { error: memoryWriteError } = await supabase
      .from("prospect_discoveries")
      .upsert(
        prospects.map((prospect) => ({
          owner_id: userId,
          place_id: prospect.id,
          company: prospect.company,
          city,
          sector,
          website: prospect.website || null,
          snapshot: prospect,
          status: prospect.status,
          discovered_at: new Date().toISOString(),
        })),
        { onConflict: "owner_id,place_id", ignoreDuplicates: true },
      );

    if (memoryWriteError) {
      console.warn("[prospects/search] Prospect memory write failed", {
        code: memoryWriteError.code,
        message: memoryWriteError.message,
      });
    }
  }

  const { error: searchRunError } = await supabase
    .from("prospect_search_runs")
    .insert({
      owner_id: userId,
      city,
      city_key: normalizeCityKey(city),
      sector,
      result_count: prospects.length,
    });

  if (searchRunError) {
    console.warn("[prospects/search] Search history write failed", {
      code: searchRunError.code,
      message: searchRunError.message,
    });
  }

  console.info("[prospects/search] Search completed", {
    city,
    sector,
    found: prospects.length,
    audited: prospects.filter(
      (prospect) => prospect.auditStatus === "complete",
    ).length,
    skippedPreviouslySeen,
    deduplicationReady,
  });

  return NextResponse.json({
    prospects,
    meta: {
      city,
      sector,
      found: prospects.length,
      audited: prospects.filter(
        (prospect) => prospect.auditStatus === "complete",
      ).length,
      pageSpeedFailed: prospects.filter(
        (prospect) => prospect.auditStatus === "failed",
      ).length,
      skippedPreviouslySeen,
      deduplicationReady,
      sortedBy: "opportunity_desc",
    },
  });
}

export async function POST(request: Request) {
  try {
    return await handleSearch(request);
  } catch (error) {
    console.error("[prospects/search] Search failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError" ||
        error.message.toLowerCase().includes("timeout"));

    return NextResponse.json(
      {
        error: timedOut
          ? "Google met trop de temps à répondre. Relancez la recherche dans quelques secondes."
          : "La recherche n’a pas pu être terminée. Réessayez dans quelques secondes.",
      },
      { status: timedOut ? 504 : 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub ? String(authData.claims.sub) : "";

  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const allowedStatuses = new Set([
    "Nouveau",
    "À contacter",
    "Contacté",
    "À relancer",
    "Qualifié",
    "Rendez-vous",
    "Refusé",
  ]);
  let body: { id?: unknown; status?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; status?: unknown };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  if (!id || !allowedStatuses.has(status)) {
    return NextResponse.json(
      { error: "Prospect ou statut invalide." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("prospect_discoveries")
    .update({ status })
    .eq("owner_id", userId)
    .eq("place_id", id);

  if (error) {
    return NextResponse.json(
      { error: "Le statut n’a pas été enregistré." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims?.sub) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const userId = String(authData.claims.sub);
  const { data, error } = await supabase
    .from("prospect_discoveries")
    .select("*")
    .eq("owner_id", userId)
    .order("discovered_at", { ascending: false })
    .limit(500);

  if (error) {
    console.warn("[prospects/search] Stored prospects unavailable", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json({ prospects: [] });
  }

  const prospects = (data ?? [])
    .map((row) => {
      const snapshot =
        row.snapshot &&
        typeof row.snapshot === "object" &&
        !Array.isArray(row.snapshot)
          ? row.snapshot
          : {};
      const stored = snapshot as Record<string, unknown>;

      return {
        ...stored,
        id:
          typeof stored.id === "string" ? stored.id : String(row.place_id),
        company:
          typeof stored.company === "string"
            ? stored.company
            : String(row.company),
        city:
          typeof stored.city === "string" ? stored.city : String(row.city),
        activity:
          typeof stored.activity === "string"
            ? stored.activity
            : String(row.sector),
        address:
          typeof stored.address === "string" ? stored.address : "",
        website:
          typeof stored.website === "string"
            ? stored.website
            : String(row.website ?? ""),
        mapsUrl:
          typeof stored.mapsUrl === "string" ? stored.mapsUrl : "",
        contact:
          typeof stored.contact === "string" ? stored.contact : "",
        phone: typeof stored.phone === "string" ? stored.phone : "",
        email: typeof stored.email === "string" ? stored.email : "",
        rating:
          typeof stored.rating === "number" ? stored.rating : null,
        reviewCount:
          typeof stored.reviewCount === "number" ? stored.reviewCount : 0,
        performance:
          typeof stored.performance === "number" ? stored.performance : null,
        ssl: typeof stored.ssl === "boolean" ? stored.ssl : null,
        seo: typeof stored.seo === "number" ? stored.seo : null,
        opportunity:
          typeof stored.opportunity === "number" ? stored.opportunity : null,
        status:
          typeof row.status === "string" ? row.status : "Nouveau",
        auditStatus:
          stored.auditStatus === "complete" ||
          stored.auditStatus === "failed" ||
          stored.auditStatus === "unavailable"
            ? stored.auditStatus
            : "unavailable",
      };
    })
    .sort((first, second) => {
      if (first.opportunity === null) return 1;
      if (second.opportunity === null) return -1;
      return second.opportunity - first.opportunity;
    });

  return NextResponse.json({ prospects });
}
