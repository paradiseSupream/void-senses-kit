/**
 * Measurement-quality layer shared by every self-report tool.
 *
 * Nothing here changes how a dimension is scored — `scoreDimensions` stays the
 * single source of truth. This module adds the things that make a result
 * *trustworthy* instead of just present:
 *
 *  1. per-axis internal agreement (do the items on one axis agree?),
 *  2. a confidence score with named response-style flags (speeding,
 *     straight-lining, extreme responding, inconsistency),
 *  3. an error band (±) so a score is reported as an interval, not a fake
 *     point estimate,
 *  4. a difficulty-weighted IQ estimate on the conventional mean-100 / SD-15
 *     metric with its own standard error of measurement.
 */

import { SCALE_MAX, type IqItem, type Likert } from "@/lib/quiz-engine";

/* ------------------------------------------------------------------ shared */

export type Confidence = "High" | "Moderate" | "Low";

export type QualityFlag =
  | "incomplete"
  | "speeding"
  | "straight-lining"
  | "extreme-style"
  | "inconsistent";

export type QualityReport = {
  /** 0–100 measurement confidence for this specific session. */
  score: number;
  label: Confidence;
  flags: QualityFlag[];
  notes: string[];
  answered: number;
  total: number;
  /** ± points to report around every axis score. */
  errorBand: number;
  /** Mean within-axis agreement, 0–100 (higher = items agreed). */
  agreement: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

function mean(list: readonly number[]): number {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
}

function sd(list: readonly number[]): number {
  if (list.length < 2) return 0;
  const m = mean(list);
  return Math.sqrt(mean(list.map((v) => (v - m) ** 2)));
}

/** Standard normal CDF (Zelen & Severo approximation) → 0–1. */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly =
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const tail = poly * Math.exp(-0.5 * z * z) * 0.3989422804014327;
  return z >= 0 ? 1 - tail : tail;
}

/** Percentile (1–99) for a z-score on a normal curve. */
export function percentileFromZ(z: number): number {
  return clamp(Math.round(normalCdf(z) * 100), 1, 99);
}

/* ------------------------------------------------------- self-report axes */

export type AxisDetail = {
  dim: string;
  /** 0–100 axis score, identical to `scoreDimensions`. */
  value: number;
  /** Items that contributed. */
  items: number;
  /** 0–100 internal agreement between this axis' items. */
  agreement: number;
  /** ± band for this axis, from item count and agreement. */
  errorBand: number;
  /** Normative percentile assuming a population mean of 50, SD 18. */
  percentile: number;
};

/** Reverse-aligned 0–100 value of one answered item, or null if unanswered. */
function itemPercent(item: Likert, answers: Record<string, number>): number | null {
  const raw = answers[item.id];
  if (raw === undefined) return null;
  const value = item.reverse ? SCALE_MAX - raw : raw;
  return (value / SCALE_MAX) * 100;
}

/**
 * Per-axis detail: score, how much the axis' own items agreed, and the error
 * band that follows from it. More items + tighter agreement = narrower band.
 */
export function axisDetails(
  items: readonly Likert[],
  answers: Record<string, number>,
): AxisDetail[] {
  const buckets = new Map<string, number[]>();
  for (const item of items) {
    const pct = itemPercent(item, answers);
    if (pct === null) continue;
    const bucket = buckets.get(item.dim);
    if (bucket) bucket.push(pct);
    else buckets.set(item.dim, [pct]);
  }

  return [...buckets.entries()].map(([dim, list]) => {
    const value = Math.round(mean(list));
    const spread = sd(list); // 0 (perfect agreement) … ~50 (contradictory)
    const agreement = Math.round(clamp(100 - spread * 2, 0, 100));
    const errorBand = Math.round(
      clamp(spread / Math.sqrt(Math.max(1, list.length)) + 2, 2, 18),
    );
    return {
      dim,
      value,
      items: list.length,
      agreement,
      errorBand,
      percentile: percentileFromZ((value - 50) / 18),
    };
  });
}

