/**
 * Pure, dependency-free ad policy engine.
 *
 * Every decision about which third-party ad script may run lives here so it can
 * be asserted in CI (see src/lib/__tests__/ad-policy.test.ts) without a browser.
 *
 * Lean mode is the safety switch: when it is on, the site is only allowed to
 * serve its own first-party surfaces — the Free Drive Vault and partner
 * smartlink anchors — and every third-party ad format (pop-under, vignette,
 * in-page push) must stay off.
 */

export type AdFormat = "inpage_push" | "vignette" | "popunder" | "adsterra_social_bar";

/** Formats that are always allowed because they inject no third-party script. */
export const FIRST_PARTY_SURFACES = ["free_vault", "smartlink"] as const;

export type PolicyInput = {
  enabled: boolean;
  lean_mode?: boolean | undefined;
  monetag_inpage_push: boolean;
  monetag_vignette: boolean;
  monetag_popunder: boolean;
  adsterra_social_bar?: boolean | undefined;
  adsterra_social_bar_src?: string | undefined;
};

export type PolicyContext = {
  isVip: boolean;
  /** undefined = consent not resolved yet. */
  consentAllowsAds: boolean | undefined;
};

/**
 * The exact set of third-party script formats allowed to load right now.
 * An empty array means: nothing but vault + smartlink anchors on the page.
 */
export function plannedAdScripts(ads: PolicyInput, ctx: PolicyContext): AdFormat[] {
  if (ctx.isVip) return [];
  if (ctx.consentAllowsAds !== true) return [];
  if (!ads.enabled) return [];
  if (ads.lean_mode) return [];

  const planned: AdFormat[] = [];
  if (ads.monetag_inpage_push) planned.push("inpage_push");
  if (ads.monetag_vignette) planned.push("vignette");
  if (ads.monetag_popunder) planned.push("popunder");
  if (ads.adsterra_social_bar && ads.adsterra_social_bar_src) planned.push("adsterra_social_bar");
  return planned;
}

/** Banner / native / sticky smartlink surfaces stay available in lean mode. */
export function smartlinkSurfacesAllowed(ads: PolicyInput, ctx: PolicyContext): boolean {
  return !ctx.isVip && ads.enabled;
}

/* ------------------------------------------------------------- geo tiering */

export type Tier = "tier1" | "tier2" | "tier3";

/** High-CPM markets: full ad stack is worth the UX cost here. */
const TIER1 = new Set([
  "US", "CA", "GB", "AU", "NZ", "IE", "DE", "FR", "NL", "SE", "NO", "DK", "FI",
  "CH", "AT", "BE", "LU", "IS", "SG", "JP", "KR", "AE", "QA", "KW", "IL", "IT", "ES",
]);

/** Mid-CPM markets: keep the high earners, drop the most intrusive format. */
const TIER2 = new Set([
  "PL", "CZ", "PT", "GR", "HU", "RO", "SK", "SI", "HR", "EE", "LV", "LT", "TR",
  "MX", "BR", "AR", "CL", "CO", "ZA", "MY", "TH", "SA", "TW", "HK", "CN", "RU", "UA",
]);

export function tierOf(country: string | null | undefined): Tier {
  const code = (country ?? "").toUpperCase();
  if (TIER1.has(code)) return "tier1";
  if (TIER2.has(code)) return "tier2";
  return "tier3";
}

/**
 * Revenue-per-annoyance tuning by market.
 * - tier1: everything (highest eCPM justifies pop-under + vignette + social bar)
 * - tier2: drop the vignette interstitial
 * - tier3: cheap traffic — keep the high-fill, low-bounce formats
 *   (in-page push, Adsterra social bar, pop-under) and drop only the vignette.
 */
export function tierAdjust(planned: AdFormat[], tier: Tier): AdFormat[] {
  if (tier === "tier1") return planned;
  return planned.filter((f) => f !== "vignette");
}


/** Frequency caps scale down as CPM drops, so cheap traffic isn't burned out. */
export function tierCapScale(tier: Tier): number {
  if (tier === "tier1") return 1;
  if (tier === "tier2") return 0.75;
  return 0.5;
}
