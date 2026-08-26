import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Download, Globe2, RefreshCw, Timer, Users } from "lucide-react";
import { toast } from "sonner";

import { adminAudience, adminExportEvents } from "@/lib/admin.functions";
import { downloadCsv, toCsv } from "@/lib/csv";

type Report = Awaited<ReturnType<typeof adminAudience>>;


const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const pct = (value: number) => `${value.toFixed(1)}%`;
const dur = (sec: number) =>
  sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`;

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        <span className="label-mono">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Table({
  head,
  rows,
}: {
  head: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="label-mono py-2 pr-4 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-hairline">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Visitor-level intelligence: country, source, dwell time, tools, buyers. */
export function AudienceTab({ token }: { token: string }) {
  const run = useServerFn(adminAudience);
  const [days, setDays] = useState(7);
  const [country, setCountry] = useState("");
  const [onlyVip, setOnlyVip] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const load = useMutation({
    mutationFn: () => run({ data: { token, days, country, onlyVip } }),
    onSuccess: setReport,
    onError: () => toast.error("Could not load audience data."),
  });

  useEffect(() => {
    load.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, days, country, onlyVip]);

  const totals = report?.totals;
  const sessions = useMemo(() => report?.sessions.slice(0, 100) ?? [], [report]);

  const stamp = () =>
    `${new Date().toISOString().slice(0, 10)}-${days}d${country ? `-${country}` : ""}`;

  const exportSessions = useMutation({
    mutationFn: () => run({ data: { token, days, country, onlyVip, full: true } }),
    onSuccess: (full) => {
      downloadCsv(
        `sov-sessions-${stamp()}.csv`,
        toCsv(
          [
            "session_id",
            "first_seen",
            "last_seen",
            "country",
            "device",
            "source",
            "utm_campaign",
            "duration_sec",
            "pageviews",
            "events",
            "tools_started",
            "tools_completed",
            "result_viewed",
            "is_vip",
            "purchased_cents",
          ],
          full.sessions.map((s) => [
            s.sessionId,
            s.firstSeen,
            s.lastSeen,
            s.country ?? "",
            s.device ?? "",
            s.source,
            s.utmCampaign ?? "",
            s.durationSec,
            s.pageviews,
            s.events,
            s.toolsStarted.join(" | "),
            s.toolsCompleted.join(" | "),
            s.resultViewed,
            s.isVip || s.purchasedCents > 0,
            s.purchasedCents,
          ]),
        ),
      );
      toast.success(`Exported ${full.sessions.length} sessions.`);
    },
    onError: () => toast.error("Session export failed."),
  });

  const runEvents = useServerFn(adminExportEvents);
  const exportEvents = useMutation({
    mutationFn: () => runEvents({ data: { token, days, country } }),
    onSuccess: (res) => {
      downloadCsv(`sov-events-${stamp()}.csv`, res.csv);
      toast.success(`Exported ${res.rows} raw events.`);
    },
    onError: () => toast.error("Event export failed."),
  });

  const exportSummary = () => {
    if (!report) return;
    const parts: string[] = [
      toCsv(
        ["metric", "value"],
        [
          ["sessions", report.totals.sessions],
          ["completions", report.totals.completions],
          ["completion_rate_pct", report.totals.completionRate.toFixed(2)],
          ["avg_duration_sec", report.totals.avgDurationSec],
          ["purchases", report.totals.purchases],
          ["conversion_rate_pct", report.totals.conversionRate.toFixed(2)],
          ["revenue_cents", report.totals.revenueCents],
        ],
      ),
      "",
      toCsv(
        ["country", "sessions", "completions", "purchases", "avg_duration_sec", "revenue_cents"],
        report.byCountry.map((c) => [
          c.country,
          c.sessions,
          c.completions,
          c.purchases,
          c.avgDurationSec,
          c.revenueCents,
        ]),
      ),
      "",
      toCsv(
        ["source", "sessions", "purchases", "revenue_cents"],
        report.bySource.map((s) => [s.source, s.sessions, s.purchases, s.revenueCents]),
      ),
      "",
      toCsv(
        ["tool", "starts", "completions", "completion_rate_pct"],
        report.byTool.map((t) => [t.tool, t.starts, t.completions, t.completionRate.toFixed(2)]),
      ),
      "",
      toCsv(
        ["buyer_email", "plan", "source", "amount_cents", "created_at", "active"],
        report.buyers.map((b) => [
          b.email,
          b.plan,
          b.source,
          b.amountCents,
          b.createdAt,
          b.active,
        ]),
      ),
    ];
    downloadCsv(`sov-summary-${stamp()}.csv`, parts.join("\r\n"));
    toast.success("Summary exported.");
  };


  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <label className="text-sm">
          <span className="label-mono">Range</span>
          <select
            className="mt-1 block rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[1, 7, 14, 30, 90].map((d) => (
              <option key={d} value={d}>
                Last {d} day{d > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="label-mono">Country</span>
          <input
            className="mt-1 block w-28 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm uppercase"
            value={country}
            maxLength={2}
            placeholder="ALL"
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
          />
        </label>
        <button
          type="button"
          onClick={() => setOnlyVip((v) => !v)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            onlyVip ? "border-primary/50 bg-primary/10" : "border-hairline bg-surface-2"
          }`}
        >
          VIP only
        </button>
        <button
          type="button"
          onClick={() => load.mutate()}
          className="btn-ghost inline-flex items-center gap-1.5 text-sm"
        >
          <RefreshCw className="size-4" aria-hidden="true" /> Refresh
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!report}
            onClick={exportSummary}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden="true" /> Summary CSV
          </button>
          <button
            type="button"
            disabled={exportSessions.isPending}
            onClick={() => exportSessions.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden="true" />
            {exportSessions.isPending ? "Exporting…" : "Sessions CSV"}
          </button>
          <button
            type="button"
            disabled={exportEvents.isPending}
            onClick={() => exportEvents.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden="true" />
            {exportEvents.isPending ? "Exporting…" : "Raw events CSV"}
          </button>
        </div>
      </div>


      {totals ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Users} label="Sessions" value={String(totals.sessions)} />
          <Stat
            icon={Timer}
            label="Avg time on site"
            value={dur(totals.avgDurationSec)}
            hint={`${pct(totals.completionRate)} finished a test`}
          />
          <Stat
            icon={Crown}
            label="VIP purchases"
            value={String(totals.purchases)}
            hint={`${pct(totals.conversionRate)} conversion`}
          />
          <Stat icon={Globe2} label="Revenue" value={money(totals.revenueCents)} />
        </div>
      ) : null}

      {report ? (
        <>
          <div className="panel p-5">
            <h3 className="font-display text-base font-semibold">By country</h3>
            <div className="mt-3">
              <Table
                head={["Country", "Sessions", "Completed", "Buyers", "Avg time", "Revenue"]}
                rows={report.byCountry.map((c) => [
                  c.country,
                  c.sessions,
                  c.completions,
                  c.purchases,
                  dur(c.avgDurationSec),
                  money(c.revenueCents),
                ])}
              />
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="font-display text-base font-semibold">By traffic source</h3>
            <div className="mt-3">
              <Table
                head={["Source", "Sessions", "Buyers", "Revenue"]}
                rows={report.bySource.map((s) => [
                  s.source,
                  s.sessions,
                  s.purchases,
                  money(s.revenueCents),
                ])}
              />
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="font-display text-base font-semibold">Tool conversion</h3>
            <div className="mt-3">
              <Table
                head={["Tool", "Starts", "Completions", "Rate"]}
                rows={report.byTool.map((t) => [
                  t.tool,
                  t.starts,
                  t.completions,
                  pct(t.completionRate),
                ])}
              />
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="font-display text-base font-semibold">VIP buyers</h3>
            <div className="mt-3">
              <Table
                head={["Email", "Plan", "Source", "Amount", "Date", "Status"]}
                rows={report.buyers.map((b) => [
                  b.email,
                  b.plan,
                  b.source,
                  money(b.amountCents),
                  b.createdAt.slice(0, 10),
                  b.active ? "active" : "inactive",
                ])}
              />
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="font-display text-base font-semibold">Recent sessions</h3>
            <div className="mt-3">
              <Table
                head={["Session", "Country", "Device", "Source", "Time", "Tools", "VIP", "Last seen"]}
                rows={sessions.map((s) => [
                  s.sessionId.slice(0, 10),
                  s.country ?? "??",
                  s.device ?? "—",
                  s.source,
                  dur(s.durationSec),
                  `${s.toolsCompleted.length}/${s.toolsStarted.length}`,
                  s.isVip || s.purchasedCents > 0 ? "yes" : "no",
                  s.lastSeen.slice(11, 16),
                ])}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Loading audience data…</p>
      )}
    </div>
  );
}
