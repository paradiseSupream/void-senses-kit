import { describe, expect, it } from "vitest";

import {
  ATTENTION_EXPECTED,
  evaluateAttention,
  isAttentionItem,
  scorableItems,
  withAttentionChecks,
} from "@/lib/attention";
import { buildAdaptivePool, drawItem, nextTier, reachedDifficulty } from "@/lib/adaptive-iq";
import { blend, isLive, normPercentile, PRIOR_MEAN } from "@/lib/norms";
import { iqEstimate, responseQuality } from "@/lib/psychometrics";
import { IQ_BANK } from "@/lib/banks/iq";
import { DARK_BANK, DARK_PER_DIM } from "@/lib/banks/dark";
import { pickBalanced, rngFrom, scoreDimensions } from "@/lib/quiz-engine";

const rand = () => rngFrom(1234);

describe("attention checks", () => {
  const base = pickBalanced(DARK_BANK, (i) => i.dim, DARK_PER_DIM, rand());
  const withTraps = withAttentionChecks(base, rand(), 2);

  it("adds exactly two traps and keeps every real item", () => {
    expect(withTraps.length).toBe(base.length + 2);
    expect(scorableItems(withTraps).map((i) => i.id)).toEqual(base.map((i) => i.id));
    expect(withTraps.filter(isAttentionItem)).toHaveLength(2);
  });

  it("never scores a trap into a dimension", () => {
    const answers: Record<string, number> = {};
    for (const item of withTraps) answers[item.id] = 3;
    const dims = scoreDimensions(scorableItems(withTraps), answers).map((d) => d.dim);
    expect(dims).not.toContain("__attention");
  });

  it("passes a reader and fails a tapper", () => {
    const traps = withTraps.filter(isAttentionItem);
    const good: Record<string, number> = {};
    const bad: Record<string, number> = {};
    for (const t of traps) {
      good[t.id] = ATTENTION_EXPECTED[t.id]!;
      bad[t.id] = (ATTENTION_EXPECTED[t.id]! + 1) % 5;
    }
    expect(evaluateAttention(withTraps, good).failed).toBe(false);
    expect(evaluateAttention(withTraps, bad).failed).toBe(true);
  });

  it("downgrades confidence when a trap is missed", () => {
    const answers: Record<string, number> = {};
    base.forEach((item, i) => (answers[item.id] = i % 5));
    const clean = responseQuality(base, answers, undefined, { total: 2, passed: 2, answered: 2 });
    const dirty = responseQuality(base, answers, undefined, { total: 2, passed: 0, answered: 2 });
    expect(dirty.score).toBeLessThan(clean.score);
    expect(dirty.flags).toContain("failed-attention");
    expect(clean.flags).not.toContain("failed-attention");
  });
});

describe("adaptive IQ staircase", () => {
  it("steps up on two right and down on two wrong", () => {
    expect(nextTier(1, [true, true])).toBe(2);
    expect(nextTier(2, [true, true])).toBe(3);
    expect(nextTier(3, [true, true])).toBe(3);
    expect(nextTier(3, [false, false])).toBe(2);
    expect(nextTier(1, [false, false])).toBe(1);
    expect(nextTier(2, [true, false])).toBe(2);
  });

  it("never repeats an item and balances categories", () => {
    const pool = buildAdaptivePool(IQ_BANK, rand());
    const used: Record<string, number> = {};
    const seen = new Set<string>();
    let tier: 1 | 2 | 3 = 1;
    const drawn = [];
    for (let i = 0; i < 25; i++) {
      const item = drawItem(pool, tier, used);
      expect(item).not.toBeNull();
      expect(seen.has(item!.id)).toBe(false);
      seen.add(item!.id);
      used[item!.cat] = (used[item!.cat] ?? 0) + 1;
      drawn.push(item!);
      tier = nextTier(tier, [true, true]);
    }
    const counts = Object.values(used);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(2);
    expect(reachedDifficulty(drawn)).toBeGreaterThan(1);
  });

  it("rewards the same hit-rate more when the items were harder", () => {
    const easy = IQ_BANK.filter((i) => i.tier === 1).slice(0, 10);
    const hard = IQ_BANK.filter((i) => i.tier === 3).slice(0, 10);
    const hitsOf = (items: typeof easy) =>
      Object.fromEntries(items.map((item, i) => [item.id, i < 7]));
    const easyEst = iqEstimate(easy, hitsOf(easy), { difficulty: 1, adaptive: true });
    const hardEst = iqEstimate(hard, hitsOf(hard), { difficulty: 3, adaptive: true });
    expect(hardEst.iq).toBeGreaterThan(easyEst.iq);
  });
});

describe("live norms", () => {
  it("ignores a tiny sample and uses the reference curve", () => {
    const tiny = { dim: "Shadow", n: 5, mean: 90, sd: 4 };
    expect(isLive(tiny)).toBe(false);
    expect(blend(tiny).mean).toBe(PRIOR_MEAN);
    expect(normPercentile(50, tiny)).toBe(normPercentile(50, undefined));
  });

  it("shrinks a real sample toward the prior in proportion to its size", () => {
    const small = { dim: "Shadow", n: 100, mean: 70, sd: 15 };
    const large = { dim: "Shadow", n: 5000, mean: 70, sd: 15 };
    expect(blend(small).mean).toBeLessThan(blend(large).mean);
    expect(blend(large).mean).toBeGreaterThan(65);
    // A score at the live mean sits near the middle of the live distribution.
    expect(normPercentile(70, large)).toBeGreaterThan(40);
    expect(normPercentile(70, large)).toBeLessThan(60);
    // The same score is far higher against the textbook curve.
    expect(normPercentile(70, undefined)).toBeGreaterThan(70);
  });
});
