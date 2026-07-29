import { NextResponse } from "next/server";

import { fetchPublicWebUrl } from "@/lib/public-web-source";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type CollectedPage = {
  url: string;
  title: string;
  type: "about" | "service" | "realisation" | "article" | "contact" | "other";
  excerpt: string;
};

type ImageCandidate = {
  id: string;
  url: string;
  pageUrl: string;
  alt: string;
  group: CollectedPage["type"];
};

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
}

function pageType(url: string, title: string): CollectedPage["type"] {
  const value = `${url} ${title}`.toLocaleLowerCase("fr");
  if (/a-propos|about|equipe|histoire|entreprise/.test(value)) return "about";
  if (/realisation|projet|portfolio|chantier|galerie/.test(value)) return "realisation";
  if (/blog|article|conseil|actualite|ressource/.test(value)) return "article";
  if (/prestation|service|amenagement|entretien|creation/.test(value)) return "service";
  if (/contact|devis|coordonnees/.test(value)) return "contact";
  return "other";
}

function pageLinks(html: string, baseUrl: URL) {
  const links = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)) {
    const raw = match[1] ?? match[2] ?? match[3] ?? "";
    try {
      const url = new URL(raw, baseUrl);
      url.hash = "";
      if (url.origin === baseUrl.origin && /^https?:$/.test(url.protocol)) links.add(url.toString());
    } catch {
      // Ignore malformed links.
    }
  }
  return [...links];
}

function pageImages(html: string, pageUrl: URL, group: CollectedPage["type"]) {
  const images: ImageCandidate[] = [];
  const candidates = [
    ...html.matchAll(/<img\b[^>]*>/gi),
    ...html.matchAll(/<meta\b[^>]*(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["'][^>]*>/gi),
  ];
  for (const [tag] of candidates) {
    const source = attribute(tag, "src") || attribute(tag, "data-src") || attribute(tag, "content");
    if (!source || source.startsWith("data:") || source.endsWith(".svg")) continue;
    try {
      const url = new URL(source, pageUrl);
      if (!/^https?:$/.test(url.protocol)) continue;
      const normalized = url.toString();
      images.push({
        id: Buffer.from(normalized).toString("base64url").slice(0, 36),
        url: normalized,
        pageUrl: pageUrl.toString(),
        alt: attribute(tag, "alt"),
        group,
      });
    } catch {
      // Ignore malformed image URLs.
    }
  }
  return images;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ? String(data.claims.sub) : "";
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json()) as {
    appointmentId?: unknown;
    website?: unknown;
  };
  const appointmentId =
    typeof body.appointmentId === "string" ? body.appointmentId : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";
  if (!website) {
    return NextResponse.json({
      scan: { sourceUrl: "", pages: [], images: [], scannedAt: new Date().toISOString() },
    });
  }

  try {
    const firstResponse = await fetchPublicWebUrl(website, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SiteBuilderContentImport/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!firstResponse.ok) throw new Error(`Le site répond avec le statut ${firstResponse.status}.`);
    const finalUrl = new URL(firstResponse.url || website);
    const firstHtml = (await firstResponse.text()).slice(0, 1_500_000);
    const queue = [finalUrl.toString(), ...pageLinks(firstHtml, finalUrl)].slice(0, 14);
    const pages: CollectedPage[] = [];
    const images = new Map<string, ImageCandidate>();

    for (let index = 0; index < queue.length; index += 1) {
      const url = queue[index];
      try {
        const html =
          index === 0
            ? firstHtml
            : (
                await (
                  await fetchPublicWebUrl(url, {
                    headers: {
                      "User-Agent": "Mozilla/5.0 (compatible; SiteBuilderContentImport/1.0)",
                      Accept: "text/html,application/xhtml+xml",
                    },
                  })
                ).text()
              ).slice(0, 1_500_000);
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const title = cleanText(titleMatch?.[1] ?? headingMatch?.[1] ?? new URL(url).pathname);
        const type = pageType(url, title);
        pages.push({
          url,
          title: title || "Page sans titre",
          type,
          excerpt: cleanText(html).slice(0, 700),
        });
        for (const image of pageImages(html, new URL(url), type)) {
          images.set(image.url, image);
        }
      } catch {
        // A single inaccessible page must not block the complete import.
      }
    }

    const scan = {
      sourceUrl: finalUrl.toString(),
      pages,
      images: [...images.values()].slice(0, 120),
      scannedAt: new Date().toISOString(),
    };

    if (appointmentId) {
      await supabase
        .from("prospect_appointments")
        .update({
          source_website: finalUrl.toString(),
          intake_snapshot: { scan },
          status: "preparing",
          updated_at: new Date().toISOString(),
        })
        .eq("owner_id", userId)
        .eq("id", appointmentId);
    }

    return NextResponse.json({ scan });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Le site n’a pas pu être analysé.",
      },
      { status: 400 },
    );
  }
}

