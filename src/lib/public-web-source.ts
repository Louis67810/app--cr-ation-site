import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
];

function isPrivateAddress(address: string) {
  if (address === "::1" || address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) {
    return true;
  }
  return PRIVATE_IPV4.some((pattern) => pattern.test(address));
}

export async function assertPublicWebUrl(value: string) {
  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(normalized);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Cette adresse de site n’est pas autorisée.");
  }
  if (
    url.hostname === "localhost" ||
    url.hostname.endsWith(".local") ||
    isIP(url.hostname) && isPrivateAddress(url.hostname)
  ) {
    throw new Error("Cette adresse de site n’est pas publique.");
  }

  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Cette adresse de site n’est pas publique.");
  }
  return url;
}

export async function fetchPublicWebUrl(
  value: string,
  init: RequestInit = {},
  redirectCount = 0,
): Promise<Response> {
  const url = await assertPublicWebUrl(value);
  const response = await fetch(url, {
    ...init,
    redirect: "manual",
    signal: init.signal ?? AbortSignal.timeout(12_000),
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirectCount >= 3) throw new Error("Le site effectue trop de redirections.");
    const location = response.headers.get("location");
    if (!location) throw new Error("La redirection du site est invalide.");
    return fetchPublicWebUrl(new URL(location, url).toString(), init, redirectCount + 1);
  }
  return response;
}

