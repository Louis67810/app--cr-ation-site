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
  error?: { message?: string };
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
}) {
  if (!hasWebsite) return 100;

  const performanceGap = performance === null ? 50 : 100 - performance;
  const seoGap = seo === null ? 50 : 100 - seo;
  const securityGap = ssl === false ? 10 : 0;
  const businessQualityBonus =
    rating !== null && rating >= 4.5 && reviewCount >= 10
      ? 5
      : rating !== null && rating >= 4 && reviewCount >= 5
        ? 3
        : 0;

  return clampScore(
    performanceGap * 0.55 +
      seoGap * 0.35 +
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
  const endpoint = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
  );
  endpoint.searchParams.set("url", website);
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.append("category", "performance");
  endpoint.searchParams.append("category", "seo");

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    const payload = (await response.json()) as PageSpeedResponse;

    if (!response.ok || !payload.lighthouseResult) {
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
  } catch {
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

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims?.sub) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: { city?: unknown; sector?: unknown };
  try {
    body = (await request.json()) as { city?: unknown; sector?: unknown };
  } catch {
    return NextResponse.json(
      { error: "La demande de recherche est invalide." },
      { status: 400 },
    );
  }

  const city = normalizeText(body.city);
  const sector = normalizeText(body.sector, "Paysagistes");

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

  const placesResponse = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": placesApiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.businessStatus",
      },
      body: JSON.stringify({
        textQuery: `${sector} à ${city}`,
        languageCode: "fr",
        regionCode: "FR",
        includePureServiceAreaBusinesses: true,
        pageSize: 12,
      }),
      signal: AbortSignal.timeout(20_000),
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

  const uniquePlaces = Array.from(
    new Map(
      (placesPayload.places ?? [])
        .filter(
          (place) =>
            place.displayName?.text &&
            (!place.businessStatus || place.businessStatus === "OPERATIONAL"),
        )
        .map((place) => [place.id ?? place.displayName?.text, place]),
    ).values(),
  ).slice(0, 12);

  const prospects = await mapWithConcurrency(
    uniquePlaces,
    3,
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
    if (second.opportunity !== first.opportunity) {
      return second.opportunity - first.opportunity;
    }
    return second.reviewCount - first.reviewCount;
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
      sortedBy: "opportunity_desc",
    },
  });
}
