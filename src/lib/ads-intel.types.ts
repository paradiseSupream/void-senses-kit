/**
 * Shared types for the paid-ads intelligence surfaces (creative A/B testing,
 * pixel debugging, retargeting audiences and the attribution report).
 *
 * Kept free of server imports so both the admin UI and the server functions
 * can use them.
 */

/** One funnel stage of a session, from landing to Purchase. */
export type FunnelCounts = {
  sessions: number;
  testStart: number;
  resultView: number;
  gateShown: number;
  purchase: number;
};

export type CreativeRow = {
  /** `utm_content` value (the ad creative id) or "unattributed". */
  creative: string;
  campaign: string;
  source: string;
  platform: string;
  funnel: FunnelCounts;
  /** VIP purchases / sessions, in percent. */
  vipConvRate: number;
  revenueCents: number;
  /** Revenue per 1,000 sessions, in cents. */
  rpmCents: number;
  /** True for the creative with the highest VIP conversion (min sample met). */
  winner: boolean;
};

export type CreativeReport = {
  days: number;
  rows: CreativeRow[];
  totals: FunnelCounts;
  /** Winning creative id, when enough data exists to call one. */
  winner: string | null;
  minSample: number;
};

export type PixelEventPair = {
  eventId: string;
  event: string;
  at: string;
  browser: string[];
  server: string[];
  failed: string[];
  /** Both a browser fire and a server delivery exist → Meta will de-duplicate. */
  deduplicated: boolean;
};

export type PixelDebugReport = {
  pairs: PixelEventPair[];
  summary: {
    total: number;
    purchases: number;
    deduplicated: number;
    browserOnly: number;
    serverOnly: number;
    failures: number;
  };
  channels: Array<{ channel: string; ok: number; failed: number }>;
};

export type RetargetSegment = {
  key: "quiz_completers" | "checkout_abandoners" | "result_viewers" | "purchasers";
  label: string;
  description: string;
  sessions: number;
  /** Sessions that carry a platform click id (usable for Meta/TikTok upload). */
  withClickId: number;
  revenueCents: number;
};

export type RetargetReport = {
  days: number;
  segments: RetargetSegment[];
  monthlyOfferEnabled: boolean;
};

export type AttributionRow = {
  source: string;
  campaign: string;
  creative: string;
  platform: string;
  funnel: FunnelCounts;
  revenueCents: number;
  /** Percent of sessions that reached Purchase. */
  conversionRate: number;
  /** Revenue per session, in cents. */
  epcCents: number;
};

export type AttributionReport = {
  days: number;
  rows: AttributionRow[];
  totals: FunnelCounts;
  revenueCents: number;
  /** Drop-off between consecutive funnel steps, in percent. */
  dropOff: Array<{ from: string; to: string; kept: number; lost: number; lostPct: number }>;
};
