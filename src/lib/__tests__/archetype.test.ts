import { describe, expect, it } from "vitest";

import { ARCHETYPES, buildDossier, resolveArchetype, type AxisScore } from "@/lib/archetype";
import { DARK_BANK, DARK_DIMS, DARK_PER_DIM, DARK_SESSION_SIZE } from "@/lib/banks/dark";
import { pickBalanced, rngFrom, scoreDimensions, SCALE_MAX } from "@/lib/quiz-engine";

const vector = (values: Partial<Record<string, number>>): AxisScore[] =>
  DARK_DIMS.map((dim) => ({ dim, value: values[dim] ?? 0 }));

describe("dark personality item bank", () => {
  it("covers all six axes with enough items to draw a balanced session", () => {
    for (const dim of DARK_DIMS) {
      const items = DARK_BANK.filter((i) => i.dim === dim);
      expect(items.length).toBeGreaterThanOrEqual(DARK_PER_DIM);
    }
    // Every item belongs to a declared axis — nothing is silently unscored.
    expect(DARK_BANK.every((i) => (DARK_DIMS as readonly string[]).includes(i.dim))).toBe(true);
    expect(new Set(DARK_BANK.map((i) => i.id)).size).toBe(DARK_BANK.length);
  });

  it("draws the advertised session size, balanced across axes", () => {
    for (const seed of [1, 7, 99, 123456]) {
      const items = pickBalanced(DARK_BANK, (i) => i.dim, DARK_PER_DIM, rngFrom(seed));
      expect(items.length).toBe(DARK_SESSION_SIZE);
      for (const dim of DARK_DIMS) {
        expect(items.filter((i) => i.dim === dim).length).toBe(DARK_PER_DIM);
      }
    }
  });

  it("scores every drawn item into exactly one axis (no drops, no double count)", () => {
    const items = pickBalanced(DARK_BANK, (i) => i.dim, DARK_PER_DIM, rngFrom(42));
    const answers = Object.fromEntries(items.map((i, n) => [i.id, n % (SCALE_MAX + 1)]));
    const scores = scoreDimensions(items, answers);
    expect(scores.length).toBe(DARK_DIMS.length);
    expect(new Set(scores.map((s) => s.dim)).size).toBe(DARK_DIMS.length);
    for (const s of scores) {
      expect(s.value).toBeGreaterThanOrEqual(0);
      expect(s.value).toBeLessThanOrEqual(100);
    }
  });

  it("normalises the extremes to 0 and 100, honouring reverse-keyed items", () => {
    const items = pickBalanced(DARK_BANK, (i) => i.dim, DARK_PER_DIM, rngFrom(11));
    const maxAnswers = Object.fromEntries(
      items.map((i) => [i.id, i.reverse ? 0 : SCALE_MAX]),
    );
    const minAnswers = Object.fromEntries(
      items.map((i) => [i.id, i.reverse ? SCALE_MAX : 0]),
    );
    expect(scoreDimensions(items, maxAnswers).every((s) => s.value === 100)).toBe(true);
    expect(scoreDimensions(items, minAnswers).every((s) => s.value === 0)).toBe(true);
  });
});

