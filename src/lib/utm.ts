/**
 * UTM normalization shared by ingestion and the attribution reports.
 *
 * Ad platforms hand us the same source under many spellings (`FB`, `fb`,
 * `facebook.com`, `Facebook Ads`, `ig`), which fragments every report. Every
 * value is folded to one canonical, lower-case token before it is grouped.
 *
 * Pure module: no server imports, safe on both sides.
 */

/** Canonical platform buckets we report on. */
export const CANONICAL_SOURCES = [
  "facebook",
  "instagram",
  "tiktok",
  "google",
  "youtube",
  "snapchat",
  "reddit",
  "twitter",
  "pinterest",
  "bing",
  "email",
  "direct",
  "organic",
] as const;

const SOURCE_ALIASES: Record<string, string> = {
  fb: "facebook",
  "fb.com": "facebook",
  facebookads: "facebook",
  "facebook ads": "facebook",
  "facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "l.facebook.com": "facebook",
  meta: "facebook",
  ig: "instagram",
  insta: "instagram",
  "instagram.com": "instagram",
  "l.instagram.com": "instagram",
  tt: "tiktok",
  "tiktok.com": "tiktok",
  tiktokads: "tiktok",
  "tiktok ads": "tiktok",
  adwords: "google",
  googleads: "google",
  "google ads": "google",
  "google.com": "google",
  gads: "google",
  gdn: "google",
  yt: "youtube",
  "youtube.com": "youtube",
  "m.youtube.com": "youtube",
  x: "twitter",
  "t.co": "twitter",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "reddit.com": "reddit",
  "pinterest.com": "pinterest",
  "bing.com": "bing",
  snap: "snapchat",
  "snapchat.com": "snapchat",
  newsletter: "email",
  mail: "email",
  "(direct)": "direct",
  "(none)": "direct",
  none: "direct",
};

/** Lower-cases, trims and strips tracking noise from any UTM-ish value. */
export function normalizeUtmValue(raw: string | null | undefined, fallback = ""): string {
  if (typeof raw !== "string") return fallback;
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/^\s*['"]|['"]\s*$/g, "")
    // Unreplaced ad-platform macros ({{campaign.name}}, {campaignid}) are noise.
    .replace(/\{\{?[^}]*\}?\}/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : fallback;
}

/** Folds a raw utm_source / referrer host into a canonical platform token. */
export function normalizeSource(raw: string | null | undefined, fallback = "direct"): string {
  const base = (raw ?? "").trim().toLowerCase().replace(/^www\./, "");
  if (!base) return fallback;
  const alias = SOURCE_ALIASES[base];
  if (alias) return alias;
  const value = normalizeUtmValue(base, fallback);
  return SOURCE_ALIASES[value] ?? value;
}

/** Canonical platform implied by a click id parameter name or value. */
export function platformFromClickId(param: string | null | undefined): string | null {
  const key = (param ?? "").trim().toLowerCase();
  if (!key) return null;
  if (key.startsWith("fbclid")) return "facebook";
  if (key.startsWith("ttclid")) return "tiktok";
  if (key.startsWith("gclid") || key.startsWith("wbraid") || key.startsWith("gbraid"))
    return "google";
  if (key.startsWith("msclkid")) return "bing";
  if (key.startsWith("twclid")) return "twitter";
  if (key.startsWith("sccid")) return "snapchat";
  return null;
}
