import { CheckCircle2, Info, ShieldAlert } from "lucide-react";

import type { Confidence, QualityFlag } from "@/lib/psychometrics";

const FLAG_LABEL: Record<QualityFlag, string> = {
  incomplete: "Incomplete set",
  speeding: "Answered too fast",
  "straight-lining": "Same option repeated",
  "extreme-style": "Only extremes used",
  inconsistent: "Mixed signals",
};

/**
 * Measurement-confidence strip shown above every result. It is the honest part
 * of the report: how much the score can be trusted, the ± band, and what (if
 * anything) in the answer pattern weakened it.
 */
export function QualityBadge({
  score,
  label,
  flags,
  notes,
  errorBand,
  answered,
  total,
  className = "",
}: {
  score: number;
  label: Confidence;
  flags: readonly QualityFlag[];
  notes: readonly string[];
  errorBand?: number;
  answered: number;
  total: number;
  className?: string;
}) {
  const Icon = label === "High" ? CheckCircle2 : label === "Moderate" ? Info : ShieldAlert;
  const tone =
    label === "High"
      ? "text-primary"
      : label === "Moderate"
        ? "text-foreground/85"
        : "text-destructive";

  return (
    <section
      className={`rounded-2xl border border-hairline bg-void-2/45 p-4 sm:p-5 ${className}`}
      aria-label="Measurement confidence"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="label-mono">Measurement confidence</span>
        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${tone}`}>
          <Icon className="size-4" aria-hidden="true" />
          {label} · {score}/100
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {answered}/{total} items
          {typeof errorBand === "number" ? ` · ±${errorBand} pts` : ""}
        </span>
      </div>

      {flags.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {flags.map((flag) => (
            <li
              key={flag}
              className="capsule label-mono px-2.5 py-1 text-destructive/90"
            >
              {FLAG_LABEL[flag]}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
