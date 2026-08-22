/**
 * Deterministic-but-random quiz engine.
 *
 * Every session draws a fresh seed, so the item set, item order and option
 * order all change between runs. That makes screenshot / answer-key sharing
 * useless while keeping a single session perfectly reproducible (same seed in,
 * same quiz out) for debugging and unit tests.
 */

export type Likert = { id: string; dim: string; text: string; reverse?: boolean };

export type IqItem = {
  id: string;
  cat: "Number" | "Logic" | "Verbal" | "Pattern" | "Spatial";
  tier: 1 | 2 | 3;
  prompt: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  answer: number;
};

/** Five-point agreement scale shared by every self-report test. */
export const SCALE = [
  { label: "Strongly disagree", weight: 0 },
  { label: "Disagree", weight: 1 },
  { label: "Neutral", weight: 2 },
  { label: "Agree", weight: 3 },
  { label: "Strongly agree", weight: 4 },
] as const;

export const SCALE_MAX = 4;

/** mulberry32 — tiny, fast, well-distributed seeded PRNG. */
export function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Pick `perGroup` items from every group so each dimension/category is always
 * represented, then shuffle the winners into a single presentation order.
 */
export function pickBalanced<T>(
  items: readonly T[],
  groupOf: (item: T) => string,
  perGroup: number,
  rand: () => number,
): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = groupOf(item);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  const picked: T[] = [];
  for (const bucket of groups.values()) {
    picked.push(...shuffle(bucket, rand).slice(0, perGroup));
  }
  return shuffle(picked, rand);
}

/** IQ selection: balanced across categories, then ordered easy → hard. */
export function pickIqItems(bank: readonly IqItem[], perCategory: number, rand: () => number): IqItem[] {
  const picked = pickBalanced(bank, (i) => i.cat, perCategory, rand);
  return picked.sort((a, b) => a.tier - b.tier);
}

/** Shuffle an item's options while keeping track of the correct index. */
export function shuffleOptions(item: IqItem, rand: () => number): { options: string[]; answer: number } {
  const paired = item.options.map((label, i) => ({ label, correct: i === item.answer }));
  const mixed = shuffle(paired, rand);
  return {
    options: mixed.map((o) => o.label),
    answer: mixed.findIndex((o) => o.correct),
  };
}

/** Average a set of Likert answers into a 0–100 dimension score. */
export function scoreDimensions(
  items: readonly Likert[],
  answers: Record<string, number>,
): { dim: string; value: number }[] {
  const buckets = new Map<string, number[]>();
  for (const item of items) {
    const raw = answers[item.id];
    if (raw === undefined) continue;
    const value = item.reverse ? SCALE_MAX - raw : raw;
    const pct = Math.round((value / SCALE_MAX) * 100);
    const bucket = buckets.get(item.dim);
    if (bucket) bucket.push(pct);
    else buckets.set(item.dim, [pct]);
  }
  return [...buckets.entries()].map(([dim, list]) => ({
    dim,
    value: list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0,
  }));
}

export type Band = "Low" | "Moderate" | "High";

export function bandOf(value: number): Band {
  if (value >= 67) return "High";
  if (value >= 34) return "Moderate";
  return "Low";
}

/**
 * Soft normal-ish curve so mid scores cluster where real populations do
 * instead of mapping linearly. Returns a 1–99 percentile.
 */
export function percentileOf(ratio: number): number {
  const z = (Math.max(0, Math.min(1, ratio)) - 0.5) * 4.2;
  const cdf = 1 / (1 + Math.exp(-z));
  return Math.max(1, Math.min(99, Math.round(cdf * 100)));
}
