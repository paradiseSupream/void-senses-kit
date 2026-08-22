import { Award, Download, Share2 } from "lucide-react";

const AXES = [
  { label: "Trust", value: 0.82 },
  { label: "Spark", value: 0.64 },
  { label: "Calm", value: 0.48 },
  { label: "Banter", value: 0.9 },
  { label: "Depth", value: 0.7 },
  { label: "Drive", value: 0.58 },
];

const SIZE = 200;
const C = SIZE / 2;
const R = SIZE / 2 - 22;

function point(i: number, radius: number) {
  const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
  return [C + Math.cos(angle) * radius, C + Math.sin(angle) * radius] as const;
}

/**
 * A non-interactive preview of what a finished report looks like.
 * Shown on the home page so visitors see the payoff before starting.
 */
export function SampleResult() {
  const ring = (f: number) =>
    AXES.map((_, i) => point(i, R * f).join(","))
      .join(" ");
  const shape = AXES.map((a, i) => point(i, R * a.value).join(",")).join(" ");

  return (
    <div className="panel overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="label-mono">Sample report</span>
          <p className="mt-1 truncate font-display text-base font-semibold">
            “The Vigilant Builder”
          </p>
        </div>
        <span className="accent-tile size-10 shrink-0">
          <Award className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mx-auto w-40 sm:w-full"
          role="img"
          aria-label="Example radar chart with six scored dimensions"
        >
          {[0.35, 0.7, 1].map((f) => (
            <polygon
              key={f}
              points={ring(f)}
              fill="none"
              stroke="var(--hairline)"
              strokeWidth="1"
            />
          ))}
          <polygon
            points={shape}
            fill="color-mix(in oklab, var(--primary) 24%, transparent)"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {AXES.map((a, i) => {
            const [x, y] = point(i, R * a.value);
            return <circle key={a.label} cx={x} cy={y} r="2.5" fill="var(--primary)" />;
          })}
        </svg>

        <ul className="space-y-2">
          {AXES.slice(0, 4).map((a) => (
            <li key={a.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{a.label}</span>
                <span className="font-mono text-foreground/80">{Math.round(a.value * 100)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${a.value * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
        <span className="label-mono inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1">
          <Download className="size-3" aria-hidden="true" /> HD card
        </span>
        <span className="label-mono inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1">
          <Share2 className="size-3" aria-hidden="true" /> One-tap share
        </span>
        <span className="label-mono inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-primary">
          Free to use
        </span>
      </div>
    </div>
  );
}
