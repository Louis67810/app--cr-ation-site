import { NextResponse } from "next/server";

import { demoSitePages } from "@/lib/demo-site";
import { fetchPublicWebUrl } from "@/lib/public-web-source";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type SelectedImage = {
  url: string;
  alt?: string;
  group?: string;
  pageUrl?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function projectKeyFromName(name: string) {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "projet";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function imageExtension(contentType: string, url: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
  return extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)
    ? extension
    : "jpg";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const ownerId = data?.claims?.sub ? String(data.claims.sub) : "";
  if (!ownerId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json()) as {
    appointmentId?: unknown;
    projectName?: unknown;
    sourceUrl?: unknown;
    businessProfile?: unknown;
    collectedPages?: unknown;
    selectedImages?: unknown;
  };
  const projectName = clean(body.projectName).slice(0, 80);
  if (!projectName) {
    return NextResponse.json(
      { error: "Le nom de l’entreprise est obligatoire." },
      { status: 400 },
    );
  }

  const appointmentId = clean(body.appointmentId);
  const sourceUrl = clean(body.sourceUrl);
  const businessProfile =
    body.businessProfile && typeof body.businessProfile === "object"
      ? body.businessProfile
      : {};
  const collectedPages = Array.isArray(body.collectedPages)
    ? body.collectedPages.slice(0, 30)
    : [];
  const selectedImages = Array.isArray(body.selectedImages)
    ? (body.selectedImages as SelectedImage[])
        .filter((image) => image && typeof image.url === "string")
        .slice(0, 30)
    : [];
  const projectKey = projectKeyFromName(projectName);
  const now = new Date().toISOString();

  const { error: projectError } = await supabase.from("site_projects").insert({
    owner_id: ownerId,
    project_key: projectKey,
    project_name: projectName,
    pages: structuredClone(demoSitePages),
    created_at: now,
    updated_at: now,
  });
  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  const importedAssets: Array<{ url: string; publicUrl: string }> = [];
  const importWarnings: string[] = [];
  for (const [index, image] of selectedImages.entries()) {
    try {
      const response = await fetchPublicWebUrl(image.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SiteBuilderAssetImport/1.0)",
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
      if (!contentType.startsWith("image/") || contentType.includes("svg")) {
        throw new Error("format non pris en charge");
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length || bytes.length > 10 * 1024 * 1024) {
        throw new Error("image vide ou supérieure à 10 Mo");
      }
      const extension = imageExtension(contentType, image.url);
      const storagePath = `${ownerId}/${projectKey}/source-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("project-assets")
        .upload(storagePath, bytes, {
          contentType,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage
        .from("project-assets")
        .getPublicUrl(storagePath);
      const title = `${image.group || "Image source"} ${index + 1}`;
      const { error: assetError } = await supabase.from("project_assets").insert({
        owner_id: ownerId,
        project_key: projectKey,
        storage_path: storagePath,
        public_url: publicData.publicUrl,
        original_name: `import-${index + 1}.${extension}`,
        title: title.slice(0, 100),
        alt_text: clean(image.alt).slice(0, 240) || `${projectName} — ${title.toLowerCase()}`,
        ai_generated: false,
        created_by: ownerId,
      });
      if (assetError) {
        await supabase.storage.from("project-assets").remove([storagePath]);
        throw assetError;
      }
      importedAssets.push({ url: image.url, publicUrl: publicData.publicUrl });
    } catch (error) {
      importWarnings.push(
        `${image.url}: ${error instanceof Error ? error.message : "import impossible"}`,
      );
    }
  }

  const { error: briefError } = await supabase
    .from("project_source_briefs")
    .insert({
      owner_id: ownerId,
      project_key: projectKey,
      appointment_id: appointmentId || null,
      source_url: sourceUrl || null,
      business_profile: businessProfile,
      collected_pages: collectedPages,
      selected_images: selectedImages.map((image) => ({
        ...image,
        importedUrl:
          importedAssets.find((asset) => asset.url === image.url)?.publicUrl ??
          null,
      })),
      created_at: now,
      updated_at: now,
    });

  if (appointmentId) {
    await supabase
      .from("prospect_appointments")
      .update({
        project_key: projectKey,
        status: "project_created",
        intake_snapshot: {
          sourceUrl,
          businessProfile,
          collectedPages,
          selectedImages,
        },
        updated_at: now,
      })
      .eq("owner_id", ownerId)
      .eq("id", appointmentId);
  }

  return NextResponse.json(
    {
      projectKey,
      projectName,
      importedAssets: importedAssets.length,
      warnings: [
        ...(briefError
          ? ["La migration du brief source doit être appliquée dans Supabase."]
          : []),
        ...importWarnings,
      ],
    },
    { status: 201 },
  );
}