/**
 * Session-level measurement confidence.
 *
 * `timingsMs` is optional; when the runner supplies per-item response times we
 * can also detect speeding (tapping without reading).
 */
export function responseQuality(
  items: readonly Likert[],
  answers: Record<string, number>,
  timingsMs?: Record<string, number>,
): QualityReport {
  const total = items.length;
  const answered = items.filter((i) => answers[i.id] !== undefined).length;
  const raw = items
    .map((i) => answers[i.id])
    .filter((v): v is number => v !== undefined);

  const details = axisDetails(items, answers);
  const agreement = details.length ? Math.round(mean(details.map((d) => d.agreement))) : 0;
  const errorBand = details.length
    ? Math.round(mean(details.map((d) => d.errorBand)))
    : 12;

  const flags: QualityFlag[] = [];
  const notes: string[] = [];
  let score = 100;

  // 1. Completeness.
  if (answered < total) {
    const share = total ? answered / total : 0;
    flags.push("incomplete");
    notes.push(`${answered} of ${total} items answered — unanswered items are excluded.`);
    score -= Math.round((1 - share) * 45);
  }

  // 2. Straight-lining: one option chosen for nearly everything.
  if (raw.length >= 6) {
    const counts = new Map<number, number>();
    for (const v of raw) counts.set(v, (counts.get(v) ?? 0) + 1);
    const topShare = Math.max(...counts.values()) / raw.length;
    if (topShare >= 0.8) {
      flags.push("straight-lining");
      notes.push("Nearly every answer used the same option, which flattens the profile.");
      score -= 30;
    } else if (topShare >= 0.62) {
      score -= 10;
    }
  }

  // 3. Extreme responding: only the two ends of the scale.
  if (raw.length >= 8) {
    const extreme = raw.filter((v) => v === 0 || v === SCALE_MAX).length / raw.length;
    if (extreme >= 0.85) {
      flags.push("extreme-style");
      notes.push("Answers sat at the extremes, so bands read higher than they measure.");
      score -= 12;
    }
  }

  // 4. Internal inconsistency: items on the same axis disagreed.
  if (agreement < 55 && answered >= total * 0.6) {
    flags.push("inconsistent");
    notes.push("Items on the same axis pulled in opposite directions — read bands as ranges.");
    score -= 18;
  } else if (agreement < 70) {
    score -= 6;
  }

  // 5. Speeding: median response faster than a human can read the statement.
  if (timingsMs) {
    const times = items
      .map((i) => timingsMs[i.id])
      .filter((v): v is number => typeof v === "number" && v > 0)
      .sort((a, b) => a - b);
    if (times.length >= 6) {
      const median = times[Math.floor(times.length / 2)]!;
      const rushed = times.filter((t) => t < 900).length / times.length;
      if (median < 1100 || rushed >= 0.5) {
        flags.push("speeding");
        notes.push("Most answers came in under a second — too fast to have read the item.");
        score -= 25;
      } else if (median < 1700) {
        score -= 8;
      }
    }
  }

  score = clamp(Math.round(score), 5, 100);
  const label: Confidence = score >= 80 ? "High" : score >= 55 ? "Moderate" : "Low";

  if (!flags.length) {
    notes.push("Answer pattern looks considered and internally consistent.");
  }

  return { score, label, flags, notes, answered, total, errorBand, agreement };
}

/* ------------------------------------------------------------------- IQ */

/** Harder items carry more information about ability. */
const TIER_WEIGHT: Record<1 | 2 | 3, number> = { 1: 1, 2: 1.35, 3: 1.8 };

export type IqEstimate = {
  /** Deviation IQ, mean 100 / SD 15. */
  iq: number;
  /** Standard error of measurement in IQ points. */
  sem: number;
  /** 68% confidence interval. */
  low: number;
  high: number;
  percentile: number;
  /** Difficulty-weighted accuracy, 0–100. */
  weighted: number;
  correct: number;
  answered: number;
  total: number;
  /** Accuracy per difficulty tier, 0–100 (null = tier not drawn). */
  tiers: { tier: 1 | 2 | 3; value: number | null }[];
  quality: { score: number; label: Confidence; flags: QualityFlag[]; notes: string[] };
};

