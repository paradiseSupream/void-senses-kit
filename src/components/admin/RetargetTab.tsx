import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

import { adminGetSettings, adminSaveSettings } from "@/lib/admin.functions";
import { adminRetargetAudiences, adminRetargetCsv } from "@/lib/ads-intel.functions";
import type { RetargetReport, RetargetSegment } from "@/lib/ads-intel.types";
import { DEFAULT_TRACKING } from "@/lib/admin-types";

const WINDOWS = [7, 14, 30, 60] as const;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * Retargeting audiences built automatically from quiz completion and
 * add-to-checkout intent, exportable as CSV for a Meta/TikTok custom audience,
 * plus the switch that shows returning non-buyers the $2.99 monthly offer.
 */
export function RetargetTab({ token }: { token: string }) {
  const load = useServerFn(adminRetargetAudiences);
  const exportCsv = useServerFn(adminRetargetCsv);
  const getSettings = useServerFn(adminGetSettings);
  const saveSettings = useServerFn(adminSaveSettings);
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);

  const query = useQuery<RetargetReport>({
    queryKey: ["admin-retarget", token, days],
    queryFn: () => load({ data: { token, days } }),
  });

  const toggle = useMutation({
    mutationFn: async (enabled: boolean) => {
      const current = await getSettings({ data: { token } });
      return saveSettings({
        data: {
          token,
          tracking: { ...DEFAULT_TRACKING, ...current.tracking, retarget_monthly: enabled },
        },
      });
    },
    onSuccess: () => {
      toast.success("Monthly retargeting offer updated");
      void query.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const download = useMutation({
    mutationFn: (segment: RetargetSegment["key"]) =>
      exportCsv({ data: { token, days, segment } }),
    onSuccess: (result, segment) => {
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `retarget-${segment}-${days}d.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${result.rows} rows exported`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const data = query.data;

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Users className="size-4 text-primary" aria-hidden="true" />
            Retargeting audiences
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Segments are rebuilt from live funnel events. Export a segment and upload it as a Meta or
            TikTok custom audience.
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

      <div className="panel p-4">
        <button
          type="button"
          disabled={toggle.isPending || !data}
          onClick={() => toggle.mutate(!(data?.monthlyOfferEnabled ?? false))}
          aria-pressed={data?.monthlyOfferEnabled ?? false}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
            data?.monthlyOfferEnabled
              ? "border-primary/50 bg-primary/10 text-foreground"
              : "border-hairline bg-surface-2 text-muted-foreground"
          }`}
        >
          Show returning non-buyers the $2.99 monthly offer
          <span
            className={`size-2.5 rounded-full ${data?.monthlyOfferEnabled ? "bg-primary" : "bg-muted"}`}
          />
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          When on, a visitor who already saw a result and came back without buying gets the monthly
          pass as the main call to action instead of the lifetime price.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(data?.segments ?? []).map((segment) => (
          <div key={segment.key} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">{segment.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{segment.description}</p>
              </div>
              <button
                type="button"
                disabled={download.isPending || segment.sessions === 0}
                onClick={() => download.mutate(segment.key)}
                className="rounded-lg border border-hairline p-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
                aria-label={`Export ${segment.label}`}
              >
                <Download className="size-3.5" />
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="label-mono">Sessions</dt>
                <dd className="font-mono">{segment.sessions}</dd>
              </div>
              <div>
                <dt className="label-mono">With click id</dt>
                <dd className="font-mono">{segment.withClickId}</dd>
              </div>
              <div>
                <dt className="label-mono">Revenue</dt>
                <dd className="font-mono">{money(segment.revenueCents)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      {query.error ? (
        <p className="text-sm text-destructive">{(query.error as Error).message}</p>
      ) : null}
    </div>
  );
}
