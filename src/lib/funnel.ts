/**
 * Event-based conversion funnel.
 *
 * Steps are recorded once per session (except `return_1m` / `return_3m`, which
 * are dwell milestones) and land in `ad_events` as `funnel` events where the
 * slot column holds the step name. The admin dashboard rebuilds the funnel from
 * those rows, so no extra table is needed.
 */

import { track } from "@/lib/monetization";
import { gaEvent } from "@/lib/ga4";
import { pixelTrack, stableEventId, type PixelEvent } from "@/lib/pixels";
import { markRetarget, segmentForFunnelStep } from "@/lib/retarget";
import { VIP_MONTHLY_CENTS } from "@/lib/vip-pricing";
import { preloadWhopCheckout } from "@/lib/whop-preload";



/**
 * Which funnel steps are worth reporting to the ad networks as conversions.
 *
 * The money steps carry the real entry price. Meta cannot bid toward value on
 * a valueless AddToCart, and the Gulf campaigns optimise on exactly that event
 * while purchase volume is still too thin to learn from.
 */
const PIXEL_STEPS: Partial<Record<string, { event: PixelEvent; valueCents?: number }>> = {
  test_start: { event: "ViewContent" },
  result_view: { event: "Lead" },
  vip_gate_shown: { event: "AddToCart", valueCents: VIP_MONTHLY_CENTS },
  checkout_start: { event: "InitiateCheckout", valueCents: VIP_MONTHLY_CENTS },
};


export const FUNNEL_STEPS = [
  "visit",
  "test_start",
  "return_1m",
  "return_3m",
  "result_view",
  "vip_gate_shown",
  "checkout_start",
  "vip_downgrade",
  "vip_purchase",
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

const KEY = "sov.funnel";

function seen(): Record<string, number> {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function remember(state: Record<string, number>) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

/** Records a funnel step at most once per session. */
export function trackFunnel(
  step: FunnelStep,
  toolSlug?: string | null,
  opts?: { revenueCents?: number },
) {
  if (typeof window === "undefined") return;
  const state = seen();
  if (state[step]) return;
  state[step] = Date.now();
  remember(state);
  track({
    event_type: "funnel",
    slot: step,
    tool_slug: toolSlug ?? null,
    format: "funnel",
    duration_ms: dwellMs(),
    // Purchase revenue rides on the funnel row, so revenue-per-visitor in the
    // admin dashboard counts real VIP money, not just ad revenue.
    ...(opts?.revenueCents ? { revenue_cents: opts.revenueCents } : {}),
  });
  // Mirror the funnel into GA4 so SEO traffic can be measured end to end.
  gaEvent(`funnel_${step}`, { tool_slug: toolSlug ?? undefined, dwell_ms: dwellMs() });

  // Mirror the money steps into Meta / TikTok / Google Ads (Purchase is fired
  // on the success page where the real order value is known).
  const mapped = PIXEL_STEPS[step];
  if (mapped) {
    pixelTrack(mapped.event, {
      contentName: toolSlug ?? step,
      ...(mapped.valueCents ? { value: mapped.valueCents / 100, currency: "USD" } : {}),
      // Stable per step + session so the browser fire and the server-side
      // Conversions API delivery de-duplicate into one conversion.
      eventId: stableEventId(`funnel:${step}:${toolSlug ?? "none"}`),
    });
  }

  // The moment an offer is on screen, warm the hosted checkout so the buyer
  // never waits for its script after tapping "Unlock".
  if (step === "vip_gate_shown" || step === "checkout_start") preloadWhopCheckout();


  // Remember the furthest step so returning non-buyers can be retargeted.
  const segment = segmentForFunnelStep(step);
  if (segment) markRetarget(segment);
}

let startedAt = 0;
let timers: number[] = [];

function dwellMs(): number {
  return startedAt ? Math.round(performance.now() - startedAt) : 0;
}

/**
 * Boots the funnel: fires `visit`, then the 1-minute and 3-minute dwell
 * milestones that measure whether the "come back and take another test" loop
 * actually works.
 */
export function startFunnel() {
  if (typeof window === "undefined" || startedAt) return;
  startedAt = performance.now();
  trackFunnel("visit");
  timers = [
    window.setTimeout(() => trackFunnel("return_1m"), 60_000),
    window.setTimeout(() => trackFunnel("return_3m"), 180_000),
  ];
}

export function stopFunnel() {
  for (const t of timers) window.clearTimeout(t);
  timers = [];
}
