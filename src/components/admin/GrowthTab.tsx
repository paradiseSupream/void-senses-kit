import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, Share2, Sparkles } from "lucide-react";

import { adminGrowthReport, type GrowthReport } from "@/lib/growth.functions";

const WINDOWS = [7, 14, 30, 60] as const;
const pct = (value: number) => `${value.toFixed(2)}%`;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel p-3">
      <div className="label-mono text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { key: string; count: number }[] }) {
  return (
    <div className="panel p-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No data in this window yet.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3">
              <span className="label-mono truncate text-xs">{row.key}</span>
              <span className="font-semibold">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Virality dashboard: referral funnel, share volume and vault unlock loop. */
export function GrowthTab({ token }: { token: string }) {
  const load = useServerFn(adminGrowthReport);
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(14);

  const query = useQuery<GrowthReport>({
    queryKey: ["admin-growth", token, days],
    queryFn: () => load({ data: { token, days } }),
  });

  const data = query.data;

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold">Growth & virality</h3>
        </div>
        <div className="flex items-center gap-2">
          {WINDOWS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`rounded-lg border px-2.5 py-1 text-xs ${
                days === value ? "border-primary/60 bg-primary/10" : "border-hairline"
              }`}
            >
              {value}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="rounded-lg border border-hairline px-2.5 py-1 text-xs"
          >
            <RefreshCw className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {query.isError ? (
        <p className="panel p-4 text-sm text-destructive">{(query.error as Error).message}</p>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Referred visits" value={data.referral.visits} />
            <Stat label="Referred starts" value={data.referral.starts} />
            <Stat label="Referred completes" value={data.referral.completes} />
            <Stat label="Referral CVR" value={pct(data.referralConversion)} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Vault views" value={data.vault.views} />
            <Stat label="Unlock starts" value={data.vault.unlockStarts} />
            <Stat label="Unlocks" value={data.vault.unlocks} />
            <Stat label="Unlock rate" value={pct(data.vaultUnlockRate)} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Shares" value={data.shares} />
            <Stat label="Next-pack taps" value={data.vault.nexts} />
            <Stat label="Referral shares" value={data.referral.shares} />
            <Stat label="Window" value={`${data.days}d`} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <TopList title="Top referrers" rows={data.topReferrers} />
            <TopList title="Top unlocked packs" rows={data.topVaultPacks} />
            <TopList title="Badges earned" rows={data.badges} />
          </div>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Share2 className="size-3.5" aria-hidden />
            Built from existing funnel events — no extra tracking added.
          </p>
        </>
      ) : (
        <p className="panel p-4 text-sm text-muted-foreground">Loading growth data…</p>
      )}
    </div>
  );
}
