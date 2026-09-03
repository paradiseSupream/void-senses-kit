/**
 * Achievement shelf — a purely local (storage-only) engagement loop.
 *
 * Badges reward the behaviours that already drive revenue: finishing tests,
 * inviting friends and unlocking vault packs. Nothing personal is stored and
 * no new table is needed; progress is read from the counters other modules
 * already maintain.
 */

import { referralCredits } from "@/lib/referral";
import { seenVaultSlugs, unlockedVaultSlugs } from "@/lib/vault-loop";

const TOOLS_KEY = "sov.badges.tools";
const AWARDED_KEY = "sov.badges.awarded";
const RESULTS_KEY = "sov.resultsDone";

export type Badge = {
  id: string;
  label: string;
  hint: string;
  /** 0..1 completion of this badge. */
  progress: number;
  earned: boolean;
};

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — badges are best-effort */
  }
}

/** Distinct tool slugs this visitor has finished. */
export function completedTools(): string[] {
  const raw = readLocal(TOOLS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Records one finished tool run. Safe to call on every result render. */
export function markToolCompleted(slug: string): void {
  if (!slug) return;
  const list = completedTools();
  if (list.includes(slug)) return;
  writeLocal(TOOLS_KEY, JSON.stringify([...list, slug].slice(-40)));
}

function resultsDone(): number {
  return Number(readLocal(RESULTS_KEY) ?? "0") || 0;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Current badge shelf, derived from local counters. */
export function badges(totalTools: number): Badge[] {
  const tools = completedTools().length;
  const runs = Math.max(tools, resultsDone());
  const invites = referralCredits();
  const unlocks = unlockedVaultSlugs().length;
  const browsed = seenVaultSlugs().length;

  const list: Badge[] = [
    {
      id: "first-signal",
      label: "First Signal",
      hint: "Finish your first test",
      progress: clamp(runs / 1),
      earned: runs >= 1,
    },
    {
      id: "deep-scan",
      label: "Deep Scan",
      hint: "Finish 3 different tests",
      progress: clamp(tools / 3),
      earned: tools >= 3,
    },
    {
      id: "void-complete",
      label: "Void Complete",
      hint: `Finish all ${totalTools} tools`,
      progress: totalTools > 0 ? clamp(tools / totalTools) : 0,
      earned: totalTools > 0 && tools >= totalTools,
    },
    {
      id: "signal-boost",
      label: "Signal Boost",
      hint: "3 friends finish from your link",
      progress: clamp(invites / 3),
      earned: invites >= 3,
    },
    {
      id: "vault-raider",
      label: "Vault Raider",
      hint: "Unlock 5 vault packs",
      progress: clamp(unlocks / 5),
      earned: unlocks >= 5,
    },
    {
      id: "archivist",
      label: "Archivist",
      hint: "Browse 15 vault resources",
      progress: clamp(browsed / 15),
      earned: browsed >= 15,
    },
  ];

  return list;
}

/**
 * Returns badges newly earned since the last call, so the UI can celebrate
 * exactly once per achievement.
 */
export function drainNewBadges(list: Badge[]): Badge[] {
  const raw = readLocal(AWARDED_KEY);
  const known = raw ? raw.split(",").filter(Boolean) : [];
  const fresh = list.filter((badge) => badge.earned && !known.includes(badge.id));
  if (fresh.length) {
    writeLocal(AWARDED_KEY, [...known, ...fresh.map((badge) => badge.id)].join(","));
  }
  return fresh;
}
