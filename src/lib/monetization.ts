/**
 * Client-side monetization layer: anonymous session identity, sticky A/B
 * variant assignment, frequency capping and event tracking.
 *
 * No personal data is stored — only a random session id in sessionStorage and
 * a random visitor bucket in localStorage.
 */

const SESSION_KEY = "sov.session";
const VARIANT_KEY = "sov.adVariant";
const CAP_KEY = "sov.adCaps";
const ATTR_KEY = "sov.attr";

export type AdVariant = "result_heavy" | "gate_heavy";
export const AD_VARIANTS: AdVariant[] = ["result_heavy", "gate_heavy"];

export type AdEvent = {
  event_type:
    | "impression"
    | "click"
    | "conversion"
    | "tool_start"
    | "tool_complete"
    | "gate_shown"
    | "gate_completed"
    | "script_load"
    | "script_error"
    | "script_blocked"
    | "web_vital"
    | "consent"
    | "funnel"
    | "experiment";
  slot: string;
  tool_slug?: string | null;
  revenue_cents?: number;
  click_id?: string | null;
  format?: string | null;
  zone?: string | null;
  duration_ms?: number | null;
  metric_value?: number | null;
};

/** Set by the VIP provider so every event can be split VIP vs non-VIP. */
let vipFlag = false;
export function setVipFlag(value: boolean) {
  vipFlag = value;
}


/* ------------------------------------------------------------------ session */

function rid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = rid();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

/* ------------------------------------------------------------------ variant */

/** Sticky per-visitor bucket so RPM/CTR comparisons stay clean. */
export function adVariant(): AdVariant {
  if (typeof window === "undefined") return "result_heavy";
  try {
    const stored = window.localStorage.getItem(VARIANT_KEY);
    if (stored && (AD_VARIANTS as string[]).includes(stored)) return stored as AdVariant;
    const picked = AD_VARIANTS[Math.random() < 0.5 ? 0 : 1]!;
    window.localStorage.setItem(VARIANT_KEY, picked);
    return picked;
  } catch {
    return "result_heavy";
  }
}

/* ------------------------------------------------- copy experiment (bounce) */

const COPY_KEY = "sov.copyVariant";

/** Homepage hero copy arms — measured against bounce / test_start. */
export const COPY_VARIANTS = ["clarity", "curiosity", "speed"] as const;
export type CopyVariant = (typeof COPY_VARIANTS)[number];

/** Sticky per-visitor hero copy bucket. */
export function copyVariant(): CopyVariant {
  if (typeof window === "undefined") return "clarity";
  try {
    const stored = window.localStorage.getItem(COPY_KEY);
    if (stored && (COPY_VARIANTS as readonly string[]).includes(stored)) {
      return stored as CopyVariant;
    }
    const picked = COPY_VARIANTS[Math.floor(Math.random() * COPY_VARIANTS.length)]!;
    window.localStorage.setItem(COPY_KEY, picked);
    return picked;
  } catch {
    return "clarity";
  }
}

/** Records an experiment exposure or interaction (slot = `hero_view` etc.). */
export function trackExperiment(slot: string, arm: string) {
  track({ event_type: "experiment", slot, format: arm, zone: arm });
}

/* --------------------------------------------------------- frequency capping */

type CapState = { hour: number; counts: Record<string, number>; session: Record<string, number> };

const CAPS: Record<string, { perHour: number; perSession: number }> = {
  default: { perHour: 60, perSession: 40 },
  sticky: { perHour: 20, perSession: 12 },
  gate: { perHour: 30, perSession: 20 },
  result: { perHour: 40, perSession: 28 },
};

function capKind(slot: string) {
  if (slot.startsWith("sticky")) return "sticky";
  if (slot.startsWith("gate")) return "gate";
  if (slot.startsWith("result")) return "result";
  return "default";
}

function readCaps(): CapState {
  const hour = Math.floor(Date.now() / 3_600_000);
  const empty: CapState = { hour, counts: {}, session: {} };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(CAP_KEY);
    const parsed = raw ? (JSON.parse(raw) as CapState) : null;
    const sessionRaw = window.sessionStorage.getItem(CAP_KEY);
    const session = sessionRaw ? (JSON.parse(sessionRaw) as Record<string, number>) : {};
    if (!parsed || parsed.hour !== hour) return { hour, counts: {}, session };
    return { hour, counts: parsed.counts ?? {}, session };
  } catch {
    return empty;
  }
}

function writeCaps(state: CapState) {
  try {
    window.localStorage.setItem(
      CAP_KEY,
      JSON.stringify({ hour: state.hour, counts: state.counts }),
    );
    window.sessionStorage.setItem(CAP_KEY, JSON.stringify(state.session));
  } catch {
    /* storage unavailable */
  }
}

/** True when the slot may render right now (and consumes one impression). */
export function claimImpression(slot: string): boolean {
  if (typeof window === "undefined") return false;
  const kind = capKind(slot);
  const cap = CAPS[kind]!;
  const state = readCaps();
  const hourCount = state.counts[kind] ?? 0;
  const sessionCount = state.session[kind] ?? 0;
  if (hourCount >= cap.perHour || sessionCount >= cap.perSession) return false;
  state.counts[kind] = hourCount + 1;
  state.session[kind] = sessionCount + 1;
  writeCaps(state);
  return true;
}

