/**
 * One-click UTM templates for the ad platforms we buy on.
 *
 * Each template produces a normalized, deep-linked landing URL (`?t=<slug>`
 * auto-starts the quiz) plus the platform's own dynamic macros, so the
 * attribution report can name the exact campaign / ad set / creative that
 * produced a session without any manual tagging.
 *
 * Pure module — used by the admin UI only, but safe anywhere.
 */

import { normalizeUtmValue } from "@/lib/utm";

export type AdPlatformKey = "facebook" | "tiktok" | "google";

export type UtmTemplate = {
  key: AdPlatformKey;
  label: string;
  /** Short note on where the macros come from. */
  hint: string;
  source: string;
  medium: string;
  /** Platform macro used for campaign / content when "dynamic" is on. */
  macros: { campaign: string; content: string; term: string };
  /** Click id parameter the platform appends automatically. */
  clickId: string;
};

export const UTM_TEMPLATES: UtmTemplate[] = [
  {
    key: "facebook",
    label: "Facebook / Instagram Ads",
    hint: "Uses Meta dynamic URL parameters — paste into Ads Manager › Website URL.",
    source: "facebook",
    medium: "paid-social",
    macros: {
      campaign: "{{campaign.name}}",
      content: "{{ad.name}}",
      term: "{{adset.name}}",
    },
    clickId: "fbclid",
  },
  {
    key: "tiktok",
    label: "TikTok Ads",
    hint: "Uses TikTok dynamic macros — paste into the ad's Destination URL.",
    source: "tiktok",
    medium: "paid-social",
    macros: {
      campaign: "__CAMPAIGN_NAME__",
      content: "__CID_NAME__",
      term: "__AID_NAME__",
    },
    clickId: "ttclid",
  },
  {
    key: "google",
    label: "Google Ads",
    hint: "Uses ValueTrack parameters — best set once as a tracking template.",
    source: "google",
    medium: "cpc",
    macros: {
      campaign: "{campaignid}",
      content: "{creative}",
      term: "{keyword}",
    },
    clickId: "gclid",
  },
];

export type UtmBuildInput = {
  platform: AdPlatformKey;
  /** Tool slug for the `?t=` deep link, or "" for the plain home page. */
  tool: string;
  /** Static campaign name used when dynamic macros are off. */
  campaign: string;
  /** Static creative id used when dynamic macros are off. */
  content: string;
  /** Insert the platform's own macros instead of the static values. */
  dynamic: boolean;
  /** Origin the ad points at. */
  origin: string;
};

/** Builds one ready-to-paste ad URL from a template. */
export function buildAdUrl(input: UtmBuildInput): string {
  const template = UTM_TEMPLATES.find((t) => t.key === input.platform) ?? UTM_TEMPLATES[0]!;
  const origin = (input.origin || "https://sensesofvoid.app").replace(/\/+$/, "");
  const url = new URL(`${origin}/`);
  const tool = normalizeUtmValue(input.tool, "");
  if (tool) url.searchParams.set("t", tool);

  url.searchParams.set("utm_source", template.source);
  url.searchParams.set("utm_medium", template.medium);
  url.searchParams.set(
    "utm_campaign",
    input.dynamic ? template.macros.campaign : normalizeUtmValue(input.campaign, "untitled"),
  );
  url.searchParams.set(
    "utm_content",
    input.dynamic ? template.macros.content : normalizeUtmValue(input.content, "creative-1"),
  );
  if (input.dynamic) url.searchParams.set("utm_term", template.macros.term);

  // Macros must stay literal — URL encoding breaks them on every platform.
  return decodeURIComponent(url.toString());
}

/** Preview of how the report will group a built URL after normalization. */
export function previewGrouping(input: UtmBuildInput): {
  source: string;
  campaign: string;
  content: string;
} {
  const template = UTM_TEMPLATES.find((t) => t.key === input.platform) ?? UTM_TEMPLATES[0]!;
  return {
    source: template.source,
    campaign: input.dynamic
      ? "(from platform macro)"
      : normalizeUtmValue(input.campaign, "untitled"),
    content: input.dynamic
      ? "(from platform macro)"
      : normalizeUtmValue(input.content, "creative-1"),
  };
}
