import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BarChart3, MousePointerClick, Eye, DollarSign, Users, ShieldCheck } from "lucide-react";

import { getMonetizationStats } from "@/lib/analytics.functions";
import type { MonetizationStats, SlotStat } from "@/lib/analytics-agg";

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

function MonetizationDashboard() {
  const fetchStats = useServerFn(getMonetizationStats);
  const [token, setToken] = useState("");
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<MonetizationStats | null>(null);

  const mutation = useMutation({
    mutationFn: (input: { token: string; days: number }) => fetchStats({ data: input }),
    onSuccess: (data) => setStats(data),
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <span className="label-mono flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" /> private
      </span>
      <h1 className="mt-2 font-display text-3xl font-semibold">Monetization analytics</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Impressions, clicks, CTR, RPM, A/B variant performance, partner click attribution and
        tool conversion. Access requires the admin token.
      </p>

      <form
        className="panel mt-6 flex flex-wrap items-end gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ token, days });
        }}
      >
        <label className="flex-1 min-w-[220px] text-sm">
          <span className="label-mono">Admin token</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
            placeholder="ANALYTICS_ADMIN_TOKEN"
          />
        </label>
        <label className="text-sm">
          <span className="label-mono">Window</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={mutation.isPending || token.length === 0}
          className="btn-glow rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? "Loading…" : "Load report"}
        </button>
      </form>

      {mutation.isError ? (
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

          <div className="panel p-4 text-sm">
            <span className="label-mono">Download gate</span>
            <p className="mt-2 text-muted-foreground">
              Shown <strong className="text-foreground">{stats.gate.shown}</strong> times ·
              completed <strong className="text-foreground">{stats.gate.completed}</strong> ·
              completion rate{" "}
              <strong className="text-foreground">{pct(stats.gate.completion)}</strong>
            </p>
          </div>

          <StatTable title="A/B variants (result page vs download gate)" rows={stats.byVariant} />
          <StatTable title="By slot" rows={stats.bySlot} />
          <StatTable title="By device" rows={stats.byDevice} />
          <StatTable title="By traffic source (UTM / referrer)" rows={stats.bySource} />

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
        </div>
      ) : null}
    </div>
  );
}
