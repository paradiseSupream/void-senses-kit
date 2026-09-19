/**
 * Programmatic SEO data for per-score IQ meaning pages (/iq-score/$score).
 *
 * Uses the standard IQ convention (mean 100, SD 15) — the same convention
 * documented by Mensa, Wechsler and Stanford-Binet. Every number shown on
 * these pages is derived from the normal distribution, never invented.
 */

import { percentileFromZ } from "@/lib/psychometrics";

export const IQ_MEAN = 100;
export const IQ_SD = 15;

/** Pages generated for scores in this inclusive range. */
export const IQ_SCORE_MIN = 70;
export const IQ_SCORE_MAX = 145;

export const IQ_SCORE_PATHS: string[] = [];
for (let s = IQ_SCORE_MIN; s <= IQ_SCORE_MAX; s++) {
  IQ_SCORE_PATHS.push(`/iq-score/${s}`);
}

export type IqBand = {
  label: string;
  description: string;
};

export function iqBand(score: number): IqBand {
  if (score < 80)
    return {
      label: "Below average",
      description:
        "Scores in this range are less common. A short online test can only estimate, and everyday problem-solving depends on much more than one number.",
    };
  if (score < 90)
    return {
      label: "Low average",
      description:
        "Within the normal range. Roughly a quarter of people score here — it indicates solid everyday reasoning with room to sharpen pattern recognition.",
    };
  if (score < 110)
    return {
      label: "Average",
      description:
        "The center of the distribution. About half of all people score between 90 and 110 on standardized tests.",
    };
  if (score < 120)
    return {
      label: "High average",
      description:
        "Above the midpoint. This range is associated with faster pattern recognition and abstract reasoning than most test-takers.",
    };
  if (score < 130)
    return {
      label: "Superior",
      description:
        "Clearly above average. People in this band typically pick up complex systems quickly and solve novel problems with less effort.",
    };
  return {
    label: "Very superior",
    description:
      "A rare range. Scores here sit in the top few percent of the population and are often associated with giftedness classifications.",
  };
}

/** Population percentile for a score under the standard mean-100/SD-15 curve. */
export function iqPercentile(score: number): number {
  return percentileFromZ((score - IQ_MEAN) / IQ_SD);
}

/** "1 in N people score this high or higher" (minimum N = 2 for sane copy). */
export function iqRarity(score: number): number {
  const top = Math.max(1 - iqPercentile(score) / 100, 0.001);
  return Math.max(2, Math.round(1 / top));
}

/** Neighboring scores for internal linking. */
export function iqNeighbors(score: number): number[] {
  const out: number[] = [];
  for (const delta of [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]) {
    const s = score + delta;
    if (s >= IQ_SCORE_MIN && s <= IQ_SCORE_MAX) out.push(s);
  }
  return out;
}
