import { useEffect, useMemo, useRef, useState } from "react";

import {
  contributeNorms,
  fetchNorms,
  isLive,
  normPercentile,
  type NormTable,
} from "@/lib/norms";

/**
 * Live normative comparison for one tool.
 *
 * Reads the accumulated anonymous distribution once, contributes this session's
 * axis values exactly once when the result appears, and hands back a percentile
 * per axis. Everything degrades to the reference curve if the network fails, so
 * a result never waits on it.
 */
export function useNorms(
  tool: string,
  scores: readonly { dim: string; value: number }[],
  ready: boolean,
) {
  const [table, setTable] = useState<NormTable>({});
  const sentRef = useRef(false);

  useEffect(() => {
    let alive = true;
    void fetchNorms(tool).then((t) => {
      if (alive) setTable(t);
    });
    return () => {
      alive = false;
    };
  }, [tool]);

  useEffect(() => {
    if (!ready || sentRef.current || !scores.length) return;
    sentRef.current = true;
    void contributeNorms(tool, scores);
  }, [ready, scores, tool]);

  const percentiles = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of scores) out[s.dim] = normPercentile(s.value, table[s.dim]);
    return out;
  }, [scores, table]);

  const live = useMemo(
    () => scores.some((s) => isLive(table[s.dim])),
    [scores, table],
  );

  const sampleSize = useMemo(
    () => Math.min(...scores.map((s) => table[s.dim]?.n ?? 0), Infinity),
    [scores, table],
  );

  return { percentiles, live, sampleSize: Number.isFinite(sampleSize) ? sampleSize : 0 };
}
