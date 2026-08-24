import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getMonetizationStats, type StatsResult } from "@/lib/analytics.functions";
import type { Cohort } from "@/lib/analytics-agg";

const pct = (v: number) => `${v.toFixed(2)}%`;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-hairline px-4 py-3">
        <h2 className="font-display text-sm font-semibold">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

type SortKey = "vipRate" | "rpv" | "sessions" | "completionRate";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "vipRate", label: "VIP rate" },
  { key: "rpv", label: "Revenue / visitor" },
  { key: "completionRate", label: "Completion" },
  { key: "sessions", label: "Sessions" },
];

function CohortTable({
  rows,
  label,
  minSessions,
  sort,
}: {
  rows: Cohort[];
  label: string;
  minSessions: number;
  sort: SortKey;
}) {
  const filtered = useMemo(
    () => [...rows].filter((r) => r.sessions >= minSessions).sort((a, b) => b[sort] - a[sort]),
    [rows, minSessions, sort],
  );
  const best = filtered[0];

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No segment reached {minSessions} sessions yet — lower the threshold or wait for more traffic.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="label-mono text-left text-muted-foreground">
            <th className="py-2 pr-3 font-normal">{label}</th>
            <th className="py-2 pr-3 font-normal">Sessions</th>
            <th className="py-2 pr-3 font-normal">Bounce</th>
            <th className="py-2 pr-3 font-normal">Start</th>
            <th className="py-2 pr-3 font-normal">Complete</th>
            <th className="py-2 pr-3 font-normal">VIPs</th>
            <th className="py-2 pr-3 font-normal">VIP rate</th>
            <th className="py-2 pr-3 font-normal">Ad rev.</th>
            <th className="py-2 font-normal">RPV</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr
              key={row.key}
              className={`border-t border-hairline/60 ${row === best ? "bg-primary/5" : ""}`}
            >
              <td className="py-2 pr-3 font-mono text-xs">
                {row.key}
                {row === best ? (
                  <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                    winner
                  </span>
                ) : null}
              </td>
              <td className="py-2 pr-3">{row.sessions}</td>
              <td className="py-2 pr-3">{pct(row.bounceRate)}</td>
              <td className="py-2 pr-3">{pct(row.startRate)}</td>
              <td className="py-2 pr-3">{pct(row.completionRate)}</td>
              <td className="py-2 pr-3">{row.vips}</td>
              <td className="py-2 pr-3 font-medium text-foreground">{pct(row.vipRate)}</td>
              <td className="py-2 pr-3">{money(row.revenueCents)}</td>
              <td className="py-2">${row.rpv.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Creative x tool A/B testing dashboard: which ad + tool converts VIP best. */
export function AbTestsTab({ token }: { token: string }) {
  const fetchStats = useServerFn(getMonetizationStats);
  const [days, setDays] = useState(7);
  const [minSessions, setMinSessions] = useState(5);
  const [sort, setSort] = useState<SortKey>("vipRate");
  const [data, setData] = useState<StatsResult | null>(null);

  const mutation = useMutation({
    mutationFn: (input: { token: string; days: number }) => fetchStats({ data: input }),
    onSuccess: setData,
    onError: () => toast.error("Could not load A/B data — sign in again."),
  });

  useEffect(() => {
    mutation.mutate({ token, days });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, days]);

  const stats = data?.stats;
  const chartRows = useMemo(
    () =>
      (stats?.creativeTool ?? [])
        .filter((r) => r.sessions >= minSessions)
        .sort((a, b) => b.vipRate - a.vipRate)
        .slice(0, 8)
        .map((r) => ({
          name: r.key,
          vipRate: Number(r.vipRate.toFixed(2)),
          completion: Number(r.completionRate.toFixed(2)),
        })),
    [stats, minSessions],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[1, 7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              days === d ? "border-primary/50 bg-primary/10" : "border-hairline text-muted-foreground"
            }`}
          >
            {d === 1 ? "24h" : `${d}d`}
          </button>
        ))}
        <span className="ml-2 label-mono">min sessions</span>
        {[1, 5, 20, 50].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setMinSessions(n)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs ${
              minSessions === n
                ? "border-primary/50 bg-primary/10"
                : "border-hairline text-muted-foreground"
            }`}
          >
            {n}
          </button>
        ))}
        <span className="ml-2 label-mono">sort by</span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSort(s.key)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs ${
              sort === s.key
                ? "border-primary/50 bg-primary/10"
                : "border-hairline text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
        {mutation.isPending ? <span className="label-mono">loading…</span> : null}
      </div>

      {stats ? (
        <>
          <Panel
            title="VIP conversion by creative × tool"
            hint="Top 8 segments. Scale the creative with the highest VIP rate, pause the rest."
          >
            {chartRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enough traffic yet.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" unit="%" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="vipRate" name="VIP %" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completion" name="Completion %" fill="var(--color-muted-foreground)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel
            title="Creative × tool matrix"
            hint="Creative = utm_source of the landing click, joined with the tool the visitor opened."
          >
            <CohortTable
              rows={stats.creativeTool}
              label="creative · tool"
              minSessions={minSessions}
              sort={sort}
            />
          </Panel>

          <Panel title="Creative only (utm_source)" hint="Roll-up across every tool.">
            <CohortTable
              rows={stats.cohorts.source}
              label="creative"
              minSessions={minSessions}
              sort={sort}
            />
          </Panel>

          <Panel
            title="Ad placement variants"
            hint="A/B arms of the ad placement experiment, measured on VIP conversion — not just RPM."
          >
            <CohortTable
              rows={stats.placementCohorts}
              label="placement variant"
              minSessions={minSessions}
              sort={sort}
            />
          </Panel>

          <Panel title="Copy experiments" hint="Hero / gate copy arms and their test-start rate.">
            {stats.experiments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No experiment exposures recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {stats.experiments.map((exp) => (
                  <div key={exp.slot}>
                    <p className="label-mono">{exp.slot}</p>
                    <table className="mt-1 w-full text-sm">
                      <tbody>
                        {exp.arms.map((arm) => (
                          <tr key={arm.arm} className="border-t border-hairline/60">
                            <td className="py-2 pr-3 font-mono text-xs">{arm.arm}</td>
                            <td className="py-2 pr-3">{arm.exposures} exposed</td>
                            <td className="py-2 pr-3">{arm.conversions} started</td>
                            <td className="py-2 font-medium">{pct(arm.rate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <p className="text-xs text-muted-foreground">
            Tag every ad with <code className="font-mono">?t=&lt;tool&gt;&amp;utm_source=&lt;creative-id&gt;</code>{" "}
            so each creative shows up as its own row here.
          </p>
        </>
      ) : (
        <p className="label-mono">loading…</p>
      )}
    </div>
  );
}
