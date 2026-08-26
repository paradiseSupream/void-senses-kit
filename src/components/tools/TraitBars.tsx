import { bandOf } from "@/lib/quiz-engine";

/** Ranked 0–100 dimension bars with a band label — used on every result page. */
export function TraitBars({
  data,
  notes,
  percentiles,
  liveNorms,
}: {
  data: { dim: string; value: number }[];
  notes?: Record<string, string>;
  /** Percentile per dimension, when a normative comparison is available. */
  percentiles?: Record<string, number>;
  /** True once the percentiles come from this site's own score pool. */
  liveNorms?: boolean;
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <ul className="space-y-4">
      {sorted.map((item) => (
        <li key={item.dim}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{item.dim}</span>
            <span className="label-mono shrink-0">
              {bandOf(item.value)} · {item.value}
              {typeof percentiles?.[item.dim] === "number"
                ? ` · ${percentiles[item.dim]}th pct`
                : ""}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{
                width: `${item.value}%`,
                background:
                  "linear-gradient(90deg, var(--tool-accent, var(--primary)), var(--secondary))",
              }}
            />
          </div>
          {notes?.[item.dim] ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{notes[item.dim]}</p>
          ) : null}
        </li>
      ))}
      {percentiles ? (
        <li className="pt-1 font-mono text-[11px] text-muted-foreground">
          {liveNorms
            ? "Percentiles compared against this site's own anonymous score pool."
            : "Percentiles compared against a standard reference curve until the live pool is large enough."}
        </li>
      ) : null}
    </ul>
  );
}
