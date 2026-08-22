/**
 * Dependency-free SVG radar chart. Pure presentation — no animation library,
 * no runtime cost beyond a handful of polygon points.
 */
export function RadarChart({
  data,
  size = 300,
  accent = "var(--tool-accent, var(--primary))",
}: {
  data: { dim: string; value: number }[];
  size?: number;
  accent?: string;
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

      <polygon points={shape} fill={accent} fillOpacity={0.22} stroke={accent} strokeWidth={2} />
      {data.map((d, i) => {
        const [x, y] = point(i, Math.max(0.06, d.value / 100));
        return <circle key={d.dim} cx={x} cy={y} r={3.5} fill={accent} />;
      })}

      {data.map((d, i) => {
        const [x, y] = point(i, 1.24);
        return (
          <text
            key={d.dim}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground font-mono text-[9px] tracking-wide uppercase"
          >
            {d.dim}
          </text>
        );
      })}
    </svg>
  );
}
