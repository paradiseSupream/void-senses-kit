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
  /**
   * Paid-social / ad-landing session (auto-detected). Third-party formats stay
   * off for the entire session so Meta review only ever sees first-party
   * banners + smartlink anchors.
   */
  campaignSafe?: boolean | undefined;
  /** The visitor is mid-quiz: never interrupt the flow with a script format. */
  quizActive?: boolean | undefined;
  /**
   * Mobile: only the two lightweight, non-blocking formats (in-page push and
   * the Adsterra social bar) may run. Vignette and pop-under stay desktop-only
   * so Core Web Vitals / organic rankings are never put at risk.
   */
  isMobile?: boolean | undefined;
};

/** Formats light enough to run on a phone without hurting page experience. */
const MOBILE_SAFE: AdFormat[] = ["inpage_push", "adsterra_social_bar"];

/**
 * The exact set of third-party script formats allowed to load right now.
 * An empty array means: nothing but vault + smartlink anchors on the page.
 */
export function plannedAdScripts(ads: PolicyInput, ctx: PolicyContext): AdFormat[] {
  if (ctx.isVip) return [];
  if (ctx.consentAllowsAds !== true) return [];
  if (!ads.enabled) return [];
  if (ads.lean_mode) return [];
  if (ctx.campaignSafe) return [];
  if (ctx.quizActive) return [];
  const planned: AdFormat[] = [];
  if (ads.monetag_inpage_push) planned.push("inpage_push");
  if (ads.monetag_vignette) planned.push("vignette");
  if (ads.monetag_popunder) planned.push("popunder");
  if (ads.adsterra_social_bar && ads.adsterra_social_bar_src) planned.push("adsterra_social_bar");
  if (ctx.isMobile) return planned.filter((format) => MOBILE_SAFE.includes(format));
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
 * No geo blocking: every market gets the full ad stack.
 * VIP + consent are the only gates (handled in plannedAdScripts).
 */
export function tierAdjust(planned: AdFormat[], _tier: Tier): AdFormat[] {
  return planned;
}

/** Frequency caps are uniform worldwide. */
export function tierCapScale(_tier: Tier): number {
  return 1;
}
