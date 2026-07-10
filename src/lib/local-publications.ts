import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SitePage } from "@/lib/site-template";

export type LocalPublication = {
  slug: string;
  projectName: string;
  pages: SitePage[];
  publishedAt: string;
};

const publicationDirectory = path.join(process.cwd(), ".data");
const publicationFile = path.join(publicationDirectory, "published-sites.json");

async function readPublications(): Promise<Record<string, LocalPublication>> {
  try {
    return JSON.parse(await readFile(publicationFile, "utf8")) as Record<
      string,
      LocalPublication
    >;
  } catch {
    return {};
  }
}

export function slugifyProjectName(projectName: string) {
  return (
    projectName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "site"
  );
}

export async function saveLocalPublication(
  projectName: string,
  pages: SitePage[],
) {
  const publications = await readPublications();
  const slug = slugifyProjectName(projectName);
  const publication: LocalPublication = {
    slug,
    projectName,
    pages,
    publishedAt: new Date().toISOString(),
  };

  publications[slug] = publication;
  await mkdir(publicationDirectory, { recursive: true });
  await writeFile(publicationFile, JSON.stringify(publications, null, 2), "utf8");

  return publication;
}

export async function getLocalPublication(slug: string) {
  const publications = await readPublications();
  return publications[slug] ?? null;
}
