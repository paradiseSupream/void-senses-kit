import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, RefreshCw, Sparkles } from "lucide-react";

import { adminCreativeTests } from "@/lib/ads-intel.functions";
import type { CreativeReport } from "@/lib/ads-intel.types";

const WINDOWS = [7, 14, 30, 60] as const;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * Creative A/B testing: every ad creative is identified by `utm_content`, and
 * the winner is the creative with the highest VIP conversion once it has
 * enough sessions to be trusted.
 */
export function CreativeTestsTab({ token }: { token: string }) {
  const load = useServerFn(adminCreativeTests);
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(14);
  const [minSample, setMinSample] = useState(50);

  const query = useQuery<CreativeReport>({
    queryKey: ["admin-creatives", token, days, minSample],
    queryFn: () => load({ data: { token, days, minSample } }),
    refetchInterval: 60_000,
  });

  const data = query.data;

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              FB creative A/B tests
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tag every ad link with <code className="font-mono">?utm_content=creative_name</code> —
              each value becomes its own test arm, scored on VIP conversion.
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
        <label className="mt-3 block text-sm">
          <span className="label-mono">Minimum sessions before a winner is declared</span>
          <input
            type="number"
            min={10}
            max={5000}
            value={minSample}
            onChange={(event) => setMinSample(Math.max(10, Number(event.target.value) || 10))}
            className="mt-1 w-40 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
        </label>
      </div>

      {data?.winner ? (
        <div className="panel border-primary/40 p-4">
          <span className="label-mono flex items-center gap-1.5">
            <Award className="size-3.5 text-primary" aria-hidden="true" />
            Winning creative
          </span>
          <p className="mt-2 font-display text-2xl font-semibold">{data.winner}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Highest VIP conversion over {data.days} days with at least {data.minSample} sessions.
            Scale this one and pause the rest.
          </p>
        </div>
      ) : (
        <div className="panel p-4 text-sm text-muted-foreground">
          No winner yet — no creative has reached {minSample} sessions in this window.
        </div>
      )}

      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-hairline">
              {["Creative", "Campaign", "Sessions", "Results", "Gate", "VIP", "Conv %", "Revenue", "RPM"].map(
                (head) => (
                  <th key={head} className="px-3 py-2 text-xs font-medium tracking-wide uppercase">
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {(data?.rows ?? []).map((row) => (
              <tr
                key={`${row.creative}-${row.campaign}`}
                className={`border-b border-hairline/60 ${row.winner ? "bg-primary/10" : ""}`}
              >
                <td className="px-3 py-2 font-medium">
                  {row.winner ? "🏆 " : ""}
                  {row.creative}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{row.campaign}</td>
                <td className="px-3 py-2 font-mono">{row.funnel.sessions}</td>
                <td className="px-3 py-2 font-mono">{row.funnel.resultView}</td>
                <td className="px-3 py-2 font-mono">{row.funnel.gateShown}</td>
                <td className="px-3 py-2 font-mono">{row.funnel.purchase}</td>
                <td className="px-3 py-2 font-mono">{row.vipConvRate.toFixed(2)}%</td>
                <td className="px-3 py-2 font-mono">{money(row.revenueCents)}</td>
                <td className="px-3 py-2 font-mono">{money(row.rpmCents)}</td>
              </tr>
            ))}
            {data && data.rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                  No campaign traffic recorded in this window.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {query.error ? (
        <p className="text-sm text-destructive">{(query.error as Error).message}</p>
      ) : null}
    </div>
  );
}
