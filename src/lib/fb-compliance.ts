/**
 * Facebook / Meta landing-page ad policy checker.
 *
 * Pure and dependency-free so it can run in CI and be rendered server-side.
 * It inspects the live ad settings (the same shape the ad policy engine reads)
 * and reports which surfaces are likely to get an ad set disapproved or the
 * domain flagged under Meta's "low quality or disruptive content" rules.
 */

import type { PolicyInput } from "./ad-policy";

export type Severity = "blocker" | "warn" | "pass";

export type ComplianceFinding = {
  id: string;
  severity: Severity;
  /** Short label shown in the checklist. */
  title: string;
  /** What was observed on the current landing configuration. */
  detail: string;
  /** The smallest reversible fix. */
  fix: string;
};

export type ComplianceAudit = {
  findings: ComplianceFinding[];
  blockers: number;
  warnings: number;
  /** 0-100; 100 = nothing on the page that Meta objects to. */
  score: number;
  verdict: "ready" | "risky" | "blocked";
  leanMode: boolean;
};

export type ComplianceInput = PolicyInput & {
  gateSlotEnabled?: boolean | undefined;
  stickyMobileEnabled?: boolean | undefined;
  consentRequired?: boolean | undefined;
  smartlink_url?: string | undefined;
};

function pass(id: string, title: string, detail: string): ComplianceFinding {
  return { id, severity: "pass", title, detail, fix: "No action needed." };
}

/** Evaluates the current landing configuration against Meta's ad policies. */
export function auditMetaCompliance(ads: ComplianceInput): ComplianceAudit {
  const findings: ComplianceFinding[] = [];
  const lean = ads.lean_mode === true;
  const adsLive = ads.enabled !== false;
  const thirdPartyOff = lean || !adsLive;

  findings.push(
    lean
      ? pass(
          "lean_mode",
          "Lean Mode is ON",
          "Only first-party surfaces (Free Vault + partner smartlink anchors) load. No third-party ad script is injected.",
        )
      : {
          id: "lean_mode",
          severity: "warn",
          title: "Lean Mode is OFF",
          detail:
            "Third-party ad networks are allowed to inject scripts on the page Meta reviews.",
          fix: "Turn Lean Mode ON for the duration of the Facebook campaign.",
        },
  );

  const popunder = adsLive && !lean && ads.monetag_popunder === true;
  findings.push(
    popunder
      ? {
          id: "popunder",
          severity: "blocker",
          title: "Pop-under active",
          detail:
            "A pop-under opens an unrequested window/tab. Meta treats this as disruptive content and commonly disapproves the ad or flags the domain.",
          fix: "Disable Monetag pop-under (or turn Lean Mode ON) before submitting the ad.",
        }
      : pass("popunder", "No pop-under", "No unrequested window/tab is opened on this landing."),
  );

  const vignette = adsLive && !lean && ads.monetag_vignette === true;
  findings.push(
    vignette
      ? {
          id: "vignette",
          severity: "blocker",
          title: "Vignette interstitial active",
          detail:
            "A full-screen interstitial covers the content the ad promised. This is the single most common Meta landing-page rejection reason.",
          fix: "Disable the Monetag vignette (or turn Lean Mode ON) while running Facebook traffic.",
        }
      : pass(
          "vignette",
          "No full-screen interstitial",
          "The promised content is visible immediately after the click.",
        ),
  );

  const push = adsLive && !lean && ads.monetag_inpage_push === true;
  findings.push(
    push
      ? {
          id: "inpage_push",
          severity: "warn",
          title: "In-page push notifications active",
          detail:
            "In-page push overlays mimic system notifications; reviewers often read this as misleading UI.",
          fix: "Disable in-page push for Facebook campaigns, or keep it capped and off the landing route.",
        }
      : pass("inpage_push", "No push overlays", "No notification-style overlay is injected."),
  );

  const socialBar =
    adsLive && !lean && ads.adsterra_social_bar === true && Boolean(ads.adsterra_social_bar_src);
  findings.push(
    socialBar
      ? {
          id: "social_bar",
          severity: "warn",
          title: "Adsterra Social Bar active",
          detail:
            "The sticky third-party bar can cover page content on small screens and loads an external script.",
          fix: "Disable the Social Bar for Facebook traffic; keep the first-party sticky slot instead.",
        }
      : pass("social_bar", "No third-party sticky bar", "No external sticky script is injected."),
  );

  findings.push(
    ads.gateSlotEnabled === true
      ? {
          id: "export_gate",
          severity: "warn",
          title: "Export gate interstitial enabled",
          detail:
            "The export gate is a first-party interstitial. It appears after an explicit user action, but a reviewer clicking through can still see it.",
          fix:
            "Acceptable if the first export of a session stays gate-free; otherwise disable the gate slot during the campaign.",
        }
      : pass("export_gate", "No export gate", "Downloads are not gated."),
  );

  findings.push(
    ads.consentRequired === false
      ? {
          id: "consent",
          severity: "warn",
          title: "Cookie consent banner off",
          detail: "Ad cookies can be set before the visitor consents.",
          fix: "Re-enable the consent banner — Meta requires a lawful-basis notice for EU traffic.",
        }
      : pass("consent", "Consent banner enabled", "Ad storage waits for visitor consent."),
  );

  findings.push(
    thirdPartyOff
      ? pass(
          "redirect",
          "No auto-redirect",
          "The landing URL renders your own content; smartlinks only open on a deliberate click.",
        )
      : {
          id: "redirect",
          severity: "warn",
          title: "Partner smartlink present",
          detail:
            "Smartlinks are affiliate redirects. They are fine behind a click, but never as the ad's destination URL.",
          fix:
            "Always point the Facebook ad at sensesofvoid.app/?t=<tool>, never at the smartlink itself.",
        },
  );

  const blockers = findings.filter((f) => f.severity === "blocker").length;
  const warnings = findings.filter((f) => f.severity === "warn").length;
  const score = Math.max(0, 100 - blockers * 35 - warnings * 10);

  return {
    findings,
    blockers,
    warnings,
    score,
    verdict: blockers > 0 ? "blocked" : warnings > 0 ? "risky" : "ready",
    leanMode: lean,
  };
}
