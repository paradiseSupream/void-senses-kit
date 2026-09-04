import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  BarChart3,
  MousePointerClick,
  Eye,
  DollarSign,
  Users,
  ShieldCheck,
  ShieldAlert,
  Radio,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  adminWeeklyReports,
  getMonetizationStats,
  type StatsResult,
} from "@/lib/analytics.functions";
import type { WeeklyReport } from "@/lib/weekly-report.types";
import type { SlotStat } from "@/lib/analytics-agg";
import { RpmTab } from "@/components/admin/RpmTab";

export const Route = createFileRoute("/admin/monetization")({
  head: () => ({
    meta: [
      { title: "Monetization Analytics — Senses of Void" },
      {
        name: "description",
        content:
          "Private dashboard for ad impressions, clicks, CTR, RPM, A/B variant performance and tool conversion on Senses of Void.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Monetization Analytics — Senses of Void" },
      {
        property: "og:description",
        content: "Impressions, clicks, CTR, RPM and tool conversion reporting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MonetizationDashboard,
});

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const pct = (value: number) => `${value.toFixed(2)}%`;

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Eye;
}) {
  return (
    <div className="panel p-4">
      <span className="label-mono flex items-center gap-1.5">
        <Icon className="size-3.5 text-primary" aria-hidden="true" />
        {label}
      </span>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatTable({ title, rows }: { title: string; rows: SlotStat[] }) {
  return (
    <div className="panel overflow-hidden">
      <h2 className="border-b border-hairline px-4 py-3 font-display text-sm font-semibold">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="label-mono text-left text-muted-foreground">
              <th className="px-4 py-2 font-normal">Key</th>
              <th className="px-4 py-2 font-normal">Impr.</th>
              <th className="px-4 py-2 font-normal">Clicks</th>
              <th className="px-4 py-2 font-normal">CTR</th>
              <th className="px-4 py-2 font-normal">RPM</th>
              <th className="px-4 py-2 font-normal">Rev.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-muted-foreground" colSpan={6}>
                  No data yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key} className="border-t border-hairline/60">
                  <td className="px-4 py-2 font-mono text-xs">{row.key}</td>
                  <td className="px-4 py-2">{row.impressions}</td>
                  <td className="px-4 py-2">{row.clicks}</td>
                  <td className="px-4 py-2">{pct(row.ctr)}</td>
                  <td className="px-4 py-2">${row.rpm.toFixed(2)}</td>
                  <td className="px-4 py-2">{money(row.revenueCents)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Filters = {
  days: number;
  country: string;
  device: string;
  format: string;
  slot: string;
  audience: "all" | "vip" | "free";
  excludeSuspect: boolean;
};

const DEFAULT_FILTERS: Filters = {
  days: 7,
  country: "",
  device: "",
  format: "",
  slot: "",
  audience: "all",
  excludeSuspect: true,
};

function Select({
  label,
  value,
  options,
  onChange,
  allLabel = "All",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  return (
    <label className="text-sm">
      <span className="label-mono">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MonetizationDashboard() {
  const fetchStats = useServerFn(getMonetizationStats);
  const fetchReports = useServerFn(adminWeeklyReports);
  const [token, setToken] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [live, setLive] = useState(true);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const query = useQuery({
    queryKey: ["monetization-stats", activeToken, filters],
    enabled: activeToken.length > 0,
    refetchInterval: live ? 15_000 : false,
    queryFn: () =>
      fetchStats({
        data: {
          token: activeToken,
          days: filters.days,
          country: filters.country,
          device: filters.device,
          format: filters.format,
          slot: filters.slot,
          audience: filters.audience,
          excludeSuspect: filters.excludeSuspect,
        },
      }) as Promise<StatsResult>,
  });

  const reports = useQuery({
    queryKey: ["weekly-reports", activeToken],
    enabled: activeToken.length > 0,
    queryFn: () => fetchReports({ data: { token: activeToken } }) as Promise<WeeklyReport[]>,
  });

  const generate = useMutation({
    mutationFn: () =>
      fetchReports({ data: { token: activeToken, generate: true } }) as Promise<WeeklyReport[]>,
    onSuccess: () => void reports.refetch(),
  });

  const result = query.data;
  const stats = result?.stats;
  const options = result?.options;
  const latest = reports.data?.[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <span className="label-mono flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" /> private
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold">Monetization analytics</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Realtime impressions, clicks, CTR, RPM, country split, partner click attribution, invalid
        traffic filtering and weekly performance reports.
      </p>

      <form
        className="panel mt-6 flex flex-wrap items-end gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setActiveToken(token);
        }}
      >
        <label className="min-w-[220px] flex-1 text-sm">
          <span className="label-mono">Admin token</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
            placeholder="ANALYTICS_ADMIN_TOKEN"
          />
        </label>
        <button
          type="submit"
          disabled={token.length === 0}
          className="btn-glow rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Connect
        </button>
      </form>

      {activeToken ? (
        <div className="panel mt-4 flex flex-wrap items-end gap-3 p-4">
          <label className="text-sm">
            <span className="label-mono">Window</span>
            <select
              value={filters.days}
              onChange={(e) => set("days", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
          <Select
            label="Country"
            value={filters.country}
            options={options?.countries ?? []}
            onChange={(v) => set("country", v)}
            allLabel="All countries"
          />
          <Select
            label="Device"
            value={filters.device}
            options={options?.devices ?? []}
            onChange={(v) => set("device", v)}
          />
          <Select
            label="Format"
            value={filters.format}
            options={options?.formats ?? []}
            onChange={(v) => set("format", v)}
          />
          <Select
            label="Slot"
            value={filters.slot}
            options={options?.slots ?? []}
            onChange={(v) => set("slot", v)}
          />
          <label className="text-sm">
            <span className="label-mono">Audience</span>
            <select
              value={filters.audience}
              onChange={(e) => set("audience", e.target.value as Filters["audience"])}
              className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
            >
              <option value="all">All visitors</option>
              <option value="free">Free only</option>
              <option value="vip">VIP only</option>
            </select>
          </label>
          <label className="flex items-center gap-2 py-2 text-sm">
            <input
              type="checkbox"
              checked={filters.excludeSuspect}
              onChange={(e) => set("excludeSuspect", e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            Filter invalid traffic
          </label>
          <label className="flex items-center gap-2 py-2 text-sm">
            <input
              type="checkbox"
              checked={live}
              onChange={(e) => setLive(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            <Radio className="size-3.5 text-primary" aria-hidden="true" /> Live (15s)
          </label>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="rounded-lg border border-hairline px-3 py-2 text-sm hover:border-primary/50"
          >
            Reset
          </button>
        </div>
      ) : null}

      {query.isError ? (
        <p className="mt-4 text-sm text-destructive">
          Could not load the report — check the admin token and try again.
        </p>
      ) : null}

      {stats ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Impressions" value={String(stats.totals.impressions)} icon={Eye} />
            <StatCard
              label="Clicks"
              value={String(stats.totals.clicks)}
              icon={MousePointerClick}
            />
            <StatCard label="CTR" value={pct(stats.totals.ctr)} icon={BarChart3} />
            <StatCard label="RPM" value={`$${stats.totals.rpm.toFixed(2)}`} icon={DollarSign} />
            <StatCard label="Sessions" value={String(stats.sessions)} icon={Users} />
          </div>

          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="label-mono">
                {filters.days <= 2 ? "Hourly" : "Daily"} impressions vs clicks
              </span>
              <span className="label-mono text-muted-foreground">
                updated {new Date(result?.generatedAt ?? Date.now()).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-3 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="impressions" stroke="var(--color-primary)" dot={false} />
                  <Line type="monotone" dataKey="clicks" stroke="var(--color-secondary)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-4">
            <span className="label-mono">Top countries</span>
            <div className="mt-3 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCountry.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                  <XAxis dataKey="key" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="impressions" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-4 text-sm">
            <span className="label-mono flex items-center gap-1.5">
              <ShieldAlert className="size-3.5 text-primary" aria-hidden="true" /> Invalid traffic
            </span>
            <p className="mt-2 text-muted-foreground">
              {stats.fraud.filteredClicks} of {stats.fraud.totalClicks} clicks flagged (
              {pct(stats.fraud.fraudRate)}) — bot {stats.fraud.botClicks} · duplicate IP{" "}
              {stats.fraud.duplicateIpClicks} · no impression {stats.fraud.noImpressionClicks} ·
              burst sessions {stats.fraud.burstSessions}
            </p>
            {stats.fraud.topOffenders.length > 0 ? (
              <ul className="mt-3 space-y-1 font-mono text-xs text-muted-foreground">
                {stats.fraud.topOffenders.map((o) => (
                  <li key={o.key}>
                    {o.key.slice(0, 16)} — {o.clicks} clicks · {o.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <RpmTab token={activeToken} days={filters.days} />

          <StatTable title="By country" rows={stats.byCountry} />
          <StatTable title="A/B variants (result page vs download gate)" rows={stats.byVariant} />
          <StatTable title="By slot" rows={stats.bySlot} />
          <StatTable title="By format" rows={stats.byFormat} />
          <StatTable title="By device" rows={stats.byDevice} />
          <StatTable title="By traffic source (UTM / referrer)" rows={stats.bySource} />

          <div className="panel overflow-hidden">
            <h2 className="border-b border-hairline px-4 py-3 font-display text-sm font-semibold">
              Live click attribution
            </h2>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="label-mono text-left text-muted-foreground">
                    <th className="px-4 py-2 font-normal">Time</th>
                    <th className="px-4 py-2 font-normal">Event</th>
                    <th className="px-4 py-2 font-normal">Slot</th>
                    <th className="px-4 py-2 font-normal">Country</th>
                    <th className="px-4 py-2 font-normal">Device</th>
                    <th className="px-4 py-2 font-normal">Click ID</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-muted-foreground" colSpan={6}>
                        No events yet.
                      </td>
                    </tr>
                  ) : (
                    stats.recent.map((row, i) => (
                      <tr key={`${row.click_id}-${i}`} className="border-t border-hairline/60">
                        <td className="px-4 py-2 font-mono text-xs">
                          {row.at ? new Date(row.at).toLocaleTimeString() : "—"}
                        </td>
                        <td className="px-4 py-2">{row.event_type}</td>
                        <td className="px-4 py-2 font-mono text-xs">{row.slot}</td>
                        <td className="px-4 py-2">{row.country ?? "—"}</td>
                        <td className="px-4 py-2">{row.device ?? "—"}</td>
                        <td className="px-4 py-2 font-mono text-xs">{row.click_id ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel p-4 text-sm">
            <span className="label-mono">Download gate</span>
            <p className="mt-2 text-muted-foreground">
              Shown <strong className="text-foreground">{stats.gate.shown}</strong> times ·
              completed <strong className="text-foreground">{stats.gate.completed}</strong> ·
              completion rate{" "}
              <strong className="text-foreground">{pct(stats.gate.completion)}</strong>
            </p>
          </div>

          <div className="panel overflow-hidden">
            <h2 className="border-b border-hairline px-4 py-3 font-display text-sm font-semibold">
              Tool conversion
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="label-mono text-left text-muted-foreground">
                    <th className="px-4 py-2 font-normal">Tool</th>
                    <th className="px-4 py-2 font-normal">Starts</th>
                    <th className="px-4 py-2 font-normal">Completes</th>
                    <th className="px-4 py-2 font-normal">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.tools.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                        No data yet.
                      </td>
                    </tr>
                  ) : (
                    stats.tools.map((tool) => (
                      <tr key={tool.slug} className="border-t border-hairline/60">
                        <td className="px-4 py-2 font-mono text-xs">{tool.slug}</td>
                        <td className="px-4 py-2">{tool.starts}</td>
                        <td className="px-4 py-2">{tool.completes}</td>
                        <td className="px-4 py-2">{pct(tool.conversion)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="label-mono">Weekly performance report</span>
              <button
                type="button"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
                className="rounded-lg border border-hairline px-3 py-1.5 text-xs hover:border-primary/50 disabled:opacity-50"
              >
                {generate.isPending ? "Generating…" : "Generate now"}
              </button>
            </div>
            {latest ? (
              <div className="mt-3 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Week of {latest.week_start} · {latest.impressions} impressions ·{" "}
                  {pct(latest.ctr)} CTR · est. {money(latest.estimated_revenue_cents)} · invalid{" "}
                  {pct(latest.fraud_rate)}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="label-mono text-left text-muted-foreground">
                        <th className="py-2 pr-3 font-normal">Script</th>
                        <th className="py-2 pr-3 font-normal">Loads</th>
                        <th className="py-2 pr-3 font-normal">Errors</th>
                        <th className="py-2 pr-3 font-normal">Avg</th>
                        <th className="py-2 font-normal">p75</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latest.scripts.map((s) => (
                        <tr key={s.format} className="border-t border-hairline/60">
                          <td className="py-2 pr-3 font-mono text-xs">{s.format}</td>
                          <td className="py-2 pr-3">{s.loads}</td>
                          <td className="py-2 pr-3">{s.errors}</td>
                          <td className="py-2 pr-3">{s.avgLoadMs}ms</td>
                          <td className="py-2">{s.p75LoadMs}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="label-mono text-muted-foreground">Core Web Vitals (p75)</p>
                <ul className="font-mono text-xs text-muted-foreground">
                  {latest.vitals.map((v) => (
                    <li key={v.metric}>
                      {v.metric}: {v.p75} ({v.samples} samples)
                    </li>
                  ))}
                </ul>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {latest.verdict.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No report stored yet — the cron job writes one every week, or generate one now.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
