import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

export type RuntimeSkillName =
  | "article-research"
  | "article-structure"
  | "article-writing"
  | "image-direction"
  | "quiz-generation"
  | "service-page-writing";

const skillCache = new Map<RuntimeSkillName, string>();

export async function loadRuntimeSkill(name: RuntimeSkillName) {
  const cached = skillCache.get(name);
  if (cached) return cached;
  const filePath = path.join(
    process.cwd(),
    "src",
    "ai",
    "skills",
    name,
    "SKILL.md",
  );
  const source = await readFile(filePath, "utf8");
  const instructions = source.replace(/^---[\s\S]*?---\s*/, "").trim();
  skillCache.set(name, instructions);
  return instructions;
}
