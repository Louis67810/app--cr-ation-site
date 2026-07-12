export function normalizeProjectKey(value: unknown) {
  if (typeof value !== "string") return "default";

  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized)
    ? normalized
    : "default";
}
