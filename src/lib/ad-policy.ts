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
