import { createServerFn } from "@tanstack/react-start";

/**
 * Whether the incoming request comes from a region that legally requires an
 * opt-in consent banner before advertising cookies may load. Resolved on the
 * server so the static Meta base code in <head> can grant consent and send the
 * first PageView immediately everywhere else — which is also what Meta's
 * pixel auto-detection crawler looks for.
 */
export const getBootGeo = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const { countryOf } = await import("@/lib/geo-header");
  const { CONSENT_REGIONS } = await import("@/lib/consent");

  const raw =
    getRequestHeader("cf-ipcountry") ??
    getRequestHeader("x-vercel-ip-country") ??
    getRequestHeader("x-country-code") ??
    null;
  const country = raw
    ? countryOf(new Request("https://sensesofvoid.app/", { headers: { "cf-ipcountry": raw } }))
    : null;

  // Unknown country fails safe: keep consent revoked until the client decides.
  return { country, consentRequired: country ? CONSENT_REGIONS.has(country) : true };
});
