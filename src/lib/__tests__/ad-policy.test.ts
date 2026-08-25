import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  plannedAdScripts,
  smartlinkSurfacesAllowed,
  tierAdjust,
  tierCapScale,
  tierOf,
  type AdFormat,
  type PolicyInput,
} from "@/lib/ad-policy";
import { isCampaignEntry } from "@/lib/campaign-mode";
import { DEFAULT_PUBLIC_CONFIG } from "@/lib/admin-types";

const FULL: PolicyInput = {
  enabled: true,
  lean_mode: false,
  monetag_inpage_push: true,
  monetag_vignette: true,
  monetag_popunder: true,
  adsterra_social_bar: false,
  adsterra_social_bar_src: "",
};

const LEAN: PolicyInput = { ...FULL, lean_mode: true };
const CONSENTED = { isVip: false, consentAllowsAds: true } as const;

describe("ad policy", () => {
  it("loads the three Monetag formats when everything is on and consent is given", () => {
    expect(plannedAdScripts(FULL, CONSENTED)).toEqual(["inpage_push", "vignette", "popunder"]);
  });

  it("loads the Adsterra social bar only when enabled with a script URL", () => {
    const withBar: PolicyInput = {
      ...FULL,
      adsterra_social_bar: true,
      adsterra_social_bar_src: "https://example.com/bar.js",
    };
    expect(plannedAdScripts(withBar, CONSENTED)).toContain("adsterra_social_bar");
    expect(plannedAdScripts({ ...withBar, lean_mode: true }, CONSENTED)).toEqual([]);
    expect(plannedAdScripts({ ...withBar, adsterra_social_bar_src: "" }, CONSENTED)).not.toContain(
      "adsterra_social_bar",
    );
  });

  it("LEAN MODE: only Free Vault + smartlink surfaces, zero third-party scripts", () => {
    expect(plannedAdScripts(LEAN, CONSENTED)).toEqual([]);
    // First-party smartlink anchors (vault CTAs, native cards, sticky bar) stay live.
    expect(smartlinkSurfacesAllowed(LEAN, CONSENTED)).toBe(true);
  });

  it("never loads a script without consent, for VIPs, or when ads are off", () => {
    expect(plannedAdScripts(FULL, { isVip: false, consentAllowsAds: false })).toEqual([]);
    expect(plannedAdScripts(FULL, { isVip: false, consentAllowsAds: undefined })).toEqual([]);
    expect(plannedAdScripts(FULL, { isVip: true, consentAllowsAds: true })).toEqual([]);
    expect(plannedAdScripts({ ...FULL, enabled: false }, CONSENTED)).toEqual([]);
    expect(smartlinkSurfacesAllowed(FULL, { isVip: true, consentAllowsAds: true })).toBe(false);
  });

  it("CAMPAIGN SAFE: paid-social sessions load zero third-party scripts", () => {
    expect(plannedAdScripts(FULL, { ...CONSENTED, campaignSafe: true })).toEqual([]);
    expect(smartlinkSurfacesAllowed(FULL, { ...CONSENTED, campaignSafe: true })).toBe(true);
  });

  it("never interrupts an open quiz with a script format", () => {
    expect(plannedAdScripts(FULL, { ...CONSENTED, quizActive: true })).toEqual([]);
  });

  it("detects campaign entries from click ids, utm and ad-landing links", () => {
    expect(isCampaignEntry("?fbclid=abc")).toBe(true);
    expect(isCampaignEntry("?utm_source=facebook")).toBe(true);
    expect(isCampaignEntry("?utm_medium=cpc")).toBe(true);
    expect(isCampaignEntry("?t=dark-personality")).toBe(true);
    expect(isCampaignEntry("?auto=1")).toBe(true);
    expect(isCampaignEntry("", "https://www.instagram.com/")).toBe(true);
    expect(isCampaignEntry("?utm_source=newsletter", "https://google.com/")).toBe(false);
    expect(isCampaignEntry("")).toBe(false);
  });

  it("respects per-format toggles", () => {
    expect(
      plannedAdScripts({ ...FULL, monetag_vignette: false, monetag_popunder: false }, CONSENTED),
    ).toEqual(["inpage_push"]);
  });

  it("ships a public config that still carries the lean-mode switch", () => {
    expect(DEFAULT_PUBLIC_CONFIG.ads).toHaveProperty("lean_mode");
  });
});

/* ------------------------------------------------------------------ sources */

const SRC = join(process.cwd(), "src");
/** The only module allowed to inject a third-party ad script. */
const SCRIPT_INJECTOR = join(SRC, "lib", "site-config.tsx");
// Real script hosts only — setting *names* like `adsterra_social_bar` are fine.
const AD_HOSTS =
  /(al5sm\.com|n6wxm\.com|nap5k\.com|adsterra\.com|propellerads\.com|profitableratecpmnetwork\.com)/i;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(full) ? [full] : [];
  });
}

describe("no page loads an unapproved ad format", () => {
  const files = walk(SRC).filter((f) => !f.includes("__tests__"));

  it("only site-config.tsx creates <script> elements for ads", () => {
    // ga4.ts is analytics (consent-gated) and vip.checkout.tsx loads the Whop
    // payment widget — neither is an ad format, so both are allowed.
    const offenders = files.filter(
      (file) =>
        file !== SCRIPT_INJECTOR &&
        !file.endsWith("/ga4.ts") &&
        !file.endsWith(join("routes", "vip.checkout.tsx")) &&
        /createElement\(\s*["']script["']\s*\)/.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });


  it("no route or component hardcodes a third-party ad host", () => {
    const offenders = files.filter((file) => {
      // Allowed: the zone registry, server defaults and the admin control panel.
      if (file.endsWith(join("lib", "admin-types.ts"))) return false;
      if (file.endsWith(join("lib", "admin-core.server.ts"))) return false;
      if (file.endsWith(join("routes", "admin.index.tsx"))) return false;
      if (file === SCRIPT_INJECTOR) return false;
      return AD_HOSTS.test(readFileSync(file, "utf8"));
    });
    expect(offenders).toEqual([]);
  });

  it("every ad surface component is VIP-aware", () => {
    const surfaces = walk(join(SRC, "components", "monetization"));
    for (const file of surfaces) {
      const source = readFileSync(file, "utf8");
      if (!/partnerLink|AdSlot|track\(/.test(source)) continue;
      expect(source, `${file} must check useVip()`).toMatch(/useVip\(\)/);
    }
  });
});

/* ------------------------------------------------------------- geo tiering */

describe("geo tiering", () => {
  const all: AdFormat[] = ["inpage_push", "vignette", "popunder", "adsterra_social_bar"];

  it("never blocks any format by geo", () => {
    for (const c of ["US", "BR", "BD", "IN", "NG", ""]) {
      expect(tierAdjust(all, tierOf(c))).toEqual(all);
    }
  });

  it("uses uniform frequency caps worldwide", () => {
    expect(tierCapScale("tier1")).toBe(1);
    expect(tierCapScale("tier2")).toBe(1);
    expect(tierCapScale("tier3")).toBe(1);
  });
});
