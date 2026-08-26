/**
 * Attention checks (trap items).
 *
 * Self-report accuracy collapses when someone taps through without reading.
 * Two instructed-response items per session catch exactly that: each one names
 * the option it wants, so a careful reader passes and a tapper does not.
 *
 * Trap items are NEVER scored into a dimension — `ATTENTION_DIM` is filtered
 * out before any scoring or agreement maths runs.
 */

import { shuffle, type Likert } from "@/lib/quiz-engine";

export const ATTENTION_DIM = "__attention";

/** A trap item plus the exact scale weight a reading user must pick. */
type Trap = { item: Likert; expect: number };

const TRAPS: Trap[] = [
  {
    item: {
      id: "atn_disagree",
      dim: ATTENTION_DIM,
      text: "This is an attention check — please select “Disagree” to continue.",
    },
    expect: 1,
  },
  {
    item: {
      id: "atn_strong_agree",
      dim: ATTENTION_DIM,
      text: "To show you are reading carefully, choose “Strongly agree” for this one.",
    },
    expect: 4,
  },
  {
    item: {
      id: "atn_neutral",
      dim: ATTENTION_DIM,
      text: "Skip the content of this line and select “Neutral”.",
    },
    expect: 2,
  },
  {
    item: {
      id: "atn_agree",
      dim: ATTENTION_DIM,
      text: "Quality check: mark this statement “Agree” regardless of your view.",
    },
    expect: 3,
  },
];

export const ATTENTION_EXPECTED: Record<string, number> = Object.fromEntries(
  TRAPS.map((t) => [t.item.id, t.expect]),
);

export function isAttentionItem(item: Pick<Likert, "dim">): boolean {
  return item.dim === ATTENTION_DIM;
}

/** Everything except trap items — the only set that may be scored. */
export function scorableItems(items: readonly Likert[]): Likert[] {
  return items.filter((i) => !isAttentionItem(i));
}

/**
 * Insert `count` trap items into a drawn set at spread-out positions, so they
 * never land next to each other or in the first two questions.
 */
export function withAttentionChecks(
  items: readonly Likert[],
  rand: () => number,
  count = 2,
): Likert[] {
  const picked = shuffle(TRAPS, rand).slice(0, Math.max(0, Math.min(count, TRAPS.length)));
  if (!picked.length || items.length < 6) return items.slice();

  const out = items.slice();
  const step = Math.floor(out.length / (picked.length + 1));
  picked.forEach((trap, i) => {
    const base = step * (i + 1) + i;
    const at = Math.max(2, Math.min(out.length, base));
    out.splice(at, 0, trap.item);
  });
  return out;
}

export type AttentionResult = {
  /** Traps actually present in this session. */
  total: number;
  /** Traps answered with the instructed option. */
  passed: number;
  /** Traps answered at all. */
  answered: number;
  /** True when at least one trap was answered incorrectly. */
  failed: boolean;
};

export function evaluateAttention(
  items: readonly Likert[],
  answers: Record<string, number>,
): AttentionResult {
  const traps = items.filter(isAttentionItem);
  let passed = 0;
  let answered = 0;
  for (const trap of traps) {
    const given = answers[trap.id];
    if (given === undefined) continue;
    answered += 1;
    if (given === ATTENTION_EXPECTED[trap.id]) passed += 1;
  }
  return { total: traps.length, passed, answered, failed: answered > passed };
}
