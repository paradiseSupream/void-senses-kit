import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Radio, RefreshCw, Search } from "lucide-react";

import { adminPixelDebug } from "@/lib/ads-intel.functions";
import type { PixelDebugReport } from "@/lib/ads-intel.types";

const time = (iso: string) => new Date(iso).toLocaleString();

/**
 * Live Meta Pixel / CAPI debug panel: pairs each browser pixel fire with its
 * server-side delivery by `event_id` so de-duplication can be verified for
 * every campaign visit, Purchase events first.
 */
export function PixelDebugTab({ token }: { token: string }) {
  const load = useServerFn(adminPixelDebug);
  const [onlyPurchase, setOnlyPurchase] = useState(false);
  const [live, setLive] = useState(true);
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const query = useQuery<PixelDebugReport>({
    queryKey: ["admin-pixel-debug", token, onlyPurchase, eventId],
    queryFn: () => load({ data: { token, limit: 80, onlyPurchase, eventId } }),
    refetchInterval: live ? 8_000 : false,
  });

  const data = query.data;

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Radio className="size-4 text-primary" aria-hidden="true" />
            Pixel &amp; CAPI live debug
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every conversion carries one <code className="font-mono">event_id</code>. When both the
            browser pixel and the server API report it, Meta de-duplicates automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setEventId(search.trim());
            }}
            className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-2"
          >
            <Search className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Inspect event_id…"
              aria-label="Search by event id"
              className="w-40 bg-transparent py-1.5 font-mono text-xs outline-none"
            />
            {eventId ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setEventId("");
                }}
                className="text-xs text-muted-foreground"
              >
                clear
              </button>
            ) : null}
          </form>
          <button
            type="button"
            onClick={() => setOnlyPurchase((value) => !value)}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              onlyPurchase ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            Purchase only
          </button>
          <button
            type="button"
            onClick={() => setLive((value) => !value)}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              live ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            {live ? "Live" : "Paused"}
          </button>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Events", data?.summary.total ?? 0],
          ["Purchases", data?.summary.purchases ?? 0],
          ["De-duplicated", data?.summary.deduplicated ?? 0],
          ["Browser only", data?.summary.browserOnly ?? 0],
          ["Server only", data?.summary.serverOnly ?? 0],
          ["Failures", data?.summary.failures ?? 0],
        ].map(([label, value]) => (
          <div key={label as string} className="panel p-3">
            <span className="label-mono">{label as string}</span>
            <p className="mt-1 font-display text-xl font-semibold">{value as number}</p>
          </div>
        ))}
      </div>

      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-hairline">
              {["When", "Event", "Event ID", "Browser", "Server", "Dedup", "Issues"].map((head) => (
                <th key={head} className="px-3 py-2 text-xs font-medium tracking-wide uppercase">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.pairs ?? []).flatMap((pair) => [
              <tr
                key={pair.eventId}
                onClick={() => setOpen(open === pair.eventId ? null : pair.eventId)}
                className="cursor-pointer border-b border-hairline/60 align-top hover:bg-surface-2/50"
              >
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{time(pair.at)}</td>
                <td className="px-3 py-2 font-medium">{pair.event}</td>
                <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs">{pair.eventId}</td>
                <td className="px-3 py-2 text-xs">{pair.browser.join(", ") || "—"}</td>
                <td className="px-3 py-2 text-xs">{pair.server.join(", ") || "—"}</td>
                <td className="px-3 py-2">
                  {pair.deduplicated ? (
                    <CheckCircle2 className="size-4 text-primary" aria-label="De-duplicated" />
                  ) : (
                    <AlertTriangle className="size-4 text-muted-foreground" aria-label="Single source" />
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-destructive">{pair.failed.join(" · ")}</td>
              </tr>,
              open === pair.eventId ? (
                <tr key={`${pair.eventId}-detail`} className="border-b border-hairline/60">
                  <td colSpan={7} className="bg-surface-2/40 px-3 py-3">
                    <p className="label-mono">Deliveries for {pair.eventId}</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      {(pair.deliveries ?? []).map((delivery, index) => (
                        <li
                          key={`${delivery.channel}-${delivery.source}-${index}`}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <span className={delivery.ok ? "text-primary" : "text-destructive"}>
                            {delivery.ok ? "OK" : "FAIL"}
                          </span>
                          <span className="font-medium">{delivery.channel}</span>
                          <span className="text-muted-foreground">{delivery.source}</span>
                          <span className="font-mono text-muted-foreground">
                            {delivery.status ?? "—"}
                          </span>
                          <span className="text-muted-foreground">{time(delivery.at)}</span>
                          {delivery.detail ? (
                            <span className="text-muted-foreground">· {delivery.detail}</span>
                          ) : null}
                        </li>
                      ))}
                      {(pair.deliveries ?? []).length === 0 ? (
                        <li className="text-muted-foreground">No delivery detail recorded.</li>
                      ) : null}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {pair.deduplicated
                        ? "Browser and server both reported this event_id — Meta keeps one."
                        : "Only one source reported this event_id, so there is nothing to de-duplicate."}
                    </p>
                  </td>
                </tr>
              ) : null,
            ])}
            {data && data.pairs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  No pixel activity recorded yet.
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
