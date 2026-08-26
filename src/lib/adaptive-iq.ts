/**
 * Adaptive item selection for the IQ screener.
 *
 * A fixed easy→hard list spends most of its items where they carry no
 * information: a strong solver breezes through tier 1, a weaker one guesses
 * through tier 3. A simple staircase fixes that — two right in a row steps the
 * difficulty up, two wrong steps it down — so items cluster around the point
 * where the answer is genuinely uncertain, which is where measurement precision
 * comes from.
 *
 * The routine stays deterministic for a given seed: same seed in, same session.
 */

import { shuffle, type IqItem } from "@/lib/quiz-engine";

export type Tier = 1 | 2 | 3;

export type AdaptivePool = {
  /** Remaining items per tier, already shuffled. */
  byTier: Record<Tier, IqItem[]>;
};

export function buildAdaptivePool(bank: readonly IqItem[], rand: () => number): AdaptivePool {
  return {
    byTier: {
      1: shuffle(bank.filter((i) => i.tier === 1), rand),
      2: shuffle(bank.filter((i) => i.tier === 2), rand),
      3: shuffle(bank.filter((i) => i.tier === 3), rand),
    },
  };
}

/** Next difficulty from the running streak (2-up / 2-down staircase). */
export function nextTier(current: Tier, history: readonly boolean[]): Tier {
  const last = history.slice(-2);
  if (last.length === 2 && last[0] && last[1]) return Math.min(3, current + 1) as Tier;
  if (last.length === 2 && !last[0] && !last[1]) return Math.max(1, current - 1) as Tier;
  return current;
}

/**
 * Draw the next item at `tier`, preferring the least-used category so the five
 * reasoning areas stay balanced even though difficulty moves freely.
 * Falls back to the nearest tier that still has items.
 */
export function drawItem(
  pool: AdaptivePool,
  tier: Tier,
  usedByCategory: Record<string, number>,
): IqItem | null {
  const order: Tier[] = tier === 1 ? [1, 2, 3] : tier === 2 ? [2, 1, 3] : [3, 2, 1];
  for (const t of order) {
    const bucket = pool.byTier[t];
    if (!bucket.length) continue;
    let bestIndex = 0;
    let bestUse = Infinity;
    bucket.forEach((item, i) => {
      const use = usedByCategory[item.cat] ?? 0;
      if (use < bestUse) {
        bestUse = use;
        bestIndex = i;
      }
    });
    const [item] = bucket.splice(bestIndex, 1);
    return item ?? null;
  }
  return null;
}

/**
 * Difficulty of the items a session actually reached, 1–3. A run that ends on
 * tier-3 items carries more information than one that never left tier 1, and
 * the estimator uses it to widen or tighten the reported band.
 */
export function reachedDifficulty(items: readonly IqItem[]): number {
  if (!items.length) return 1;
  return items.reduce((sum, i) => sum + i.tier, 0) / items.length;
}
