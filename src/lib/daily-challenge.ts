/**
 * Daily challenge rotation (client-safe).
 *
 * One scoreable tool per UTC day, chosen deterministically so every visitor —
 * and the server — agrees on today's challenge without any storage.
 */

export const DAILY_TOOLS = ["iq", "memory", "logic"] as const;
export type DailyToolSlug = (typeof DAILY_TOOLS)[number];

export const DAILY_TOOL_META: Record<
  DailyToolSlug,
  { name: string; path: string; unit: string; blurb: string }
> = {
  iq: {
    name: "Quick IQ Test",
    path: "/tools/iq",
    unit: "est. score",
    blurb: "Adaptive reasoning set — today's board ranks estimated scores.",
  },
  memory: {
    name: "Memory Challenge",
    path: "/tools/memory",
    unit: "tile span",
    blurb: "Visual span run — the longest perfect sequence wins the day.",
  },
  logic: {
    name: "Logic Sprint",
    path: "/tools/logic",
    unit: "sprint score",
    blurb: "Sixty seconds of puzzles — speed and accuracy both count.",
  },
};

/** UTC day key, e.g. `2026-09-04`. */
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Deterministic tool of the day (rotates through DAILY_TOOLS). */
export function dailyToolFor(day: string = dayKey()): DailyToolSlug {
  const days = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  const index = ((days % DAILY_TOOLS.length) + DAILY_TOOLS.length) % DAILY_TOOLS.length;
  return DAILY_TOOLS[index]!;
}

const ALIAS_KEY = "sov.alias";

export function storedAlias(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(ALIAS_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeAlias(alias: string) {
  try {
    window.localStorage.setItem(ALIAS_KEY, alias.slice(0, 24));
  } catch {
    /* storage unavailable */
  }
}

/** Sanitises a display alias — no links, no personal data encouraged. */
export function cleanAlias(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N} _.-]/gu, "")
    .trim()
    .slice(0, 24);
}
