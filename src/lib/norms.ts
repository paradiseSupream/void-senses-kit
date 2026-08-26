/**
 * Live norms.
 *
 * A percentile is only meaningful against a real distribution. Until this
 * project has one, every axis is scored against a textbook curve (mean 50,
 * SD 18). This module builds the real one: each completed session contributes
 * anonymous axis values (a tool name, an axis name, a 0–100 integer — nothing
 * identifying, nothing that can be joined back to a person), and results are
 * scored against the accumulated distribution once it is large enough.
 *
 * Small samples are noisy, so the observed mean/SD is shrunk toward the
 * textbook prior until enough sessions exist for the real numbers to dominate.
 */

import { supabase } from "@/integrations/supabase/client";
import { percentileFromZ } from "@/lib/psychometrics";

export type NormStat = { dim: string; n: number; mean: number; sd: number };
export type NormTable = Record<string, NormStat>;

/** Prior used before a tool has its own distribution. */
export const PRIOR_MEAN = 50;
export const PRIOR_SD = 18;
/** Sessions at which the observed distribution fully outweighs the prior. */
const SHRINK_K = 300;
/** Below this, the live table is ignored entirely. */
const MIN_N = 40;

export function isLive(stat: NormStat | undefined): stat is NormStat {
  return !!stat && stat.n >= MIN_N;
}

/** Shrink observed mean/SD toward the prior in proportion to sample size. */
export function blend(stat: NormStat | undefined): { mean: number; sd: number; weight: number } {
  if (!isLive(stat)) return { mean: PRIOR_MEAN, sd: PRIOR_SD, weight: 0 };
  const w = stat.n / (stat.n + SHRINK_K);
  const sd = stat.sd > 3 ? stat.sd : PRIOR_SD;
  return {
    mean: PRIOR_MEAN * (1 - w) + stat.mean * w,
    sd: PRIOR_SD * (1 - w) + sd * w,
    weight: w,
  };
}

/** Percentile of `value` against the live table, falling back to the prior. */
export function normPercentile(value: number, stat: NormStat | undefined): number {
  const { mean, sd } = blend(stat);
  return percentileFromZ((value - mean) / (sd || PRIOR_SD));
}

/** Read the aggregated distribution for one tool. Never throws. */
export async function fetchNorms(tool: string): Promise<NormTable> {
  try {
    const { data, error } = await supabase.rpc("norm_stats", { _tool: tool });
    if (error || !Array.isArray(data)) return {};
    const table: NormTable = {};
    for (const row of data as { dim: string; n: number; mean: number; sd: number }[]) {
      table[row.dim] = {
        dim: row.dim,
        n: Number(row.n) || 0,
        mean: Number(row.mean) || PRIOR_MEAN,
        sd: Number(row.sd) || PRIOR_SD,
      };
    }
    return table;
  } catch {
    return {};
  }
}

/**
 * Contribute one completed session to the distribution. Fire-and-forget:
 * a failure here must never affect the result the user is reading.
 */
export async function contributeNorms(
  tool: string,
  scores: readonly { dim: string; value: number }[],
): Promise<void> {
  const rows = scores
    .filter((s) => Number.isFinite(s.value))
    .map((s) => ({
      tool,
      dim: s.dim,
      value: Math.max(0, Math.min(100, Math.round(s.value))),
    }));
  if (!rows.length) return;
  try {
    await supabase.from("norm_samples").insert(rows);
  } catch {
    /* anonymous telemetry only — silence is correct here */
  }
}
