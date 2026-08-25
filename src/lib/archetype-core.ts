/**
 * Client-safe half of the shadow engine.
 *
 * Only what a free visitor is allowed to see lives here: the six-axis scoring
 * maths, the archetype affinity weights and the public archetype copy (name,
 * tagline, teaser blurb, edge). Every premium paragraph — deep analysis, axis
 * readings, blind spots, defence mechanisms, mastery guide, relationship matrix
 * — lives in `archetype-premium.server.ts` and is never shipped to the browser.
 */

import { bandOf, type Band } from "@/lib/quiz-engine";
import { DARK_DIMS, type DarkDim } from "@/lib/banks/dark";

export type { Band };

export type AxisScore = { dim: string; value: number };

export type ArchetypeKey =
  | "sovereign-manipulator"
  | "velvet-ghost"
  | "machiavellian-architect"
  | "dark-empath"
  | "stoic-predator"
  | "narcissistic-visionary"
  | "shadow-mirror"
  | "nihilistic-sovereign";

/** Free-tier archetype card. Safe to render for anonymous visitors. */
export type PublicArchetype = {
  key: ArchetypeKey;
  name: string;
  tagline: string;
  blurb: string;
  edge: string;
  /** Signed affinity weights per axis; the highest weighted score wins. */
  weights: Partial<Record<DarkDim, number>>;
};

export const PUBLIC_ARCHETYPES: PublicArchetype[] = [
  {
    "key": "sovereign-manipulator",
    "name": "The Sovereign Manipulator",
    "tagline": "Command disguised as generosity",
    "blurb": "You do not ask for power, you arrange the conditions under which it is handed to you. People leave your conversations feeling they chose something you had already decided.",
    "edge": "Your risk is winning so quietly that nobody, including you, can tell what you actually wanted.",
    "weights": {
      "Machiavellianism": 1.35,
      "Narcissism": 1,
      "Cognition": 0.6,
      "Detachment": 0.3,
      "Psychopathy": 0.2
    }
  },
  {
    "key": "velvet-ghost",
    "name": "The Velvet Ghost",
    "tagline": "Present, warm, and completely unreachable",
    "blurb": "You are remembered as an atmosphere rather than a set of facts. People feel close to you and later cannot name a single thing you disclosed.",
    "edge": "Your risk is mistaking distance for peace and calling an empty room freedom.",
    "weights": {
      "Detachment": 1.4,
      "Machiavellianism": 0.7,
      "Cognition": 0.5,
      "Psychopathy": 0.4,
      "Narcissism": -0.2
    }
  },
  {
    "key": "machiavellian-architect",
    "name": "The Machiavellian Architect",
    "tagline": "Systems where other people see situations",
    "blurb": "You do not argue, you redesign the frame until the argument becomes unnecessary. Most of your wins were decided weeks before anyone noticed a contest.",
    "edge": "Your risk is treating people as variables long after they became friends.",
    "weights": {
      "Cognition": 1.3,
      "Machiavellianism": 1.2,
      "Detachment": 0.5,
      "Narcissism": 0.3
    }
  },
  {
    "key": "dark-empath",
    "name": "The Dark Empath",
    "tagline": "Full-spectrum empathy with a strategic mind behind it",
    "blurb": "You feel everything in the room and understand precisely what could be done with it. That is a rare and heavy combination: the accuracy of a manipulator with the conscience of someone who cannot un-feel the cost.",
    "edge": "Your risk is exhaustion — you carry other people's states and audit your own motives at the same time.",
    "weights": {
      "Shadow": 1.2,
      "Machiavellianism": 0.9,
      "Cognition": 0.8,
      "Psychopathy": -0.9,
      "Detachment": -0.2
    }
  },
  {
    "key": "stoic-predator",
    "name": "The Stoic Predator",
    "tagline": "Still water, decided in advance",
    "blurb": "You are calm in the exact places other people panic, and you act while they are still processing. Nothing about you looks aggressive until the moment it is already done.",
    "edge": "Your risk is calling numbness discipline, and paying for it years later in the body.",
    "weights": {
      "Psychopathy": 1.3,
      "Detachment": 1,
      "Cognition": 0.6,
      "Shadow": 0.2,
      "Narcissism": -0.1
    }
  },
  {
    "key": "narcissistic-visionary",
    "name": "The Narcissistic Visionary",
    "tagline": "A future so vivid the present looks like scaffolding",
    "blurb": "You are always building the next version of yourself, and everyone near you gets recruited into it. Your certainty is contagious, and it is genuinely productive — until it is asked to bend.",
    "edge": "Your risk is arriving somewhere excellent and refusing to notice.",
    "weights": {
      "Narcissism": 1.45,
      "Cognition": 0.7,
      "Machiavellianism": 0.4,
      "Detachment": -0.2
    }
  },
  {
    "key": "shadow-mirror",
    "name": "The Shadow Mirror",
    "tagline": "Fully aware of the weapon you are carrying",
    "blurb": "You have looked directly at your own darker instincts and kept the knowledge. That awareness makes you unusually honest, unusually hard to manipulate, and unusually tired.",
    "edge": "Your risk is confusing insight with change — knowing the pattern is not the same as interrupting it.",
    "weights": {
      "Shadow": 1.5,
      "Cognition": 0.6,
      "Detachment": 0.3,
      "Machiavellianism": 0.2
    }
  },
  {
    "key": "nihilistic-sovereign",
    "name": "The Nihilistic Sovereign",
    "tagline": "Free because nothing has authority over you",
    "blurb": "You have quietly concluded that most rules are agreements you were never asked about. That makes you unusually free, unusually capable in chaos, and genuinely hard to govern.",
    "edge": "Your risk is burning something down for the pleasure of proving it could burn.",
    "weights": {
      "Psychopathy": 1.2,
      "Narcissism": 0.7,
      "Detachment": 0.7,
      "Shadow": -0.6,
      "Cognition": 0.3
    }
  }
];

