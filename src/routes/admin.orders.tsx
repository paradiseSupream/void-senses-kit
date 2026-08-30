import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

import { adminOrdersReport, type OrdersReport } from "@/lib/orders.functions";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders & Payment Reliability — Senses of Void" },
      {
        name: "description",
        content:
          "Private operator dashboard: Whop order status, abandoned checkouts, purchase reconciliation and webhook delivery logs.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Orders & Payment Reliability" },
      { property: "og:description", content: "Private operator orders dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

const TOKEN_KEY = "sov.adminToken";
const WINDOWS = [1, 7, 14, 30, 60] as const;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const pct = (value: number) => `${value.toFixed(1)}%`;

function age(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bad" | "good" }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="label-mono">{label}</p>
      <p
        className={`mt-1 font-display text-2xl font-semibold ${
          tone === "bad" ? "text-destructive" : tone === "good" ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function OrdersPage() {
  const load = useServerFn(adminOrdersReport);
  const [token, setToken] = useState<string | null>(null);
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(14);

  useEffect(() => {
    setToken(window.sessionStorage.getItem(TOKEN_KEY) ?? window.localStorage.getItem(TOKEN_KEY));
  }, []);

  const query = useQuery<OrdersReport>({
    queryKey: ["admin-orders", token, days],
    queryFn: async () => (await load({ data: { token: token!, days } })) as OrdersReport,
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });

  const data = query.data;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="label-mono">payments</span>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
            Orders &amp; payment reliability
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Back
          </Link>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {WINDOWS.map((window) => (
          <button
            key={window}
            type="button"
            onClick={() => setDays(window)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              days === window
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-hairline text-muted-foreground"
            }`}
          >
            {window}d
          </button>
        ))}
      </div>

      {!token ? (
        <p className="glass mt-6 rounded-2xl p-6 text-sm text-muted-foreground">
          Sign in on the <Link to="/admin" className="text-primary underline">admin panel</Link>{" "}
          first — this page reuses that session.
        </p>
      ) : query.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading orders…</p>
      ) : query.isError ? (
        <p className="glass mt-6 rounded-2xl p-6 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      ) : data ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Orders" value={String(data.totals.orders)} />
            <Stat label="Paid" value={String(data.totals.paid)} tone="good" />
            <Stat label="Pending" value={String(data.totals.pending)} />
            <Stat label="Revenue" value={money(data.totals.revenueCents)} tone="good" />
            <Stat
              label="Checkout → paid"
              value={pct(data.totals.paidRate)}
              tone={data.totals.paidRate < 10 ? "bad" : "good"}
            />
          </div>

          {data.recon.missing > 0 || data.recon.duplicate > 0 ? (
            <div className="glass mt-4 flex items-start gap-3 rounded-2xl border border-destructive/40 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-4 text-destructive" aria-hidden="true" />
              <p>
                <strong>{data.recon.missing}</strong> paid order(s) never reached Meta as a
                Purchase and <strong>{data.recon.duplicate}</strong> were delivered more than once.
                Check the reconciliation table below.
              </p>
            </div>
          ) : null}

          {/* --- gate A/B --- */}
          <h2 className="mt-8 font-display text-lg font-semibold">VIP gate A/B test</h2>
          <div className="glass mt-3 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Arm</th>
                  <th className="p-3">Gate views</th>
                  <th className="p-3">Checkouts</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">View→checkout</th>
                  <th className="p-3">Checkout→paid</th>
                </tr>
              </thead>
              <tbody>
                {data.gateTest.length === 0 ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={6}>
                      No exposures recorded yet in this window.
                    </td>
                  </tr>
                ) : (
                  data.gateTest.map((row) => (
                    <tr key={row.arm} className="border-t border-hairline">
                      <td className="p-3 font-medium">{row.arm}</td>
                      <td className="p-3">{row.views}</td>
                      <td className="p-3">{row.checkouts}</td>
                      <td className="p-3">{row.paid}</td>
                      <td className="p-3">{pct(row.checkoutRate)}</td>
                      <td className="p-3">{pct(row.paidRate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- countries --- */}
          <h2 className="mt-8 font-display text-lg font-semibold">Paid rate by country</h2>
          <div className="glass mt-3 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Country</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.byCountry.map((row) => (
                  <tr key={row.country} className="border-t border-hairline">
                    <td className="p-3 font-medium">{row.country}</td>
                    <td className="p-3">{row.orders}</td>
                    <td className="p-3">{row.paid}</td>
                    <td className="p-3">{pct(row.paidRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- orders --- */}
          <h2 className="mt-8 font-display text-lg font-semibold">Orders</h2>
          <div className="glass mt-3 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Flag</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((row) => (
                  <tr key={row.orderId} className="border-t border-hairline">
                    <td className="p-3 font-mono text-xs">{row.orderId.slice(0, 18)}…</td>
                    <td className="p-3">
                      <span
                        className={
                          row.status === "paid"
                            ? "text-primary"
                            : row.status === "pending"
                              ? "text-muted-foreground"
                              : "text-destructive"
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3">{money(row.amountCents)}</td>
                    <td className="p-3">{row.country ?? "—"}</td>
                    <td className="p-3">{age(row.ageMinutes)}</td>
                    <td className="p-3">{row.utmSource ?? "direct"}</td>
                    <td className="p-3 text-xs">
                      {row.abandoned ? (
                        <span className="text-destructive">abandoned</span>
                      ) : row.atRisk ? (
                        <span className="text-amber-400">in progress</span>
                      ) : row.hasFbp ? (
                        "attributed"
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- reconciliation --- */}
          <h2 className="mt-8 font-display text-lg font-semibold">
            Purchase reconciliation (Whop ⇄ Meta)
          </h2>
          <div className="glass mt-3 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Event id</th>
                  <th className="p-3">Paid at</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">Deliveries</th>
                  <th className="p-3">State</th>
                </tr>
              </thead>
              <tbody>
                {data.recon.rows.length === 0 ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={5}>
                      No paid orders in this window.
                    </td>
                  </tr>
                ) : (
                  data.recon.rows.map((row) => (
                    <tr key={row.eventId} className="border-t border-hairline">
                      <td className="p-3 font-mono text-xs">{row.eventId.slice(0, 26)}…</td>
                      <td className="p-3">{row.paidAt ? row.paidAt.slice(0, 16).replace("T", " ") : "—"}</td>
                      <td className="p-3">{money(row.amountCents)}</td>
                      <td className="p-3">{row.deliveries}</td>
                      <td
                        className={`p-3 ${row.issue === "ok" ? "text-primary" : "text-destructive"}`}
                      >
                        {row.issue}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- webhooks --- */}
          <h2 className="mt-8 font-display text-lg font-semibold">
            Whop webhook deliveries ({data.webhooks.received} received · {data.webhooks.rejected}{" "}
            rejected · {data.webhooks.processed} processed)
          </h2>
          <div className="glass mt-3 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">At</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Verified</th>
                  <th className="p-3">Outcome</th>
                  <th className="p-3">CAPI</th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {data.webhooks.rows.length === 0 ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={7}>
                      No webhook calls recorded yet in this window.
                    </td>
                  </tr>
                ) : (
                  data.webhooks.rows.map((row, index) => (
                    <tr key={`${row.at}-${index}`} className="border-t border-hairline align-top">
                      <td className="p-3 whitespace-nowrap text-xs">
                        {row.at.slice(5, 16).replace("T", " ")}
                      </td>
                      <td className="p-3 text-xs">{row.eventType}</td>
                      <td className={`p-3 text-xs ${row.verified ? "text-primary" : "text-destructive"}`}>
                        {row.verified ? "yes" : "no"}
                      </td>
                      <td className="p-3 text-xs">{row.outcome}</td>
                      <td className="p-3 text-xs">
                        {row.capiStatus != null ? row.capiStatus : "—"}
                        {row.capiResponse ? (
                          <span className="block max-w-[220px] truncate text-muted-foreground">
                            {row.capiResponse}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {row.orderId ? `${row.orderId.slice(0, 14)}…` : "—"}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        <span className="block max-w-[240px] truncate">{row.detail ?? "—"}</span>
                        {row.capiPayload ? (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-primary">payload</summary>
                            <pre className="mt-1 max-w-[260px] overflow-x-auto text-[10px]">
                              {row.capiPayload}
                            </pre>
                          </details>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