describe("archetype resolution", () => {
  it("always returns the full six-axis vector, clamped to 0–100", () => {
    const resolved = resolveArchetype([
      { dim: "Machiavellianism", value: 140 },
      { dim: "Narcissism", value: -20 },
      { dim: "Cognition", value: Number.NaN },
    ]);
    expect(resolved.ordered.length).toBe(DARK_DIMS.length);
    expect(resolved.ordered.map((a) => a.value)).toEqual([100, 0, 0, 0, 0, 0]);
    expect(resolved.intensity).toBe(Math.round(100 / 6));
  });

  it("produces a valid archetype for min, max and mixed answer patterns", () => {
    const patterns: AxisScore[][] = [
      vector({}),
      vector(Object.fromEntries(DARK_DIMS.map((d) => [d, 100]))),
      vector(Object.fromEntries(DARK_DIMS.map((d) => [d, 50]))),
      vector({ Machiavellianism: 100, Cognition: 90 }),
      vector({ Detachment: 100, Psychopathy: 80 }),
      vector({ Narcissism: 100, Shadow: 10 }),
    ];
    for (const p of patterns) {
      const r = resolveArchetype(p);
      expect(ARCHETYPES).toContain(r.archetype);
      expect(r.runnerUp).not.toBe(r.archetype);
    }
  });

  it("is deterministic and stable for the same input", () => {
    const p = vector({ Machiavellianism: 71, Narcissism: 64, Psychopathy: 39, Detachment: 52, Cognition: 80, Shadow: 45 });
    const a = resolveArchetype(p);
    const b = resolveArchetype([...p].reverse());
    expect(b.archetype.key).toBe(a.archetype.key);
    expect(b.ordered).toEqual(a.ordered);
    // Locked regression case: refactors must not move this profile.
    expect(a.archetype.key).toBe("machiavellian-architect");
  });

  it("breaks perfect ties explicitly by declaration order", () => {
    const flat = vector(Object.fromEntries(DARK_DIMS.map((d) => [d, 50])));
    const first = resolveArchetype(flat);
    const second = resolveArchetype(flat.slice().reverse());
    expect(second.archetype.key).toBe(first.archetype.key);
    expect(first.dominant).toBe(DARK_DIMS[0]);
    expect(first.support).toBe(DARK_DIMS[1]);
  });

  it("every archetype is reachable from some valid answer set", () => {
    const reached = new Set<string>();
    // Sweep the axis space coarsely: each archetype must win somewhere.
    const steps = [0, 50, 100];
    for (const a of steps)
      for (const b of steps)
        for (const c of steps)
          for (const d of steps)
            for (const e of steps)
              for (const f of steps) {
                reached.add(
                  resolveArchetype([
                    { dim: "Machiavellianism", value: a },
                    { dim: "Narcissism", value: b },
                    { dim: "Psychopathy", value: c },
                    { dim: "Detachment", value: d },
                    { dim: "Cognition", value: e },
                    { dim: "Shadow", value: f },
                  ]).archetype.key,
                );
              }
    expect([...reached].sort()).toEqual(ARCHETYPES.map((a) => a.key).sort());
  });

  it("names the eight advertised archetypes", () => {
    expect(ARCHETYPES.map((a) => a.name)).toEqual([
      "The Sovereign Manipulator",
      "The Velvet Ghost",
      "The Machiavellian Architect",
      "The Dark Empath",
      "The Stoic Predator",
      "The Narcissistic Visionary",
      "The Shadow Mirror",
      "The Nihilistic Sovereign",
    ]);
  });
});

describe("VIP dossier", () => {
  it("renders every axis, the deep analysis and the matrix module", () => {
    const dossier = buildDossier(
      vector({ Machiavellianism: 82, Narcissism: 74, Psychopathy: 41, Detachment: 66, Cognition: 88, Shadow: 35 }),
    );
    expect(dossier.axes.length).toBe(DARK_DIMS.length);
    for (const axis of dossier.axes) {
      expect(axis.reading.length).toBeGreaterThan(20);
      expect(axis.blindSpot.length).toBeGreaterThan(10);
      expect(axis.defense.length).toBeGreaterThan(10);
    }
    expect(dossier.archetype.analysis.length).toBeGreaterThanOrEqual(4);
    expect(dossier.archetype.matrix.triggers.length).toBeGreaterThan(0);
    expect(dossier.archetype.matrix.defense.length).toBeGreaterThan(0);
    // The report is sold as 1,500+ words.
    expect(dossier.words).toBeGreaterThan(1500);
  });

  it("never throws on an empty or partial answer set", () => {
    expect(() => buildDossier([])).not.toThrow();
    expect(buildDossier([]).axes.every((a) => a.value === 0)).toBe(true);
  });
});