/**
 * Per-format (script) frequency cap, admin-configurable. Counts are kept per
 * clock hour in localStorage and per session in sessionStorage, so the same
 * visitor never exceeds the configured number of pop-unders / vignettes /
 * push loads.
 */
export function claimFormat(
  format: "popunder" | "vignette" | "inpage_push",
  cap: { perHour: number; perSession: number },
): boolean {
  if (typeof window === "undefined") return false;
  const key = `fmt:${format}`;
  const state = readCaps();
  const hourCount = state.counts[key] ?? 0;
  const sessionCount = state.session[key] ?? 0;
  if (hourCount >= Math.max(0, cap.perHour) || sessionCount >= Math.max(0, cap.perSession)) {
    return false;
  }
  state.counts[key] = hourCount + 1;
  state.session[key] = sessionCount + 1;
  writeCaps(state);
  return true;
}

/** Current per-format usage, for debugging in the console/admin. */
export function formatUsage(): { hour: Record<string, number>; session: Record<string, number> } {
  const state = readCaps();
  return { hour: state.counts, session: state.session };
}



/** Session-based gating: skip the interstitial for the first action of a session. */
export function shouldGate(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const seen = Number(window.sessionStorage.getItem("sov.gateCount") ?? "0");
    window.sessionStorage.setItem("sov.gateCount", String(seen + 1));
    // Every free download passes through the sponsor gate — that is where the
    // smartlink revenue comes from. VIP users never reach this call.
    return true;
  } catch {
    return true;
  }
}

/* -------------------------------------------------------------- attribution */

export type Attribution = {
  utm_source?: string | undefined;
  utm_medium?: string | undefined;
  utm_campaign?: string | undefined;
  referrer?: string | undefined;
};

/** Captures first-touch UTM/referrer once per visitor. */
export function attribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const existing = window.localStorage.getItem(ATTR_KEY);
    if (existing) return JSON.parse(existing) as Attribution;
    const params = new URLSearchParams(window.location.search);
    const attr: Attribution = {
      utm_source: params.get("utm_source") ?? undefined,
      utm_medium: params.get("utm_medium") ?? undefined,
      utm_campaign: params.get("utm_campaign") ?? undefined,
      referrer: document.referrer || undefined,
    };
    window.localStorage.setItem(ATTR_KEY, JSON.stringify(attr));
    return attr;
  } catch {
    return {};
  }
}

/** Monetag smartlink (CPA). Overridable at runtime from the admin panel. */
const PARTNER_BASE = "https://omg10.com/4/11624273";
let partnerBase = PARTNER_BASE;

export function setPartnerBase(url: string) {
  if (url && /^https?:\/\//.test(url)) partnerBase = url;
}

/** Builds a partner smartlink with a unique click id for attribution. */
export function partnerLink(slot: string, toolSlug?: string | null) {
  const clickId = `${sessionId()}-${rid().slice(0, 6)}`;
  const url = new URL(partnerBase);
  url.searchParams.set("utm_source", "sensesofvoid");
  url.searchParams.set("utm_medium", slot);
  url.searchParams.set("utm_campaign", toolSlug ?? "site");
  url.searchParams.set("subid", clickId);
  url.searchParams.set("variant", adVariant());
  // Monetag smartlink passes `var` through to reporting.
  url.searchParams.set("var", `${slot}:${toolSlug ?? "site"}`);
  return { url: url.toString(), clickId };
}

/* ------------------------------------------------------------------ tracking */

let queue: Array<Record<string, unknown>> = [];
let flushTimer: number | null = null;

/** VIP flag for reporting; read from storage so tracking stays hook-free. */
function isVipVisitor(): boolean {
  try {
    return window.localStorage.getItem("sov.vip") === "1";
  } catch {
    return false;
  }
}

function payload(event: AdEvent) {
  const attr = attribution();
  return {
    event_type: event.event_type,
    slot: event.slot,
    variant: adVariant(),
    session_id: sessionId(),
    tool_slug: event.tool_slug ?? null,
    revenue_cents: event.revenue_cents ?? 0,
    click_id: event.click_id ?? null,
    utm_source: attr.utm_source ?? null,
    utm_medium: attr.utm_medium ?? null,
    utm_campaign: attr.utm_campaign ?? null,
    referrer: attr.referrer ?? null,
    device: window.matchMedia("(max-width: 640px)").matches ? "mobile" : "desktop",
    path: window.location.pathname,
    format: event.format ?? null,
    zone: event.zone ?? null,
    duration_ms: event.duration_ms ?? null,
    metric_value: event.metric_value ?? null,
    is_vip: vipFlag || isVipVisitor(),
  };
}


function flush(sync = false) {
  if (typeof window === "undefined" || queue.length === 0) return;
  const body = JSON.stringify({ events: queue });
  queue = [];
  if (flushTimer) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  try {
    if (sync && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/public/track", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/public/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* tracking must never break the UI */
  }
}

export function track(event: AdEvent) {
  if (typeof window === "undefined") return;
  try {
    queue.push(payload(event));
  } catch {
    return;
  }
  if (queue.length >= 8) {
    flush();
    return;
  }
  if (!flushTimer) flushTimer = window.setTimeout(() => flush(), 2500);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => flush(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}
