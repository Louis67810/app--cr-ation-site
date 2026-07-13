import { NextResponse } from "next/server";
import { normalizeProjectKey } from "@/lib/project-key";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function fallbackMetadata(fileName: string) {
  const cleanName = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const title = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : "Photo du projet";
  return { title: title.slice(0, 70), altText: `Photo du projet : ${title.toLowerCase()}`, aiGenerated: false };
}

async function describeImage(file: File, bytes: Buffer) {
  const fallback = fallbackMetadata(file.name);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { ...fallback, warning: "Clé OpenRouter non configurée." };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://app-cr-ation-site.vercel.app",
        "X-OpenRouter-Title": "Atelier Site Builder",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-2.5-flash",
        temperature: 0.2,
        max_tokens: 180,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Analyse cette photo destinée au site d’un paysagiste. Réponds uniquement en JSON avec title (titre naturel de 3 à 8 mots) et altText (description visuelle précise en français, 80 à 160 caractères, utile à l’accessibilité, sans commencer par ‘image de’ ou ‘photo de’). N’invente aucun élément invisible." },
            { type: "image_url", image_url: { url: `data:${file.type};base64,${bytes.toString("base64")}` } },
          ],
        }],
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = result.choices?.[0]?.message?.content?.replace(/^```json\s*|\s*```$/g, "").trim();
    if (!content) throw new Error("Réponse OpenRouter vide");
    const metadata = JSON.parse(content) as { title?: string; altText?: string };
    const title = metadata.title?.trim().slice(0, 70);
    const altText = metadata.altText?.trim().slice(0, 240);
    if (!title || !altText) throw new Error("Métadonnées OpenRouter invalides");
    return { title, altText, aiGenerated: true, warning: null };
  } catch {
    return { ...fallback, warning: "L’image a été ajoutée, mais sa description IA n’a pas pu être générée." };
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const projectKey = normalizeProjectKey(formData.get("projectKey"));
  const projectOwnerId = String(formData.get("projectOwnerId") ?? userId);

  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image invalide ou supérieure à 10 Mo." }, { status: 400 });
  }

  if (projectOwnerId !== userId) {
    const { data: membership } = await supabase.from("project_members").select("user_id").eq("owner_id", projectOwnerId).eq("project_key", projectKey).eq("user_id", userId).maybeSingle();
    if (!membership) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const metadata = await describeImage(file, bytes);
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || file.type.split("/")[1] || "jpg";
  const storagePath = `${projectOwnerId}/${projectKey}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("project-assets").upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: publicData } = supabase.storage.from("project-assets").getPublicUrl(storagePath);
  const { data: asset, error: assetError } = await supabase.from("project_assets").insert({
    owner_id: projectOwnerId,
    project_key: projectKey,
    storage_path: storagePath,
    public_url: publicData.publicUrl,
    original_name: file.name,
    title: metadata.title,
    alt_text: metadata.altText,
    ai_generated: metadata.aiGenerated,
    created_by: userId,
  }).select("id, public_url, original_name, title, alt_text, ai_generated, created_at").single();

  if (assetError) {
    await supabase.storage.from("project-assets").remove([storagePath]);
    return NextResponse.json({ error: assetError.message }, { status: 500 });
  }

  return NextResponse.json({ asset, warning: metadata.warning }, { status: 201 });
}
