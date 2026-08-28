import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, GitBranch, RefreshCw } from "lucide-react";

import { adminAttribution } from "@/lib/ads-intel.functions";
import type { AttributionReport } from "@/lib/ads-intel.types";

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
  const [token, setToken] = useState<string | null>(null);
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);

  useEffect(() => {
    setToken(window.localStorage.getItem(TOKEN_KEY));
  }, []);

  const query = useQuery<AttributionReport>({
    queryKey: ["admin-attribution", token, days],
    queryFn: () => load({ data: { token: token!, days } }),
    enabled: Boolean(token),
  });

  const data = query.data;

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
