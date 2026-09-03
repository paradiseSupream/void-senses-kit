/**
 * Vault loop state (client only).
 *
 * The vault's economics are pages-per-visit × unlocks-per-visit: one acquired
 * visitor should see several packs, not one. We remember which packs a visitor
 * already opened so return visits surface fresh ones first, and we count
 * unlocks so the VIP nudge fires at the right moment.
 *
 * Nothing personal is stored — only slugs in localStorage.
 */

import { track } from "@/lib/monetization";

const SEEN_KEY = "sov.vaultSeen";
const UNLOCK_KEY = "sov.vaultUnlocks";
const MAX_SEEN = 200;

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list.slice(-MAX_SEEN)));
  } catch {
    /* storage unavailable */
  }
}

/** Packs whose detail page this visitor already opened. */
export function seenSlugs(): string[] {
  return readList(SEEN_KEY);
}

export function markSeen(slug: string) {
  if (typeof window === "undefined") return;
  const list = readList(SEEN_KEY);
  if (list.includes(slug)) return;
  writeList(SEEN_KEY, [...list, slug]);
}

/** Packs this visitor actually unlocked (passed the sponsor step for). */
export function unlockedSlugs(): string[] {
  return readList(UNLOCK_KEY);
}

export function unlockCount(): number {
  return readList(UNLOCK_KEY).length;
}

export function recordUnlock(slug: string): number {
  if (typeof window === "undefined") return 0;
  const list = readList(UNLOCK_KEY);
  const next = list.includes(slug) ? list : [...list, slug];
  writeList(UNLOCK_KEY, next);
  return next.length;
}

/** Loop telemetry — measured per visit so ad budget can follow the winners. */
export function trackVaultLoop(slot: string, slug: string, value?: number) {
  track({
    event_type: "funnel",
    slot,
    tool_slug: "vault",
    format: slug,
    zone: "vault",
    metric_value: value ?? null,
  });
}
