import "server-only";
import type { ArticleImageRequest } from "@/lib/editorial-pipeline";
import { loadRuntimeSkill } from "@/lib/ai-runtime-skills";

export type GeneratedImageBinary = {
  bytes: Buffer;
  mediaType: string;
};

export async function generateArticleImage(
  request: ArticleImageRequest,
  context: { articleTitle: string; projectName: string },
): Promise<GeneratedImageBinary | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  const skill = await loadRuntimeSkill("image-direction");
  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Atelier Site Builder — Images éditoriales",
    },
    body: JSON.stringify({
      model:
        process.env.OPENROUTER_IMAGE_MODEL ??
        "google/gemini-3.1-flash-lite-image",
      prompt: `${skill}\n\nProjet : ${context.projectName}\nArticle : ${context.articleTitle}\nRôle de l'image : ${request.purpose}\nInstruction spécifique : ${request.prompt}\nTexte alternatif attendu : ${request.alt}\n\nGénère une seule image. Aucun texte, logo, slogan, filigrane ou interface dans l'image.`,
      aspect_ratio: request.aspectRatio,
      output_format: "webp",
    }),
  });
  if (!response.ok) return null;
  const result = (await response.json()) as {
    data?: Array<{ b64_json?: string; media_type?: string }>;
  };
  const image = result.data?.find((item) => item.b64_json);
  if (!image?.b64_json) return null;
  return {
    bytes: Buffer.from(image.b64_json, "base64"),
    mediaType: image.media_type ?? "image/webp",
  };
}
