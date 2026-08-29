import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, GitBranch, RefreshCw } from "lucide-react";

import { adminAttribution, adminCohorts } from "@/lib/ads-intel.functions";
import { DEFAULT_ATTRIBUTION_RULES } from "@/lib/ads-intel.types";
import type { AttributionModel, AttributionReport, AttributionRules, CohortReport } from "@/lib/ads-intel.types";
import { UtmTemplatesCard } from "@/components/admin/UtmTemplatesCard";

export const Route = createFileRoute("/admin/attribution")({
  head: () => ({
    meta: [
      { title: "Ad Attribution Report — Senses of Void" },
      {
        name: "description",
        content:
          "Private attribution report: revenue by UTM source, campaign and click id, with landing-to-purchase funnel drop-off.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Ad Attribution Report" },
      { property: "og:description", content: "Private operator attribution dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttributionPage,
});

const TOKEN_KEY = "sov.adminToken";
const WINDOWS = [7, 14, 30, 60] as const;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function AttributionPage() {
  const load = useServerFn(adminAttribution);
  const loadCohorts = useServerFn(adminCohorts);
  const [token, setToken] = useState<string | null>(null);
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const [rules, setRules] = useState<AttributionRules>(DEFAULT_ATTRIBUTION_RULES);

  useEffect(() => {
    setToken(window.sessionStorage.getItem(TOKEN_KEY) ?? window.localStorage.getItem(TOKEN_KEY));
  }, []);

  const query = useQuery<AttributionReport>({
    queryKey: ["admin-attribution", token, days, rules],
    queryFn: () => load({ data: { token: token!, days, rules: { ...rules, days } } }),
    enabled: Boolean(token),
  });

  const cohortQuery = useQuery<CohortReport>({
    queryKey: ["admin-cohorts", token, days],
    queryFn: () => loadCohorts({ data: { token: token!, days } }),
    enabled: Boolean(token),
  });

  const data = query.data;
  const cohorts = cohortQuery.data;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to admin
          </Link>
          <h1 className="mt-2 flex items-center gap-2 font-display text-2xl font-bold">
            <GitBranch className="size-5 text-primary" aria-hidden="true" />
            Attribution &amp; funnel drop-off
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue broken down by UTM source, campaign, creative and platform click id — plus where
            visitors leave between landing and Purchase.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {WINDOWS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`rounded-lg px-3 py-1.5 text-xs ${
                days === value ? "bg-surface text-foreground" : "text-muted-foreground"
              }`}
            >
              {value}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="rounded-lg border border-hairline p-2 text-muted-foreground hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className={`size-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {!token ? (
        <p className="panel mt-6 p-4 text-sm text-muted-foreground">
          Sign in on the <Link to="/admin" className="text-primary underline">admin panel</Link>{" "}
          first.
        </p>
      ) : null}

      <UtmTemplatesCard />

      <section className="panel mt-4 p-4">
        <span className="label-mono">Attribution rules</span>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-muted-foreground">
            Credit model
            <select
              value={rules.model}
              onChange={(e) => setRules({ ...rules, model: e.target.value as AttributionModel })}
              className="mt-1 w-full rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-foreground"
            >
              <option value="last_touch">Last touch (default)</option>
              <option value="first_touch">First touch</option>
              <option value="session">Per session (raw)</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Lookback window (days)
            <input
              type="number"
              min={1}
              max={90}
              value={rules.lookbackDays}
              disabled={rules.model === "session"}
              onChange={(e) =>
                setRules({ ...rules, lookbackDays: Number(e.target.value) || 1 })
              }
              className="mt-1 w-full rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-foreground disabled:opacity-50"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Min sessions per row
            <input
              type="number"
              min={0}
              max={10000}
              value={rules.minSessions}
              onChange={(e) => setRules({ ...rules, minSessions: Number(e.target.value) || 0 })}
              className="mt-1 w-full rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <div className="flex flex-col justify-end gap-2 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rules.normalize}
                onChange={(e) => setRules({ ...rules, normalize: e.target.checked })}
                className="size-4 accent-[var(--primary)]"
              />
              Normalize UTM spellings
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rules.includeOrganic}
                onChange={(e) => setRules({ ...rules, includeOrganic: e.target.checked })}
                className="size-4 accent-[var(--primary)]"
              />
              Include organic sessions
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rules.requireClickId}
                onChange={(e) => setRules({ ...rules, requireClickId: e.target.checked })}
                className="size-4 accent-[var(--primary)]"
              />
              Paid clicks only (fbclid / ttclid / gclid)
            </label>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {data?.excludedSessions
            ? `${data.excludedSessions} sessions excluded by these rules. `
            : ""}
          Normalization folds fb / FB / facebook.com into one row; touch models re-credit a
          returning visitor&apos;s later sessions to their paid click inside the lookback window.
        </p>
      </section>

      {data ? (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Sessions", String(data.totals.sessions)],
              ["Test starts", String(data.totals.testStart)],
              ["Results", String(data.totals.resultView)],
              ["Gate shown", String(data.totals.gateShown)],
              ["Purchases", String(data.totals.purchase)],
              ["Revenue", money(data.revenueCents)],
            ].map(([label, value]) => (
              <div key={label} className="panel p-3">
                <span className="label-mono">{label}</span>
                <p className="mt-1 font-display text-xl font-semibold">{value}</p>
              </div>
            ))}
          </section>

          <section className="panel mt-4 p-4">
            <span className="label-mono">Funnel drop-off</span>
            <ul className="mt-3 space-y-2">
              {data.dropOff.map((step) => (
                <li key={`${step.from}-${step.to}`}>
                  <div className="flex justify-between text-sm">
                    <span>
                      {step.from} → {step.to}
                    </span>
                    <span className="font-mono">
                      {step.kept} kept · {step.lost} lost ({step.lostPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(0, Math.min(100, 100 - step.lostPct))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {cohorts ? (
            <>
              <section className="mt-6">
                <h2 className="font-display text-lg font-semibold">
                  UTM vs returning-visitor cohorts
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sessions are paired into pseudonymous visitors, so a second visit from the same
                  device counts as returning even when the UTM tags are gone.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {cohorts.cohorts.map((cohort) => (
                    <div key={cohort.key} className="panel p-4">
                      <span className="label-mono">{cohort.label}</span>
                      <p className="mt-1 font-display text-xl font-semibold">
                        {money(cohort.revenueCents)}
                      </p>
                      <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <dt>Sessions</dt>
                          <dd className="font-mono">
                            {cohort.funnel.sessions} ({cohort.sharePct.toFixed(1)}%)
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Purchases</dt>
                          <dd className="font-mono">{cohort.funnel.purchase}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Conv %</dt>
                          <dd className="font-mono">{cohort.conversionRate.toFixed(2)}%</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Rev / session</dt>
                          <dd className="font-mono">{money(cohort.epcCents)}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel mt-4 p-4">
                <span className="label-mono">Funnel retention — new vs returning</span>
                <ul className="mt-3 space-y-3">
                  {cohorts.dropOff.map((step) => (
                    <li key={`cohort-${step.from}-${step.to}`}>
                      <div className="flex justify-between text-sm">
                        <span>
                          {step.from} → {step.to}
                        </span>
                        <span className="font-mono text-xs">
                          new {step.newKeptPct.toFixed(1)}% · returning{" "}
                          {step.returningKeptPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-1 space-y-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(0, Math.min(100, step.newKeptPct))}%` }}
                          />
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-primary/50"
                            style={{
                              width: `${Math.max(0, Math.min(100, step.returningKeptPct))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="panel mt-4 overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-hairline">
                      {[
                        "Source",
                        "New sessions",
                        "Returning sessions",
                        "New conv %",
                        "Returning conv %",
                        "New revenue",
                        "Returning revenue",
                      ].map((head) => (
                        <th
                          key={head}
                          className="px-3 py-2 text-xs font-medium tracking-wide uppercase"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.sources.map((row) => (
                      <tr key={`cohort-${row.source}`} className="border-b border-hairline/60">
                        <td className="px-3 py-2 font-medium">{row.source}</td>
                        <td className="px-3 py-2 font-mono">{row.newSessions}</td>
                        <td className="px-3 py-2 font-mono">{row.returningSessions}</td>
                        <td className="px-3 py-2 font-mono">{row.newConvRate.toFixed(2)}%</td>
                        <td className="px-3 py-2 font-mono">
                          {row.returningConvRate.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 font-mono">{money(row.newRevenueCents)}</td>
                        <td className="px-3 py-2 font-mono">
                          {money(row.returningRevenueCents)}
                        </td>
                      </tr>
                    ))}
                    {cohorts.sources.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                          No cohort data in this window.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </section>
            </>
          ) : null}

          <section className="panel mt-4 overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-hairline">
                  {[
                    "Source",
                    "Campaign",
                    "Creative",
                    "Platform",
                    "Sessions",
                    "Results",
                    "Purchases",
                    "Conv %",
                    "Revenue",
                    "EPC",
                  ].map((head) => (
                    <th key={head} className="px-3 py-2 text-xs font-medium tracking-wide uppercase">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr
                    key={`${row.source}-${row.campaign}-${row.creative}-${row.platform}`}
                    className="border-b border-hairline/60"
                  >
                    <td className="px-3 py-2 font-medium">{row.source}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.campaign}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.creative}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.platform}</td>
                    <td className="px-3 py-2 font-mono">{row.funnel.sessions}</td>
                    <td className="px-3 py-2 font-mono">{row.funnel.resultView}</td>
                    <td className="px-3 py-2 font-mono">{row.funnel.purchase}</td>
                    <td className="px-3 py-2 font-mono">{row.conversionRate.toFixed(2)}%</td>
                    <td className="px-3 py-2 font-mono">{money(row.revenueCents)}</td>
                    <td className="px-3 py-2 font-mono">{money(row.epcCents)}</td>
                  </tr>
                ))}
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                      No attributed traffic in this window.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        </>
      ) : null}

      {query.error ? (
        <p className="mt-4 text-sm text-destructive">{(query.error as Error).message}</p>
      ) : null}
    </main>
  );
}
