import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity } from "lucide-react";

import { adminGeoRoi } from "@/lib/ads-intel.functions";
import type { GeoReport } from "@/lib/ads-intel.types";

type Props = { token: string | null; days: number };

/** The five markets the current campaigns target, plus everything else. */
const PINNED = ["AE", "SA", "QA", "KW", "US"];

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

/**
 * Country-wise Meta funnel: PageView → ViewContent → AddToCart → Checkout →
 * Purchase, measured from our own session events (the same steps mirrored to
 * the pixel and the Conversions API) with the drop-off between each stage.
 */
export function GeoFunnelCard({ token, days }: Props) {
  const load = useServerFn(adminGeoRoi);
  const query = useQuery<GeoReport>({
    queryKey: ["admin-geo-roi", token, days],
    queryFn: () => load({ data: { token: token!, days } }),
    enabled: Boolean(token),
  });

  const rows = (query.data?.rows ?? []).filter(
    (row) => PINNED.includes(row.country) || row.funnel.sessions > 0,
  );

  return (
    <section className="glass mt-6 rounded-2xl p-4 sm:p-6">
      <header className="flex items-center gap-2">
        <Activity className="size-4 text-primary" aria-hidden="true" />
        <h2 className="font-display text-lg font-semibold">Country funnel — last {days} days</h2>
      </header>
      <p className="mt-1 text-xs text-muted-foreground">
        PageView → ViewContent → AddToCart → Checkout → Purchase. Percentages are the share of
        that country's visitors still in the funnel at that step.
      </p>

      {query.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Country</th>
                <th className="py-2 pr-3">PageView</th>
                <th className="py-2 pr-3">ViewContent</th>
                <th className="py-2 pr-3">AddToCart</th>
                <th className="py-2 pr-3">Checkout</th>
                <th className="py-2 pr-3">Purchase</th>
                <th className="py-2 pr-3">Checkout → Paid</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {rows.map((row) => {
                const f = row.funnel;
                const cell = (n: number) => (
                  <td className="py-2 pr-3">
                    {n}
                    <span className="ml-1 text-muted-foreground">
                      ({pct(n, f.sessions).toFixed(0)}%)
                    </span>
                  </td>
                );
                return (
                  <tr key={row.country} className="border-t border-hairline">
                    <td className="py-2 pr-3 font-sans">{row.label}</td>
                    <td className="py-2 pr-3">{f.sessions}</td>
                    {cell(f.testStart)}
                    {cell(f.gateShown)}
                    {cell(f.checkoutStart)}
                    {cell(f.purchase)}
                    <td className="py-2 pr-3">
                      {f.checkoutStart > 0
                        ? `${pct(f.purchase, f.checkoutStart).toFixed(0)}%`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