/**
 * Difficulty-weighted ability estimate.
 *
 * A raw hit-rate treats a tier-1 warm-up and a tier-3 sequence as equal, which
 * inflates low scorers and compresses high ones. Weighting by tier, then
 * mapping onto the conventional mean-100 / SD-15 metric, keeps the estimate
 * honest — and reports it as an interval, because a 20-item screener cannot
 * resolve a single point.
 */
export function iqEstimate(
  items: readonly IqItem[],
  hits: Record<string, boolean>,
  opts?: { timingsMs?: Record<string, number>; answeredIds?: readonly string[] },
): IqEstimate {
  const total = items.length;
  const answered = opts?.answeredIds
    ? items.filter((i) => opts.answeredIds!.includes(i.id)).length
    : items.filter((i) => hits[i.id] !== undefined).length || total;
  const correct = items.filter((i) => hits[i.id]).length;

  let gained = 0;
  let possible = 0;
  for (const item of items) {
    const w = TIER_WEIGHT[item.tier];
    possible += w;
    if (hits[item.id]) gained += w;
  }
  const weightedRatio = possible ? gained / possible : 0;

  // Reference distribution for this screener: an average adult clears about
  // half of the weighted pool, with ~0.21 spread per SD.
  const z = clamp((weightedRatio - 0.5) / 0.21, -2.6, 2.9);
  const iq = clamp(Math.round(100 + z * 15), 62, 145);

  // Reliability grows with item count; SEM = SD * sqrt(1 - reliability).
  const reliability = clamp(total / (total + 7), 0.4, 0.95);
  const sem = Math.max(3, Math.round(15 * Math.sqrt(1 - reliability)));

  const tiers = ([1, 2, 3] as const).map((tier) => {
    const pool = items.filter((i) => i.tier === tier);
    return {
      tier,
      value: pool.length
        ? Math.round((pool.filter((i) => hits[i.id]).length / pool.length) * 100)
        : null,
    };
  });

  const flags: QualityFlag[] = [];
  const notes: string[] = [];
  let score = 100;

  if (answered < total) {
    flags.push("incomplete");
    notes.push(`${total - answered} item(s) timed out and counted as incorrect.`);
    score -= Math.round(((total - answered) / Math.max(1, total)) * 40);
  }

  if (opts?.timingsMs) {
    const times = items
      .map((i) => opts.timingsMs![i.id])
      .filter((v): v is number => typeof v === "number" && v > 0)
      .sort((a, b) => a - b);
    if (times.length >= 6) {
      const median = times[Math.floor(times.length / 2)]!;
      if (median < 1200) {
        flags.push("speeding");
        notes.push("Answers arrived faster than the items can be solved — treat as a floor.");
        score -= 22;
      }
    }
  }

  // A tier-3 rate far above tier-1 usually means the easy items were rushed.
  const t1 = tiers[0]?.value;
  const t3 = tiers[2]?.value;
  if (typeof t1 === "number" && typeof t3 === "number" && t3 - t1 > 35) {
    flags.push("inconsistent");
    notes.push("Hard items beat easy ones — the easy block was likely answered carelessly.");
    score -= 15;
  }

  score = clamp(Math.round(score), 5, 100);
  if (!flags.length) notes.push("Timing and accuracy pattern is internally consistent.");

  return {
    iq,
    sem,
    low: clamp(iq - sem, 55, 150),
    high: clamp(iq + sem, 60, 155),
    percentile: percentileFromZ((iq - 100) / 15),
    weighted: Math.round(weightedRatio * 100),
    correct,
    answered,
    total,
    tiers,
    quality: {
      score,
      label: score >= 80 ? "High" : score >= 55 ? "Moderate" : "Low",
      flags,
      notes,
    },
  };
}
