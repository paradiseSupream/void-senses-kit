/**
 * Viral referral engine (client-side, storage-only).
 *
 * Every visitor gets a stable anonymous referral code. Outbound share and
 * challenge links carry `?ref=<code>`; inbound visits with a foreign code are
 * counted once per session and reported through the existing `track()`
 * pipeline (no new tables, no PII).
 *
 * Abuse guards: a visitor can never be credited for their own code, and each
 * stage (visit / start / complete / share) fires at most once per session per
 * referring code.
 */

import { track } from "@/lib/monetization";

const CODE_KEY = "sov.refCode";
const INBOUND_KEY = "sov.refFrom";
const STAGE_KEY = "sov.refStages";
const CREDIT_KEY = "sov.refCredits";

export type ReferralStage = "visit" | "start" | "complete" | "share";

/** Referred completions needed before the export gate is waived for the session. */
export const REFERRAL_REWARD_TARGET = 3;

function safeGet(store: "local" | "session", key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (store === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function safeSet(store: "local" | "session", key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    (store === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    /* storage unavailable — referral is best-effort */
  }
}

/** Stable anonymous code for this visitor. Generated on first use. */
export function referralCode(): string {
  const existing = safeGet("local", CODE_KEY);
  if (existing) return existing;
  const code = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  safeSet("local", CODE_KEY, code);
  return code;
}

/** The code this visitor arrived from, if any (self-referrals are rejected). */
export function inboundReferral(): string | null {
  return safeGet("session", INBOUND_KEY);
}

function stageDone(stage: ReferralStage): boolean {
  const raw = safeGet("session", STAGE_KEY);
  return raw ? raw.split(",").includes(stage) : false;
}

function markStage(stage: ReferralStage) {
  const raw = safeGet("session", STAGE_KEY);
  const list = raw ? raw.split(",") : [];
  if (!list.includes(stage)) safeSet("session", STAGE_KEY, [...list, stage].join(","));
}

/**
 * Reports one referral funnel stage for the inbound code, once per session.
 * Silent no-op for organic visitors.
 */
export function trackReferralStage(stage: ReferralStage, toolSlug?: string | null) {
  const from = inboundReferral();
  if (!from || stageDone(stage)) return;
  markStage(stage);
  track({
    event_type: "funnel",
    slot: `ref_${stage}`,
    tool_slug: toolSlug ?? null,
    format: from,
    zone: "referral",
    click_id: from,
  });
}

/**
 * Captures `?ref=` on arrival. Called once from the root layout; safe to call
 * repeatedly. Ignores the visitor's own code (self-referral abuse) and keeps
 * the first referrer of the session (no attribution overwriting).
 */
export function captureReferral() {
  if (typeof window === "undefined") return;
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref || ref === referralCode()) return;
    if (inboundReferral()) return;
    safeSet("session", INBOUND_KEY, ref);
    trackReferralStage("visit");
  } catch {
    /* attribution must never break the page */
  }
}

/** Adds this visitor's referral code to any internal share URL. */
export function withReferral(rawUrl: string): string {
  if (typeof window === "undefined") return rawUrl;
  try {
    const url = new URL(rawUrl, window.location.origin);
    if (!url.searchParams.has("ref")) url.searchParams.set("ref", referralCode());
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/* --------------------------------------------------------------- rewards */

type Credits = { count: number; codes: string[] };

function readCredits(): Credits {
  try {
    const raw = safeGet("local", CREDIT_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Credits>) : null;
    return {
      count: typeof parsed?.count === "number" ? parsed.count : 0,
      codes: Array.isArray(parsed?.codes) ? parsed.codes : [],
    };
  } catch {
    return { count: 0, codes: [] };
  }
}

/** How many friends have finished a test from this visitor's links. */
export function referralCredits(): number {
  return readCredits().count;
}

/**
 * Credits the referrer when a friend finishes a test on this device after
 * arriving through their link. Deduplicated per referring code.
 */
export function creditReferralCompletion(toolSlug?: string | null) {
  const from = inboundReferral();
  if (!from) return;
  trackReferralStage("complete", toolSlug ?? null);
  const credits = readCredits();
  const key = `${from}:${toolSlug ?? "any"}`;
  if (credits.codes.includes(key)) return;
  safeSet(
    "local",
    CREDIT_KEY,
    JSON.stringify({ count: credits.count + 1, codes: [...credits.codes, key].slice(-50) }),
  );
}

/** True once the visitor has earned the gate-free export reward. */
export function referralRewardEarned(): boolean {
  return referralCredits() >= REFERRAL_REWARD_TARGET;
}
