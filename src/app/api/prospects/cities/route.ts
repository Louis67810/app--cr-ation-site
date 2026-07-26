import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type FrenchCity = {
  nom?: string;
  code?: string;
  codesPostaux?: string[];
  population?: number;
  departement?: {
    code?: string;
    nom?: string;
  };
};

function normalizeCityKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims?.sub) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ cities: [] });
  }

  const userId = String(authData.claims.sub);
  const { data: searchRuns, error: searchRunsError } = await supabase
    .from("prospect_search_runs")
    .select("city,city_key")
    .eq("owner_id", userId)
    .limit(5000);

  if (searchRunsError) {
    console.warn("[prospects/cities] Search counters unavailable", {
      code: searchRunsError.code,
      message: searchRunsError.message,
    });
  }

  const searchCounts = new Map<string, number>();
  for (const run of searchRuns ?? []) {
    const key =
      typeof run.city_key === "string"
        ? run.city_key
        : normalizeCityKey(String(run.city ?? ""));
    searchCounts.set(key, (searchCounts.get(key) ?? 0) + 1);
  }

  const endpoint = new URL("https://geo.api.gouv.fr/communes");
  endpoint.searchParams.set("nom", query);
  endpoint.searchParams.set(
    "fields",
    "nom,code,codesPostaux,population,departement",
  );
  endpoint.searchParams.set("boost", "population");
  endpoint.searchParams.set("limit", "8");

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      throw new Error(`Geo API returned ${response.status}`);
    }

    const cities = ((await response.json()) as FrenchCity[])
      .filter((city) => city.nom)
      .map((city) => ({
        name: city.nom ?? "",
        code: city.code ?? "",
        postalCode: city.codesPostaux?.[0] ?? "",
        department: city.departement?.nom ?? "",
        departmentCode: city.departement?.code ?? "",
        population: city.population ?? null,
        searchCount: searchCounts.get(normalizeCityKey(city.nom ?? "")) ?? 0,
      }));

    return NextResponse.json({ cities });
  } catch (error) {
    console.warn("[prospects/cities] City autocomplete unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ cities: [] });
  }
}
