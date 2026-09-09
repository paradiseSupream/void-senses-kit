import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  BrainCircuit,
  Fingerprint,
  Gauge,
  HeartHandshake,
  ScanLine,
  ShieldAlert,
  Swords,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ResultVariant =
  | "certificate"
  | "impact-map"
  | "shadow-sigil"
  | "resonance"
  | "alert-radar"
  | "memory-console"
  | "logic-trace"
  | "friend-fingerprint"
  | "duel-field"
  | "choice-spectrum";

export type ResultMetric = {
  label: string;
  value: number;
  note?: string;
};

type ResultExperienceProps = {
  variant: ResultVariant;
  eyebrow: string;
  title: string;
  score?: string | number;
  scoreSuffix?: string;
  status?: string;
  description: string;
  metrics: ResultMetric[];
  meta?: string[];
  children?: ReactNode;
  className?: string;
};

const VARIANT_COPY: Record<ResultVariant, { code: string; label: string }> = {
  certificate: { code: "COG-CERT", label: "Performance certificate" },
  "impact-map": { code: "PATTERN-MAP", label: "Reflection profile" },
  "shadow-sigil": { code: "ARCHETYPE", label: "Shadow signature" },
  resonance: { code: "PAIR-SYNC", label: "Resonance field" },
  "alert-radar": { code: "RF-SCAN", label: "Behaviour scan" },
  "memory-console": { code: "MEM-SPAN", label: "Recall telemetry" },
  "logic-trace": { code: "LOGIC-60", label: "Reasoning trace" },
  "friend-fingerprint": { code: "KNOW-ME", label: "Knowledge print" },
  "duel-field": { code: "DUEL-MATCH", label: "Two-player field" },
  "choice-spectrum": { code: "CHOICE-ID", label: "Decision spectrum" },
};

const ICONS = {
  certificate: BrainCircuit,
  "impact-map": Waves,
  "shadow-sigil": Fingerprint,
  resonance: HeartHandshake,
  "alert-radar": ShieldAlert,
  "memory-console": Activity,
  "logic-trace": Gauge,
  "friend-fingerprint": Fingerprint,
  "duel-field": Swords,
  "choice-spectrum": ScanLine,
} satisfies Record<ResultVariant, typeof Activity>;

function points(metrics: ResultMetric[], radius = 72, cx = 100, cy = 100) {
  const total = Math.max(3, metrics.length);
  return metrics
    .map((metric, index) => {
      const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
      const scaled = Math.max(0.12, Math.min(1, metric.value / 100));
      return `${cx + Math.cos(angle) * radius * scaled},${cy + Math.sin(angle) * radius * scaled}`;
    })
    .join(" ");
}

