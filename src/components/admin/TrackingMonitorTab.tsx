import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { adminTrackingMonitor, type TrackingMonitor } from "@/lib/admin.functions";

const WINDOWS = [1, 6, 24, 72] as const;

const CHANNEL_LABEL: Record<string, string> = {
  meta: "Meta",
  tiktok: "TikTok",
  ga4: "GA4",
  google_ads: "Google Ads",
};

const CHANNEL_COLOR: Record<string, string> = {
  meta: "#4f8cff",
  tiktok: "#22d3ee",
  ga4: "#f59e0b",
  google_ads: "#34d399",
};

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Live delivery monitor for browser pixels and server-side conversion APIs. */
export function TrackingMonitorTab({ token }: { token: string }) {
  const load = useServerFn(adminTrackingMonitor);
  const [hours, setHours] = useState<(typeof WINDOWS)[number]>(24);
  const [live, setLive] = useState(true);

  const query = useQuery<TrackingMonitor>({
    queryKey: ["admin-tracking-monitor", token, hours],
    queryFn: () => load({ data: { token, hours } }),
    refetchInterval: live ? 15_000 : false,
  });

  useEffect(() => {
    if (live) void query.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  const data = query.data;
  const chart =
    data?.series.map((point) => ({ ...point, label: time(point.bucket) })) ?? [];
  const totalFailed = data?.totals.reduce((sum, row) => sum + row.failed, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Real-time tracking monitor</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every pixel fire and Conversions API delivery, refreshed automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-hairline bg-surface-2 p-1">
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setHours(w)}
                aria-pressed={hours === w}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  hours === w ? "bg-surface text-foreground" : "text-muted-foreground"
                }`}
              >
                {w}h
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            className="btn-ghost inline-flex items-center gap-1.5 text-sm"
          >
            <Activity className={`size-4 ${live ? "text-primary" : ""}`} aria-hidden="true" />
            {live ? "Live" : "Paused"}
          </button>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="btn-ghost inline-flex items-center gap-1.5 text-sm"
          >
            <RefreshCw
              className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.totals ?? []).map((row) => (
          <div key={row.channel} className="panel p-4">
            <p className="label-mono text-xs text-muted-foreground">
              {CHANNEL_LABEL[row.channel] ?? row.channel}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">{row.sent}</p>
            <p
              className={`mt-1 text-xs ${row.failed > 0 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {row.sent === 0
                ? "No events yet"
                : `${row.successRate.toFixed(1)}% delivered · ${row.failed} failed`}
            </p>
          </div>
        ))}
      </div>

      <div className="panel p-5">
        <h3 className="font-display text-base font-semibold">Events per channel</h3>
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,12,16,0.92)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {(["meta", "tiktok", "ga4", "google_ads"] as const).map((key) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={CHANNEL_LABEL[key] ?? key}
                  stroke={CHANNEL_COLOR[key] ?? "#888"}
                  fill={CHANNEL_COLOR[key] ?? "#888"}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="font-display text-base font-semibold">Latest events</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="label-mono text-xs text-muted-foreground">
              <tr>
                <th className="py-2">Time</th>
                <th>Channel</th>
                <th>Source</th>
                <th>Event</th>
                <th>Status</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {(data?.latest ?? []).map((row, i) => (
                <tr key={`${row.at}-${i}`} className="border-t border-hairline/60">
                  <td className="py-2 whitespace-nowrap text-muted-foreground">{time(row.at)}</td>
                  <td>{CHANNEL_LABEL[row.channel] ?? row.channel}</td>
                  <td className="text-muted-foreground">{row.source}</td>
                  <td>{row.event}</td>
                  <td>
                    {row.ok ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" /> ok
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <XCircle className="size-3.5" aria-hidden="true" /> {row.status ?? "fail"}
                      </span>
                    )}
                  </td>
                  <td className="max-w-[260px] truncate text-muted-foreground">
                    {row.detail ?? "—"}
                  </td>
                </tr>
              ))}
              {(data?.latest.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No tracking events in this window yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="inline-flex items-center gap-2 font-display text-base font-semibold">
          <AlertTriangle
            className={`size-4 ${totalFailed > 0 ? "text-destructive" : "text-muted-foreground"}`}
            aria-hidden="true"
          />
          Failed requests
        </h3>
        {(data?.failures.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No rejected deliveries — every id and token is being accepted.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data?.failures.map((row, i) => (
              <li
                key={`${row.at}-${i}`}
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
              >
                <span className="label-mono text-xs text-muted-foreground">{time(row.at)}</span>{" "}
                <span className="font-medium">
                  {CHANNEL_LABEL[row.channel] ?? row.channel} · {row.event}
                </span>
                {row.status ? (
                  <span className="text-muted-foreground"> · HTTP {row.status}</span>
                ) : null}
                <p className="mt-1 text-muted-foreground">{row.detail ?? "No detail returned"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
