/**
 * Weekly ad-performance report generator (server-only).
 *
 * Aggregates the last 7 days of ad + performance telemetry and stores an
 * immutable snapshot in `weekly_reports`, so script load times and the
 * FCP/LCP impact of the ad stack can be compared week over week.
 */
import { aggregate, detectFraud, filterRows, type Row } from "@/lib/analytics-agg";
import { admin } from "@/lib/admin-core.server";

export type WeeklyReport = {
  week_start: string;
  generated_at: string;
  sessions: number;
  impressions: number;
  clicks: number;
  ctr: number;
  rpm: number;
  revenue_cents: number;
  estimated_revenue_cents: number;
  fraud_rate: number;
  filtered_clicks: number;
  scripts: Array<{
    format: string;
    loads: number;
    errors: number;
    avgLoadMs: number;
    p75LoadMs: number;
  }>;
  vitals: Array<{ metric: string; samples: number; avg: number; p75: number }>;
  top_countries: Array<{ country: string; impressions: number; clicks: number; ctr: number }>;
  deltas: {
    impressions: number;
    clicks: number;
    revenue_cents: number;
    lcp: number;
    fcp: number;
  } | null;
  verdict: string[];
};

const SELECT =
  "event_type,slot,variant,session_id,tool_slug,revenue_cents,device,utm_source,created_at,format,zone,is_vip,duration_ms,metric_value,country,ip_hash,suspect,click_id";

function vital(list: Array<{ metric: string; p75: number }>, name: string): number {
  return list.find((v) => v.metric === name)?.p75 ?? 0;
}

function pctDelta(now: number, before: number): number {
  if (before === 0) return now > 0 ? 100 : 0;
  return ((now - before) / before) * 100;
}

/** Builds (and persists) the report for the 7 days ending now. */
export async function generateWeeklyReport(rpmEstimateCents = 120): Promise<WeeklyReport> {
  const db = admin();
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86_400_000);
  const twoWeeksAgo = new Date(now - 14 * 86_400_000);

  const { data, error } = await db
    .from("ad_events")
    .select(SELECT)
    .gte("created_at", twoWeeksAgo.toISOString())
    .limit(100000);
  if (error) throw new Error(error.message);

  const all = (data ?? []) as unknown as Row[];
  const cutoff = weekAgo.toISOString();
  const current = filterRows(
    all.filter((r) => String(r.created_at ?? "") >= cutoff),
    { excludeSuspect: true },
  );
  const previous = filterRows(
    all.filter((r) => String(r.created_at ?? "") < cutoff),
    { excludeSuspect: true },
  );

  const stats = aggregate(current, 7);
  const prev = aggregate(previous, 7);
  const fraud = detectFraud(all.filter((r) => String(r.created_at ?? "") >= cutoff)).summary;

  const estimated = Math.round((stats.totals.impressions / 1000) * rpmEstimateCents);
  const lcp = vital(stats.vitals, "LCP");
  const fcp = vital(stats.vitals, "FCP");
  const cls = vital(stats.vitals, "CLS");

  const verdict: string[] = [];
  const slowest = [...stats.scriptPerf].sort((a, b) => b.p75LoadMs - a.p75LoadMs)[0];
  if (slowest && slowest.p75LoadMs > 1200) {
    verdict.push(
      `${slowest.format} script is slow (p75 ${slowest.p75LoadMs}ms) — consider delaying or disabling it.`,
    );
  }
  if (lcp > 2500) verdict.push(`LCP p75 is ${Math.round(lcp)}ms (target <2500ms).`);
  if (fcp > 1800) verdict.push(`FCP p75 is ${Math.round(fcp)}ms (target <1800ms).`);
  if (cls > 0.1) verdict.push(`CLS p75 is ${cls.toFixed(3)} (target <0.1) — ad slots may be shifting layout.`);
  if (fraud.fraudRate > 15) verdict.push(`${fraud.fraudRate.toFixed(1)}% of clicks look invalid.`);
  const errored = stats.scriptPerf.filter((s) => s.errors > 0);
  for (const s of errored) verdict.push(`${s.format} failed to load ${s.errors} time(s).`);
  if (verdict.length === 0) verdict.push("Ad stack healthy: no performance or quality regressions.");

  const report: WeeklyReport = {
    week_start: weekAgo.toISOString().slice(0, 10),
    generated_at: new Date(now).toISOString(),
    sessions: stats.sessions,
    impressions: stats.totals.impressions,
    clicks: stats.totals.clicks,
    ctr: stats.totals.ctr,
    rpm: stats.totals.rpm,
    revenue_cents: stats.totals.revenueCents,
    estimated_revenue_cents: estimated,
    fraud_rate: fraud.fraudRate,
    filtered_clicks: fraud.filteredClicks,
    scripts: stats.scriptPerf.map((s) => ({
      format: s.format,
      loads: s.loads,
      errors: s.errors,
      avgLoadMs: s.avgLoadMs,
      p75LoadMs: s.p75LoadMs,
    })),
    vitals: stats.vitals,
    top_countries: stats.byCountry.slice(0, 10).map((c) => ({
      country: c.key,
      impressions: c.impressions,
      clicks: c.clicks,
      ctr: c.ctr,
    })),
    deltas: previous.length
      ? {
          impressions: pctDelta(stats.totals.impressions, prev.totals.impressions),
          clicks: pctDelta(stats.totals.clicks, prev.totals.clicks),
          revenue_cents: pctDelta(stats.totals.revenueCents, prev.totals.revenueCents),
          lcp: pctDelta(lcp, vital(prev.vitals, "LCP")),
          fcp: pctDelta(fcp, vital(prev.vitals, "FCP")),
        }
      : null,
    verdict,
  };

  await db
    .from("weekly_reports")
    .upsert({ week_start: report.week_start, payload: report }, { onConflict: "week_start" });

  return report;
}

export async function listWeeklyReports(limit = 12): Promise<WeeklyReport[]> {
  const { data, error } = await admin()
    .from("weekly_reports")
    .select("payload")
    .order("week_start", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.payload as WeeklyReport);
}
