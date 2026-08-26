import { describe, expect, it } from "vitest";

import { axisDetails, iqEstimate, percentileFromZ, responseQuality } from "@/lib/psychometrics";
import { scoreDimensions, type IqItem, type Likert } from "@/lib/quiz-engine";

const items: Likert[] = [
  { id: "a1", dim: "A", text: "a1" },
  { id: "a2", dim: "A", text: "a2" },
  { id: "a3", dim: "A", text: "a3", reverse: true },
  { id: "b1", dim: "B", text: "b1" },
  { id: "b2", dim: "B", text: "b2" },
  { id: "b3", dim: "B", text: "b3", reverse: true },
  { id: "c1", dim: "C", text: "c1" },
  { id: "c2", dim: "C", text: "c2" },
];

const consistent = { a1: 4, a2: 4, a3: 0, b1: 1, b2: 1, b3: 3, c1: 2, c2: 2 };

describe("axisDetails", () => {
  it("matches scoreDimensions values exactly", () => {
    const base = scoreDimensions(items, consistent);
    for (const detail of axisDetails(items, consistent)) {
      expect(detail.value).toBe(base.find((b) => b.dim === detail.dim)!.value);
    }
  });

  it("reports high agreement for aligned items and a narrow band", () => {
    const a = axisDetails(items, consistent).find((d) => d.dim === "A")!;
    expect(a.agreement).toBeGreaterThan(90);
    expect(a.errorBand).toBeLessThanOrEqual(5);
  });
});

describe("responseQuality", () => {
  it("grades a considered, complete session as high confidence", () => {
    const q = responseQuality(items, consistent, Object.fromEntries(items.map((i) => [i.id, 4200])));
    expect(q.label).toBe("High");
    expect(q.flags).toHaveLength(0);
  });

  it("flags straight-lining", () => {
    const flat = Object.fromEntries(items.map((i) => [i.id, 4]));
    expect(responseQuality(items, flat).flags).toContain("straight-lining");
  });

  it("flags speeding from response times", () => {
    const fast = Object.fromEntries(items.map((i) => [i.id, 500]));
    expect(responseQuality(items, consistent, fast).flags).toContain("speeding");
  });

  it("flags an incomplete set and lowers confidence", () => {
    const partial = { a1: 4, a2: 3 };
    const q = responseQuality(items, partial);
    expect(q.flags).toContain("incomplete");
    expect(q.score).toBeLessThan(80);
  });
});

const iqItems: IqItem[] = [
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `e${i}`,
    cat: "Logic" as const,
    tier: 1 as const,
    prompt: "p",
    options: ["a", "b"],
    answer: 0,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `m${i}`,
    cat: "Logic" as const,
    tier: 2 as const,
    prompt: "p",
    options: ["a", "b"],
    answer: 0,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `h${i}`,
    cat: "Logic" as const,
    tier: 3 as const,
    prompt: "p",
    options: ["a", "b"],
    answer: 0,
  })),
];

describe("iqEstimate", () => {
  it("puts a perfect run above and a blank run below the mean", () => {
    const all = Object.fromEntries(iqItems.map((i) => [i.id, true]));
    const none = Object.fromEntries(iqItems.map((i) => [i.id, false]));
    expect(iqEstimate(iqItems, all).iq).toBeGreaterThan(130);
    expect(iqEstimate(iqItems, none).iq).toBeLessThan(80);
  });

  it("rewards hard items more than easy ones", () => {
    const easyOnly = Object.fromEntries(iqItems.map((i) => [i.id, i.tier === 1]));
    const hardOnly = Object.fromEntries(iqItems.map((i) => [i.id, i.tier === 3]));
    expect(iqEstimate(iqItems, hardOnly).iq).toBeGreaterThan(iqEstimate(iqItems, easyOnly).iq);
  });

  it("always returns an interval around the point estimate", () => {
    const est = iqEstimate(iqItems, { e0: true, m0: true });
    expect(est.low).toBeLessThan(est.iq);
    expect(est.high).toBeGreaterThan(est.iq);
    expect(est.sem).toBeGreaterThan(0);
  });

  it("maps percentiles monotonically", () => {
    expect(percentileFromZ(-1)).toBeLessThan(percentileFromZ(0));
    expect(percentileFromZ(0)).toBe(50);
    expect(percentileFromZ(2)).toBeGreaterThan(95);
  });
});
