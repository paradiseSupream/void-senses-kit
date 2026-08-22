import { bandOf } from "@/lib/quiz-engine";

/** Ranked 0–100 dimension bars with a band label — used on every result page. */
export function TraitBars({
  data,
  notes,
}: {
  data: { dim: string; value: number }[];
  notes?: Record<string, string>;
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
    </ul>
  );
}
