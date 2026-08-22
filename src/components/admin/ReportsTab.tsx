import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { adminOverview, type AdminOverview } from "@/lib/admin.functions";
import type { Cohort, SlotStat } from "@/lib/analytics-agg";

const pct = (v: number) => `${v.toFixed(2)}%`;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel overflow-hidden">
      <h2 className="border-b border-hairline px-4 py-3 font-display text-sm font-semibold">
        {title}
      </h2>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatTable({ rows, label }: { rows: SlotStat[]; label: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No data recorded yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="label-mono text-left text-muted-foreground">
            <th className="py-2 pr-3 font-normal">{label}</th>
            <th className="py-2 pr-3 font-normal">Impr.</th>
            <th className="py-2 pr-3 font-normal">Clicks</th>
            <th className="py-2 pr-3 font-normal">CTR</th>
            <th className="py-2 pr-3 font-normal">Conv.</th>
            <th className="py-2 pr-3 font-normal">Revenue</th>
            <th className="py-2 pr-3 font-normal">eCPM</th>
            <th className="py-2 font-normal">RPM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-hairline/60">
              <td className="py-2 pr-3 font-mono text-xs">{row.key}</td>
              <td className="py-2 pr-3">{row.impressions}</td>
              <td className="py-2 pr-3">{row.clicks}</td>
              <td className="py-2 pr-3">{pct(row.ctr)}</td>
              <td className="py-2 pr-3">{row.conversions}</td>
              <td className="py-2 pr-3">{money(row.revenueCents)}</td>
              <td className="py-2 pr-3">${row.ecpm.toFixed(2)}</td>
              <td className="py-2">${row.rpm.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Chart({ rows }: { rows: SlotStat[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows.map((r) => ({ name: r.key, impressions: r.impressions, clicks: r.clicks }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="impressions" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="clicks" fill="var(--color-accent)" radius={[4, 4, 0, 0]}>
            {rows.map((r) => (
              <Cell key={r.key} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Acquisition quality per segment: bounce → start → completion → RPM → VIP. */
function CohortTable({ rows, label }: { rows: Cohort[]; label: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="label-mono text-left text-muted-foreground">
            <th className="py-2 pr-3 font-normal">{label}</th>
            <th className="py-2 pr-3 font-normal">Sessions</th>
            <th className="py-2 pr-3 font-normal">Bounce</th>
            <th className="py-2 pr-3 font-normal">Quiz start</th>
            <th className="py-2 pr-3 font-normal">Completion</th>
            <th className="py-2 pr-3 font-normal">Revenue</th>
            <th className="py-2 pr-3 font-normal">RPM</th>
            <th className="py-2 pr-3 font-normal">RPV</th>
            <th className="py-2 font-normal">VIP conv.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-hairline/60">
              <td className="py-2 pr-3 font-mono text-xs">{row.key}</td>
              <td className="py-2 pr-3">{row.sessions}</td>
              <td className={`py-2 pr-3 ${row.bounceRate > 70 ? "text-destructive" : ""}`}>
                {pct(row.bounceRate)}
              </td>
              <td className="py-2 pr-3">{pct(row.startRate)}</td>
              <td className="py-2 pr-3">{pct(row.completionRate)}</td>
              <td className="py-2 pr-3">{money(row.revenueCents)}</td>
              <td className="py-2 pr-3">${row.rpm.toFixed(2)}</td>
              <td className="py-2 pr-3 font-semibold">${row.rpv.toFixed(4)}</td>
              <td className="py-2">{pct(row.vipRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsTab({ token }: { token: string }) {
  const fetchOverview = useServerFn(adminOverview);
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AdminOverview | null>(null);

  const mutation = useMutation({
    mutationFn: (input: { token: string; days: number }) => fetchOverview({ data: input }),
    onSuccess: setData,
    onError: () => toast.error("Session expired — sign in again."),
  });

  useEffect(() => {
    mutation.mutate({ token, days });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, days]);

  const stats = data?.stats;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {[1, 7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              days === d
                ? "border-primary/50 bg-primary/10"
                : "border-hairline text-muted-foreground"
            }`}
          >
            {d === 1 ? "24h" : `${d}d`}
          </button>
        ))}
        {mutation.isPending ? <span className="label-mono">loading…</span> : null}
      </div>

      {stats ? (
        <>
          <Panel title="Traffic value — what you may pay per click">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-hairline bg-surface-2/40 p-4">
                <p className="label-mono text-muted-foreground">Revenue per visitor</p>
                <p className="mt-1 font-display text-2xl font-semibold">
                  ${(stats.rpv ?? 0).toFixed(4)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.sessions} sessions · {money(stats.totals.revenueCents)} total
                </p>
              </div>
              <div className="rounded-xl border border-hairline bg-surface-2/40 p-4">
                <p className="label-mono text-muted-foreground">Break-even CPC</p>
                <p className="mt-1 font-display text-2xl font-semibold text-primary">
                  ${(stats.rpv ?? 0).toFixed(4)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Never bid above this. Profit starts below it.
                </p>
              </div>
              <div className="rounded-xl border border-hairline bg-surface-2/40 p-4">
                <p className="label-mono text-muted-foreground">Target CPC (2× ROI)</p>
                <p className="mt-1 font-display text-2xl font-semibold">
                  ${((stats.rpv ?? 0) / 2).toFixed(4)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  $100 spend at this CPC returns roughly {money(Math.round((stats.rpv ?? 0) > 0 ? 20000 : 0))}.
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Acquisition quality by country (bounce → start → completion → RPM → VIP)">
            <CohortTable rows={stats.cohorts?.geo ?? []} label="Country" />
          </Panel>

          <Panel title="Acquisition quality by device">
            <CohortTable rows={stats.cohorts?.device ?? []} label="Device" />
          </Panel>

          <Panel title="Acquisition quality by landing source">
            <CohortTable rows={stats.cohorts?.source ?? []} label="Source" />
          </Panel>

          <Panel title="Conversion funnel (visit → test → dwell → result → VIP)">
            {stats.funnel[0]?.sessions ? (
              <div className="space-y-2">
                {stats.funnel.map((step) => (
                  <div key={step.step}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-mono text-xs">{step.step}</span>
                      <span className="text-muted-foreground">
                        {step.sessions} sessions · {pct(step.ofVisit)} of visits ·{" "}
                        {pct(step.ofPrevious)} of previous
                        {step.dropOff > 0 ? ` · -${step.dropOff}` : ""}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, step.ofVisit)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No funnel events recorded yet.</p>
            )}
          </Panel>

          <Panel title="Per-tool revenue, eCPM and session conversion">
            {stats.byTool.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tool activity yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="label-mono text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-normal">Tool</th>
                      <th className="py-2 pr-3 font-normal">Starts</th>
                      <th className="py-2 pr-3 font-normal">Completes</th>
                      <th className="py-2 pr-3 font-normal">Completion</th>
                      <th className="py-2 pr-3 font-normal">Impr.</th>
                      <th className="py-2 pr-3 font-normal">Revenue</th>
                      <th className="py-2 pr-3 font-normal">eCPM</th>
                      <th className="py-2 font-normal">RPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byTool.map((row) => (
                      <tr key={row.key} className="border-t border-hairline/60">
                        <td className="py-2 pr-3 font-mono text-xs">{row.key}</td>
                        <td className="py-2 pr-3">{row.starts}</td>
                        <td className="py-2 pr-3">{row.completes}</td>
                        <td className="py-2 pr-3">{pct(row.completion)}</td>
                        <td className="py-2 pr-3">{row.impressions}</td>
                        <td className="py-2 pr-3">{money(row.revenueCents)}</td>
                        <td className="py-2 pr-3">${row.ecpm.toFixed(2)}</td>
                        <td className="py-2">${row.rpm.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Copy A/B tests (arm → started a test)">
            {stats.experiments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No experiment exposures yet.</p>
            ) : (
              <div className="space-y-4">
                {stats.experiments.map((exp) => (
                  <div key={exp.slot}>
                    <span className="label-mono">{exp.slot}</span>
                    <table className="mt-1 w-full text-sm">
                      <thead>
                        <tr className="label-mono text-left text-muted-foreground">
                          <th className="py-1.5 pr-3 font-normal">Arm</th>
                          <th className="py-1.5 pr-3 font-normal">Sessions</th>
                          <th className="py-1.5 pr-3 font-normal">Started a test</th>
                          <th className="py-1.5 font-normal">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exp.arms.map((arm, i) => (
                          <tr key={arm.arm} className="border-t border-hairline/60">
                            <td className="py-1.5 pr-3 font-mono text-xs">
                              {arm.arm}
                              {i === 0 && arm.exposures > 0 ? (
                                <span className="ml-2 text-primary">leader</span>
                              ) : null}
                            </td>
                            <td className="py-1.5 pr-3">{arm.exposures}</td>
                            <td className="py-1.5 pr-3">{arm.conversions}</td>
                            <td className="py-1.5">{pct(arm.rate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Revenue by ad format">
            <Chart rows={stats.byFormat} />
            <div className="mt-3">
              <StatTable rows={stats.byFormat} label="Format" />
            </div>
          </Panel>

          <Panel title="Per-slot performance">
            <StatTable rows={stats.bySlot} label="Slot" />
          </Panel>

          <Panel title="Per-zone (zone id) performance">
            <StatTable rows={stats.byZone} label="Zone" />
          </Panel>

          <Panel title="VIP vs free visitors">
            <StatTable rows={stats.vipSplit} label="Audience" />
          </Panel>

          <Panel title="Ad script health & load time">
            {stats.scriptPerf.length === 0 ? (
              <p className="text-sm text-muted-foreground">No script loads recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="label-mono text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-normal">Format</th>
                    <th className="py-2 pr-3 font-normal">Loads</th>
                    <th className="py-2 pr-3 font-normal">Errors</th>
                    <th className="py-2 pr-3 font-normal">Blocked</th>
                    <th className="py-2 pr-3 font-normal">Avg ms</th>
                    <th className="py-2 font-normal">p75 ms</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.scriptPerf.map((row) => (
                    <tr key={row.format} className="border-t border-hairline/60">
                      <td className="py-2 pr-3 font-mono text-xs">{row.format}</td>
                      <td className="py-2 pr-3">{row.loads}</td>
                      <td className={`py-2 pr-3 ${row.errors > 0 ? "text-destructive" : ""}`}>
                        {row.errors}
                      </td>
                      <td className="py-2 pr-3">{row.blocked}</td>
                      <td className="py-2 pr-3">{row.avgLoadMs}</td>
                      <td className="py-2">{row.p75LoadMs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Page speed impact (FCP / LCP / CLS / INP)">
            {stats.vitals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No performance samples yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="label-mono text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-normal">Metric</th>
                    <th className="py-2 pr-3 font-normal">Samples</th>
                    <th className="py-2 pr-3 font-normal">Avg</th>
                    <th className="py-2 font-normal">p75</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.vitals.map((row) => (
                    <tr key={row.metric} className="border-t border-hairline/60">
                      <td className="py-2 pr-3 font-mono text-xs uppercase">{row.metric}</td>
                      <td className="py-2 pr-3">{row.samples}</td>
                      <td className="py-2 pr-3">
                        {row.metric === "cls" ? row.avg.toFixed(3) : `${Math.round(row.avg)} ms`}
                      </td>
                      <td className="py-2">
                        {row.metric === "cls" ? row.p75.toFixed(3) : `${Math.round(row.p75)} ms`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Cookie consent">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <span className="label-mono">accepted all</span>
                <p className="font-display text-xl">{stats.consent.accepted}</p>
              </div>
              <div>
                <span className="label-mono">essential only</span>
                <p className="font-display text-xl">{stats.consent.essential}</p>
              </div>
              <div>
                <span className="label-mono">opt-in rate</span>
                <p className="font-display text-xl">{pct(stats.consent.rate)}</p>
              </div>
              <div>
                <span className="label-mono">ads blocked by consent</span>
                <p className="font-display text-xl">{stats.consent.blocked}</p>
              </div>
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