const BY_KEY = new Map(PUBLIC_ARCHETYPES.map((a) => [a.key, a]));

export function archetypeByKey(key: ArchetypeKey): PublicArchetype {
  return BY_KEY.get(key) ?? PUBLIC_ARCHETYPES[0]!;
}

/** Axis display names — labels are free, the readings behind them are not. */
export const AXIS_LABELS: Record<DarkDim, string> = {
  Machiavellianism: "Machiavellianism",
  Narcissism: "Narcissism",
  Psychopathy: "Psychopathy",
  Detachment: "Emotional Detachment",
  Cognition: "Cognitive Dominance",
  Shadow: "Shadow Integration",
};

/* ---------- premium payload shapes (returned by the server only) ---------- */

export type DossierAxis = {
  dim: string;
  label: string;
  value: number;
  band: Band;
  meaning: string;
  reading: string;
  blindSpot: string;
  defense: string;
};

export type DossierMatrix = {
  attracts: string;
  destroys: string;
  triggers: string[];
  defense: string[];
  compatible: string[];
  volatile: string[];
};

export type DossierArchetype = PublicArchetype & {
  pressure: string;
  betrayal: string;
  romance: string;
  analysis: string[];
  mastery: string[];
  matrix: DossierMatrix;
};

export type Dossier = {
  archetype: DossierArchetype;
  runnerUp: PublicArchetype;
  intensity: number;
  dominant: string;
  support: string;
  ordered: AxisScore[];
  axes: DossierAxis[];
  context: string[];
  words: number;
};

/** Clamp any raw axis value into the deterministic 0–100 report range. */
export function clampAxis(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Normalise raw axis scores and pick the winning archetype by weighted affinity.
 *
 * Deterministic by construction: the axis vector is always the full six axes in
 * canonical order, values are clamped to 0–100, and both the axis ranking and
 * the archetype ranking break ties by declaration order — so the same answers
 * always produce the same archetype, and every valid answer set produces one.
 */
export function resolveArchetype(scores: AxisScore[]): {
  archetype: PublicArchetype;
  runnerUp: PublicArchetype;
  intensity: number;
  dominant: string;
  support: string;
  ordered: AxisScore[];
} {
  const byDim = new Map(scores.map((s) => [s.dim, s.value]));
  // Always score all six axes: a missing axis reads as 0 rather than vanishing.
  const axes: AxisScore[] = DARK_DIMS.map((dim) => ({
    dim,
    value: clampAxis(byDim.get(dim) ?? 0),
  }));
  const ordered = [...axes].sort(
    (a, b) =>
      b.value - a.value ||
      DARK_DIMS.indexOf(a.dim as DarkDim) - DARK_DIMS.indexOf(b.dim as DarkDim),
  );
  const intensity = Math.round(axes.reduce((a, b) => a + b.value, 0) / axes.length);

  const ranked = PUBLIC_ARCHETYPES.map((archetype, index) => {
    let total = 0;
    for (const dim of DARK_DIMS) {
      const weight = archetype.weights[dim] ?? 0;
      const value = axes.find((a) => a.dim === dim)!.value;
      // A negative weight scores the *absence* of the axis, and is applied once.
      total += weight * (weight < 0 ? 100 - value : value);
    }
    return { archetype, total, index };
  }).sort((a, b) => b.total - a.total || a.index - b.index);

  return {
    archetype: ranked[0]!.archetype,
    runnerUp: ranked[1]!.archetype,
    intensity,
    dominant: ordered[0]?.dim ?? "Machiavellianism",
    support: ordered[1]?.dim ?? "Cognition",
    ordered,
  };
}

/** Everything a free visitor may see: scores, bands, archetype card. */
export function freeSummary(scores: AxisScore[]) {
  const resolved = resolveArchetype(scores);
  const axes = resolved.ordered.map((s) => ({
    dim: s.dim,
    label: AXIS_LABELS[s.dim as DarkDim] ?? s.dim,
    value: s.value,
    band: bandOf(s.value),
  }));
  return { ...resolved, axes };
}
