/**
 * Visitor country from the CDN edge header (ISO-3166 alpha-2), or null when
 * the request did not pass through a geo-aware edge.
 */
export function countryOf(request: Request): string | null {
  const raw =
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-country-code");
  if (!raw) return null;
  const code = raw.trim().toUpperCase().slice(0, 2);
  return /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1" ? code : null;
}
