/**
 * Deeplink attribution for every share surface.
 *
 * Every outbound share (image, challenge link, social button, copy) carries
 * UTM parameters plus a short share id, so inbound sessions can be traced back
 * to the exact slot, tool and network that produced them.
 */

import { track } from "@/lib/monetization";
import { referralCode } from "@/lib/referral";

export type ShareContext = {
  /** Network or surface the link was handed to: "whatsapp", "native_image"… */
  source: string;
  /** Defaults to "social_share". */
  medium?: string;
  /** Usually the tool slug or archetype slug. */
  campaign?: string;
  /** Slot-level detail: "result_actions", "share_row", "archetype_hero"… */
  content?: string;
};

const SITE = "sensesofvoid";

function shareId(): string {
  try {
    return Math.random().toString(36).slice(2, 8);
  } catch {
    return "anon00";
  }
}

/** Appends UTM + share-id parameters to any internal URL. */
export function withUtm(rawUrl: string, ctx: ShareContext): string {
  try {
    const base =
      typeof window === "undefined" ? "https://sensesofvoid.app" : window.location.origin;
    const url = new URL(rawUrl, base);
    url.searchParams.set("utm_source", ctx.source);
    url.searchParams.set("utm_medium", ctx.medium ?? "social_share");
    url.searchParams.set("utm_campaign", ctx.campaign ?? SITE);
    if (ctx.content) url.searchParams.set("utm_content", ctx.content);
    url.searchParams.set("sid", shareId());
    // Viral loop: every outbound link carries the sharer's anonymous code so
    // referral visits, starts and completions are attributable.
    if (!url.searchParams.has("ref")) url.searchParams.set("ref", referralCode());
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/** Records the outbound share so the dashboard can score each surface. */
export function trackShare(ctx: ShareContext & { toolSlug?: string | null }) {
  track({
    event_type: "click",
    slot: `share_${ctx.source}`,
    tool_slug: ctx.toolSlug ?? null,
    format: ctx.content ?? null,
    zone: ctx.campaign ?? null,
  });
}

const LANDING_KEY = "sov.shareLanding";

/**
 * Fires once per session when a visitor arrives through a share deeplink, so
 * inbound share traffic is attributable to the slot that produced the link.
 */
export function captureShareLanding() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source");
    const sid = params.get("sid");
    if (!source || !sid) return;
    if (window.sessionStorage.getItem(LANDING_KEY) === sid) return;
    window.sessionStorage.setItem(LANDING_KEY, sid);
    track({
      event_type: "click",
      slot: "share_inbound",
      tool_slug: params.get("utm_campaign"),
      format: params.get("utm_content") ?? source,
      zone: source,
      click_id: sid,
    });
  } catch {
    /* attribution must never break the page */
  }
}
