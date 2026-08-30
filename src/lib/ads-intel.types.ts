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
  /** Sessions that actually opened the payment checkout (InitiateCheckout). */
  checkoutStart: number;
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
  /** Every individual delivery attempt behind this `event_id`. */
  deliveries?: PixelDelivery[];
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

/**
 * How credit is assigned when one visitor arrives more than once inside the
 * lookback window.
 */
export type AttributionModel = "session" | "last_touch" | "first_touch";

export type AttributionRules = {
  /** Reporting window in days. */
  days: number;
  model: AttributionModel;
  /** Visitor stitching window for the first/last touch models, in days. */
  lookbackDays: number;
  /** Include sessions with no UTM tag and no click id. */
  includeOrganic: boolean;
  /** Keep only sessions carrying a platform click id (fbclid/ttclid/gclid). */
  requireClickId: boolean;
  /** Fold source/campaign/creative spellings into canonical tokens. */
  normalize: boolean;
  /** Hide rows below this session count. */
  minSessions: number;
};

export const DEFAULT_ATTRIBUTION_RULES: AttributionRules = {
  days: 30,
  model: "last_touch",
  lookbackDays: 7,
  includeOrganic: true,
  requireClickId: false,
  normalize: true,
  minSessions: 0,
};

export type AttributionReport = {
  days: number;
  rows: AttributionRow[];
  totals: FunnelCounts;
  revenueCents: number;
  /** Drop-off between consecutive funnel steps, in percent. */
  dropOff: Array<{ from: string; to: string; kept: number; lost: number; lostPct: number }>;
  /** Rules the report was built with (echoed so the UI can label the view). */
  rules?: AttributionRules;
  /** Sessions dropped by the rule filters. */
  excludedSessions?: number;
};

/** One delivery attempt behind an `event_id`, browser or server. */
export type PixelDelivery = {
  channel: string;
  source: string;
  ok: boolean;
  status: number | null;
  detail: string | null;
  at: string;
};

/**
 * Live ROI defaults measured from the last N days of real sessions. The
 * calculator seeds itself from these and marks any field the operator
 * overrides.
 */
export type RoiDefaults = {
  days: number;
  sessions: number;
  resultViews: number;
  purchases: number;
  revenueCents: number;
  /** Result views / sessions, percent. */
  quizRate: number;
  /** Purchases / result views, percent. */
  vipRate: number;
  /** Average order value in dollars. */
  aov: number;
  /** Paid-traffic revenue per 1,000 sessions, dollars. */
  rpm: number;
  /** Measured cost per acquisition is unknown without spend; null when absent. */
  paidSessions: number;
  /** True when the window has enough purchases to trust the rates. */
  confident: boolean;
};

export type CohortKey =
  | "paid_new"
  | "paid_returning"
  | "organic_new"
  | "organic_returning";

export type CohortRow = {
  key: CohortKey | string;
  label: string;
  funnel: FunnelCounts;
  revenueCents: number;
  conversionRate: number;
  /** Revenue per session, cents. */
  epcCents: number;
  /** Share of all sessions in the window, percent. */
  sharePct: number;
};

export type CohortReport = {
  days: number;
  cohorts: CohortRow[];
  /** Per-UTM-source split of new vs returning sessions. */
  sources: Array<{
    source: string;
    newSessions: number;
    returningSessions: number;
    newRevenueCents: number;
    returningRevenueCents: number;
    newConvRate: number;
    returningConvRate: number;
  }>;
  totals: FunnelCounts;
  revenueCents: number;
  /** Funnel drop-off for new vs returning visitors. */
  dropOff: Array<{
    from: string;
    to: string;
    newKeptPct: number;
    returningKeptPct: number;
  }>;
};

/** Per-country funnel and revenue used by the geo ROI / CPA planner. */
export type GeoRow = {
  /** ISO-3166 alpha-2 code, or "??" when the edge gave no country. */
  country: string;
  label: string;
  funnel: FunnelCounts;
  revenueCents: number;
  /** Purchases / sessions, percent. */
  conversionRate: number;
  /** Revenue per session, cents. */
  epcCents: number;
  /** Share of all sessions in the window, percent. */
  sharePct: number;
  /** Sessions carrying a UTM tag or click id. */
  paidSessions: number;
};

/** One creative inside one country, with its recommended budget share. */
export type GeoCreativeRow = {
  country: string;
  creative: string;
  campaign: string;
  sessions: number;
  purchases: number;
  revenueCents: number;
  convRate: number;
  /** Revenue per session, cents. */
  epcCents: number;
  winner: boolean;
  /** Performance-weighted share of the creative budget, percent. */
  budgetSharePct: number;
};

export type GeoAlert = {
  level: "warn" | "info";
  title: string;
  detail: string;
  action: string;
};

export type GeoReport = {
  days: number;
  rows: GeoRow[];
  creatives: GeoCreativeRow[];
  totals: FunnelCounts;
  revenueCents: number;
  alerts: GeoAlert[];
  winner: string | null;
};
