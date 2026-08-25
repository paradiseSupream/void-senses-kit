/**
 * Dependency-free SVG radar chart. Pure presentation — no animation library,
 * no runtime cost beyond a handful of polygon points.
 */
export function RadarChart({
  data,
  size = 300,
  accent = "var(--tool-accent, var(--primary))",
  labels,
  selected,
  onSelect,
}: {
  data: { dim: string; value: number }[];
  size?: number;
  accent?: string;
  /** Optional short axis labels, e.g. { Machiavellianism: "MACH" }. */
  labels?: Record<string, string>;
  selected?: string | null;
  /** When provided, points and labels become buttons that expand a breakdown. */
  onSelect?: (dim: string) => void;
}) {
  const n = data.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 42;

  const point = (i: number, ratio: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(angle) * r * ratio, cy + Math.sin(angle) * r * ratio] as const;
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const shape = data
    .map((d, i) => point(i, Math.max(0.06, d.value / 100)).join(","))
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-[320px]"
      role="img"
      aria-label={data.map((d) => `${d.dim} ${d.value} out of 100`).join(", ")}
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={data.map((_, i) => point(i, ring).join(",")).join(" ")}
          fill="none"
          stroke="currentColor"
          className="text-border/60"
          strokeWidth={1}
        />
      ))}
      {data.map((d, i) => {
        const [x, y] = point(i, 1);
        return (
          <line
            key={d.dim}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="currentColor"
            className="text-border/50"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={shape}
        fill={accent}
        fillOpacity={0.2}
        stroke={accent}
        strokeWidth={2}
        strokeLinejoin="round"
        className="radar-draw"
        style={{ filter: "drop-shadow(0 0 10px color-mix(in oklab, var(--primary) 45%, transparent))" }}
      />
      {data.map((d, i) => {
        const [x, y] = point(i, Math.max(0.06, d.value / 100));
        const active = selected === d.dim;
        return (
          <circle
            key={d.dim}
            cx={x}
            cy={y}
            r={active ? 6 : 3.5}
            fill={accent}
            stroke={active ? "currentColor" : "none"}
            className={active ? "text-foreground" : undefined}
            strokeWidth={active ? 1.5 : 0}
          />
        );
      })}

      {data.map((d, i) => {
        const [x, y] = point(i, 1.24);
        const label = labels?.[d.dim] ?? d.dim;
        const active = selected === d.dim;
        const text = (
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-mono text-[9px] tracking-wide uppercase ${
              active ? "fill-primary" : "fill-muted-foreground"
            }`}
          >
            {label}
          </text>
        );
        if (!onSelect) return <g key={d.dim}>{text}</g>;
        const [px, py] = point(i, Math.max(0.06, d.value / 100));
        return (
          <g
            key={d.dim}
            role="button"
            tabIndex={0}
            aria-label={`${d.dim} ${d.value} out of 100 — open breakdown`}
            className="cursor-pointer"
            onClick={() => onSelect(d.dim)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(d.dim);
            }}
          >
            <circle cx={px} cy={py} r={14} fill="transparent" />
            <circle cx={x} cy={y} r={16} fill="transparent" />
            {text}
          </g>
        );
      })}
    </svg>
  );
}