function ResultVisual({ variant, metrics }: { variant: ResultVariant; metrics: ResultMetric[] }) {
  const safe = metrics.length ? metrics : [{ label: "Score", value: 0 }];
  const top = [...safe].sort((a, b) => b.value - a.value)[0];

  if (variant === "certificate") {
    const value = Math.max(0, Math.min(100, top?.value ?? 0));
    return (
      <div className="result-certificate" aria-hidden="true">
        <svg viewBox="0 0 240 132" className="w-full">
          <path d="M24 108 A96 96 0 0 1 216 108" className="result-track" pathLength="100" />
          <path
            d="M24 108 A96 96 0 0 1 216 108"
            className="result-signal result-draw"
            pathLength="100"
            strokeDasharray={`${value} 100`}
          />
          {[0, 1, 2, 3, 4].map((tick) => (
            <line key={tick} x1={38 + tick * 41} y1="105" x2={38 + tick * 41} y2="111" className="result-grid-line" />
          ))}
        </svg>
        <span className="result-watermark">VERIFIED RANGE</span>
      </div>
    );
  }

  if (variant === "resonance") {
    const value = Math.max(8, Math.min(100, top?.value ?? 0));
    return (
      <div className="result-rings" aria-hidden="true">
        <span className="result-ring result-ring-a" />
        <span className="result-ring result-ring-b" />
        <span className="result-ring-core" style={{ opacity: 0.35 + value / 180 }} />
        <span className="result-watermark">SYNC {value}%</span>
      </div>
    );
  }

  if (variant === "memory-console") {
    return (
      <div className="result-memory-grid" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => {
          const metric = safe[index % safe.length];
          const active = (metric?.value ?? 0) >= ((index % 4) + 1) * 20;
          return <span key={index} className={active ? "is-active" : undefined} />;
        })}
      </div>
    );
  }

  if (variant === "logic-trace") {
    const values = safe.slice(0, 4).map((metric) => Math.max(12, Math.min(88, metric.value)));
    return (
      <div className="result-trace" aria-hidden="true">
        <svg viewBox="0 0 300 130" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0 104H300M0 68H300M0 32H300" className="result-grid-line" />
          <polyline
            points={values.map((value, index) => `${18 + index * (264 / Math.max(1, values.length - 1))},${118 - value}`).join(" ")}
            className="result-signal result-draw"
          />
          {values.map((value, index) => (
            <circle key={index} cx={18 + index * (264 / Math.max(1, values.length - 1))} cy={118 - value} r="4" className="result-node" />
          ))}
        </svg>
      </div>
    );
  }

  if (variant === "friend-fingerprint") {
    return (
      <div className="result-fingerprint" aria-hidden="true">
        {[42, 34, 26, 18].map((size, index) => (
          <span key={size} style={{ width: `${size * 2}px`, height: `${size * 2.3}px`, opacity: 0.3 + index * 0.16 }} />
        ))}
        <span className="result-watermark">MATCH PRINT</span>
      </div>
    );
  }

  if (variant === "duel-field") {
    return (
      <div className="result-duel" aria-hidden="true">
        <span className="result-duel-side">01</span>
        <span className="result-duel-core"><Swords /></span>
        <span className="result-duel-side">02</span>
      </div>
    );
  }

  if (variant === "choice-spectrum") {
    return (
      <div className="result-spectrum" aria-hidden="true">
        {safe.slice(0, 4).map((metric) => (
          <span key={metric.label}>
            <i style={{ width: `${Math.max(6, metric.value)}%` }} />
            <b style={{ width: `${Math.max(6, 100 - metric.value)}%` }} />
          </span>
        ))}
      </div>
    );
  }

  if (variant === "impact-map") {
    return (
      <div className="result-impact" aria-hidden="true">
        {safe.slice(0, 6).map((metric) => (
          <span key={metric.label}>
            <i style={{ width: `${Math.max(4, metric.value)}%` }} />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("result-radar-stage", variant === "shadow-sigil" && "is-sigil")} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="size-full">
        {[30, 52, 74].map((radius) => (
          <circle key={radius} cx="100" cy="100" r={radius} className="result-grid-line" />
        ))}
        {safe.map((metric, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(3, safe.length) - Math.PI / 2;
          return (
            <line
              key={metric.label}
              x1="100"
              y1="100"
              x2={100 + Math.cos(angle) * 74}
              y2={100 + Math.sin(angle) * 74}
              className="result-grid-line"
            />
          );
        })}
        <polygon points={points(safe)} className="result-signal-fill result-draw" />
      </svg>
      <span className="result-watermark">{variant === "shadow-sigil" ? "SIGNATURE" : "LIVE SCAN"}</span>
    </div>
  );
}

export function ResultExperience({
  variant,
  eyebrow,
  title,
  score,
  scoreSuffix,
  status,
  description,
  metrics,
  meta = [],
  children,
  className,
}: ResultExperienceProps) {
  const [selected, setSelected] = useState(metrics[0]?.label ?? "");
  const active = useMemo(
    () => metrics.find((metric) => metric.label === selected) ?? metrics[0],
    [metrics, selected],
  );
  const Icon = ICONS[variant];
  const copy = VARIANT_COPY[variant];

  return (
    <section className={cn("result-experience reveal", `result-${variant}`, className)}>
      <div className="result-scanline" aria-hidden="true" />
      <header className="result-heading">
        <div className="min-w-0">
          <span className="result-code">{copy.code} // {eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <span className="result-status">
          <Icon aria-hidden="true" /> {status ?? copy.label}
        </span>
      </header>

      <div className="result-score-row">
        {score !== undefined ? (
          <p className="result-primary-score">
            {score}<small>{scoreSuffix}</small>
          </p>
        ) : null}
        <p>{description}</p>
      </div>

      {meta.length ? (
        <ul className="result-meta">
          {meta.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}

      <div className="result-visual">
        <div className="result-visual-label">
          <span>LIVE READOUT</span><span>{String(metrics.length).padStart(2, "0")} SIGNALS</span>
        </div>
        <ResultVisual variant={variant} metrics={metrics} />
      </div>

      {metrics.length ? (
        <div className="result-metrics" aria-label="Result dimensions">
          <div className="result-metric-tabs" role="tablist" aria-label="Choose a result dimension">
            {metrics.map((metric) => (
              <Button
                key={metric.label}
                type="button"
                variant="ghost"
                role="tab"
                aria-selected={active?.label === metric.label}
                onClick={() => setSelected(metric.label)}
                className="result-metric-tab"
              >
                <span>{metric.label}</span><strong>{Math.round(metric.value)}</strong>
              </Button>
            ))}
          </div>
          {active ? (
            <div className="result-metric-readout" role="tabpanel">
              <div>
                <span>{active.label}</span>
                <strong>{Math.round(active.value)}<small>/100</small></strong>
              </div>
              <p>{active.note ?? `This signal contributes to your ${copy.label.toLowerCase()} and can shift between attempts.`}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {children ? <div className="result-evidence">{children}</div> : null}
    </section>
  );
}