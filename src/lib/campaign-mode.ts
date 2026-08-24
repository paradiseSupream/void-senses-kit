/**
 * Automatic "campaign safe mode".
 *
 * Goal: no manual switch. When a visit arrives from paid social (Facebook /
 * Instagram / TikTok ads) or on a direct ad landing link (`?t=` / `?auto=1`),
 * the session is marked campaign-safe for its whole lifetime: every
 * third-party ad format (pop-under, vignette, in-page push, social bar) is
 * suppressed, while first-party banners and the partner smartlink keep
 * earning. This keeps the landing page inside Meta's policy without turning
 * revenue off for organic traffic.
 *
 * Pure + storage-safe so it can be asserted in CI.
 */

const KEY = "sov.campaignSafe";

const PAID_SOURCES =
  /(facebook|fb|instagram|ig|meta|audience_network|tiktok|snapchat|pinterest|reels)/i;
const PAID_MEDIUMS = /(paid|cpc|ppc|cpm|social_paid|paidsocial)/i;
const PAID_CLICK_IDS = ["fbclid", "ttclid", "igshid", "twclid", "sclid", "gclid"] as const;
const PAID_REFERRERS = /(facebook\.com|fb\.me|instagram\.com|tiktok\.com|l\.facebook)/i;

/**
 * Decides whether this entry looks like paid-ad / ad-landing traffic.
 * `search` is a raw query string ("?fbclid=..."), `referrer` document.referrer.
 */
export function isCampaignEntry(search: string, referrer = ""): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (PAID_CLICK_IDS.some((k) => params.get(k))) return true;
  if (PAID_SOURCES.test(params.get("utm_source") ?? "")) return true;
  if (PAID_MEDIUMS.test(params.get("utm_medium") ?? "")) return true;
  // Direct ad-landing links used by our own creatives.
  if (params.get("t") || params.get("auto") === "1") return true;
  if (PAID_REFERRERS.test(referrer)) return true;
  return false;
}

/** Sticky for the whole session: once campaign-safe, always campaign-safe. */
export function markCampaignSession(search: string, referrer = ""): boolean {
  if (typeof window === "undefined") return false;
  if (isCampaignSession()) return true;
  if (!isCampaignEntry(search, referrer)) return false;
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable */
  }
  return true;
}

export function isCampaignSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
