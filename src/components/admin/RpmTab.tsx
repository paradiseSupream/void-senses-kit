import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gauge } from "lucide-react";

import { adminGetSettings, adminSaveSettings } from "@/lib/admin.functions";
import { adminRpmReport } from "@/lib/rpm.functions";

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * RPM dashboard: which page types actually earn, with editable RPM and
 * per-unlock payout so estimates can be calibrated against the real network
 * dashboards.
 */
export function RpmTab({ token, days }: { token: string; days: number }) {
  const fetchReport = useServerFn(adminRpmReport);
  const getSettings = useServerFn(adminGetSettings);
  const saveSettings = useServerFn(adminSaveSettings);

  const report = useQuery({
    queryKey: ["rpm-report", token, days],
    enabled: token.length > 0,
    queryFn: () => fetchReport({ data: { token, days } }),
  });

  const settings = useQuery({
    queryKey: ["admin-settings", token],
    enabled: token.length > 0,
    queryFn: () => getSettings({ data: { token } }),
  });

  const [rpm, setRpm] = useState("");
  const [unlock, setUnlock] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setRpm(String(settings.data.ads.rpm_estimate_cents ?? 120));
    setUnlock(String(settings.data.ads.unlock_value_cents ?? 4));
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!settings.data) return;
      await saveSettings({
        data: {
          token,
          ads: {
            ...settings.data.ads,
            rpm_estimate_cents: Math.max(0, Number(rpm) || 0),
            unlock_value_cents: Math.max(0, Number(unlock) || 0),
          },
        },
      });
    },
    onSuccess: () => void report.refetch(),
  });

  const data = report.data;

  return (
    <section className="panel mt-6 overflow-hidden">
      <h2 className="flex items-center gap-2 border-b border-hairline px-4 py-3 font-display text-sm font-semibold">
        <Gauge className="size-4 text-primary" aria-hidden="true" /> RPM by page type
      </h2>

      <div className="flex flex-wrap items-end gap-3 border-b border-hairline p-4">
        <label className="text-xs text-muted-foreground">
          RPM (cents / 1000 impressions)
          <input
            value={rpm}
            onChange={(event) => setRpm(event.target.value)}
            inputMode="numeric"
            className="mt-1 block h-10 w-40 rounded-lg border border-hairline bg-surface-2 px-3 text-sm text-foreground"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Payout per unlock (cents)
          <input
            value={unlock}
            onChange={(event) => setUnlock(event.target.value)}
            inputMode="numeric"
            className="mt-1 block h-10 w-40 rounded-lg border border-hairline bg-surface-2 px-3 text-sm text-foreground"
          />
        </label>
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending || !settings.data}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save rates"}
        </button>
      </div>

      {!data ? (
        <p className="p-4 text-sm text-muted-foreground">
          {report.isLoading ? "Loading RPM report…" : "Enter the admin token to load the report."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="label-mono text-left text-muted-foreground">
                <th className="px-4 py-2 font-normal">Page type</th>
                <th className="px-4 py-2 font-normal">Sessions</th>
                <th className="px-4 py-2 font-normal">Impressions</th>
                <th className="px-4 py-2 font-normal">Clicks</th>
                <th className="px-4 py-2 font-normal">Unlocks</th>
                <th className="px-4 py-2 font-normal">Unlock rate</th>
                <th className="px-4 py-2 font-normal">Est. revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.pageType} className="border-t border-hairline">
                  <td className="px-4 py-2">{row.pageType}</td>
                  <td className="px-4 py-2">{row.sessions}</td>
                  <td className="px-4 py-2">{row.impressions}</td>
                  <td className="px-4 py-2">{row.clicks}</td>
                  <td className="px-4 py-2">{row.unlocks}</td>
                  <td className="px-4 py-2">{row.unlockRate.toFixed(2)}%</td>
                  <td className="px-4 py-2">{usd(row.estRevenueCents)}</td>
                </tr>
              ))}
              <tr className="border-t border-hairline font-semibold">
                <td className="px-4 py-2">All ({data.days}d)</td>
                <td className="px-4 py-2">{data.totals.sessions}</td>
                <td className="px-4 py-2">{data.totals.impressions}</td>
                <td className="px-4 py-2">{data.totals.clicks}</td>
                <td className="px-4 py-2">{data.totals.unlocks}</td>
                <td className="px-4 py-2">{data.totals.unlockRate.toFixed(2)}%</td>
                <td className="px-4 py-2">{usd(data.totals.estRevenueCents)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
