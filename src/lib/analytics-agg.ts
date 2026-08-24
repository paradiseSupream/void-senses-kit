
export type SlotStat = {
  key: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenueCents: number;
  ctr: number;
  rpm: number;
  /** Revenue per 1000 ad impressions. */
  ecpm: number;
  /** Distinct sessions that produced these rows. */
  sessions: number;
};

export type FormatPerf = {
  format: string;
  loads: number;
  errors: number;
  blocked: number;
  avgLoadMs: number;
  p75LoadMs: number;
};

export type Vitals = { metric: string; samples: number; avg: number; p75: number };

export type EventFilters = {
  country?: string | undefined;
  device?: string | undefined;
  format?: string | undefined;
  slot?: string | undefined;
  audience?: "all" | "vip" | "free" | undefined;
  /** Drop bot / duplicate-IP / impossible-CTR traffic from every number. */
  excludeSuspect?: boolean | undefined;
};

export type FraudSummary = {
  totalClicks: number;
  botClicks: number;
  duplicateIpClicks: number;
  noImpressionClicks: number;
  burstSessions: number;
  filteredClicks: number;
  fraudRate: number;
  topOffenders: Array<{ key: string; clicks: number; reason: string }>;
};

export type TimePoint = {
  bucket: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenueCents: number;
};

export type FunnelStep = {
  step: string;
  sessions: number;
  /** % of the sessions that reached the first step. */
  ofVisit: number;
  /** % of the sessions that reached the previous step. */
  ofPrevious: number;
  dropOff: number;
  avgDwellMs: number;
};

export type ToolRevenue = SlotStat & {
  starts: number;
  completes: number;
  completion: number;
  /** Ad revenue per 1000 sessions that touched this tool. */
  sessionConversion: number;
};

/** One geo / device / landing-source segment with full acquisition metrics. */
export type Cohort = {
  key: string;
  sessions: number;
  bounces: number;
  bounceRate: number;
  starts: number;
  startRate: number;
  completes: number;
  completionRate: number;
  revenueCents: number;
  rpm: number;
  /** Revenue per visitor in dollars — the number that must beat your CPC. */
  rpv: number;
  vips: number;
  vipRate: number;
};

export type MonetizationStats = {
  cohorts: { geo: Cohort[]; device: Cohort[]; source: Cohort[] };
  funnel: FunnelStep[];
  byTool: ToolRevenue[];
  /** Creative (utm_source) x tool matrix for ad A/B testing. */
  creativeTool: Cohort[];
  /** Ad placement variant cohorts with VIP conversion, not just ad revenue. */
  placementCohorts: Cohort[];
  experiments: Array<{
    slot: string;
    arms: Array<{ arm: string; exposures: number; conversions: number; rate: number }>;
  }>;
  byCountry: SlotStat[];
  timeseries: TimePoint[];
  fraud: FraudSummary;
  recent: Array<{
    at: string;
    event_type: string;
    slot: string;
    country: string | null;
    device: string | null;
    click_id: string | null;
    suspect: boolean;
    revenueCents: number;
  }>;
  days: number;
  /** Site-wide revenue per visitor in dollars = your max profitable CPC. */
  rpv: number;
  totals: SlotStat;
  bySlot: SlotStat[];
  byVariant: SlotStat[];
  byDevice: SlotStat[];
  bySource: SlotStat[];
  tools: Array<{ slug: string; starts: number; completes: number; conversion: number }>;
  gate: { shown: number; completed: number; completion: number };
  sessions: number;
  byFormat: SlotStat[];
  byZone: SlotStat[];
  vipSplit: SlotStat[];
  scriptPerf: FormatPerf[];
  vitals: Vitals[];
  consent: { accepted: number; essential: number; blocked: number; rate: number };
};

export type Row = {
  event_type: string;
  country?: string | null;
  ip_hash?: string | null;
  ua_hash?: string | null;
  suspect?: boolean | null;
  click_id?: string | null;
  created_at?: string | null;
  format?: string | null;
  zone?: string | null;
  is_vip?: boolean | null;
  duration_ms?: number | null;
  metric_value?: number | null;
  slot: string;
  variant: string;
  session_id: string;
  tool_slug: string | null;
  revenue_cents: number;
  device: string | null;
  utm_source: string | null;
};

function empty(key: string): SlotStat {
  return {
    key,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenueCents: 0,
    ctr: 0,
    rpm: 0,
    ecpm: 0,
    sessions: 0,
  };
}

function finalize(stat: SlotStat): SlotStat {
  const dollars = stat.revenueCents / 100;
  return {
    ...stat,
    ctr: stat.impressions > 0 ? (stat.clicks / stat.impressions) * 100 : 0,
    // RPM = revenue per 1000 sessions (falls back to impressions when we have
    // no session information, e.g. imported rows).
    rpm:
      stat.sessions > 0
        ? (dollars / stat.sessions) * 1000
        : stat.impressions > 0
          ? (dollars / stat.impressions) * 1000
          : 0,
    ecpm: stat.impressions > 0 ? (dollars / stat.impressions) * 1000 : 0,
  };
}

function group(rows: Row[], pick: (row: Row) => string): SlotStat[] {
  const map = new Map<string, SlotStat>();
  const sessions = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = pick(row) || "unknown";
    const stat = map.get(key) ?? empty(key);
    if (row.event_type === "impression") stat.impressions += 1;
    if (row.event_type === "click") stat.clicks += 1;
    if (row.event_type === "conversion") stat.conversions += 1;
    stat.revenueCents += row.revenue_cents ?? 0;
    map.set(key, stat);
    const seen = sessions.get(key) ?? new Set<string>();
    seen.add(row.session_id);
    sessions.set(key, seen);
  }
  for (const [key, stat] of map) stat.sessions = sessions.get(key)?.size ?? 0;
  return [...map.values()].map(finalize).sort((a, b) => b.revenueCents - a.revenueCents || b.impressions - a.impressions);
}

/** Heuristic fake-traffic detection; returns the click rows we consider invalid. */
export function detectFraud(list: Row[]): { invalid: Set<Row>; summary: FraudSummary } {
  const clicks = list.filter((r) => r.event_type === "click");
  const invalid = new Set<Row>();
  const reasons = new Map<string, { clicks: number; reason: string }>();

  const flag = (row: Row, key: string, reason: string) => {
    invalid.add(row);
    const entry = reasons.get(key) ?? { clicks: 0, reason };
    entry.clicks += 1;
    entry.reason = reason;
    reasons.set(key, entry);
  };

  // 1. Declared bot / headless traffic.
  let botClicks = 0;
  for (const row of clicks) {
    if (row.suspect) {
      botClicks += 1;
      flag(row, row.ip_hash || row.session_id, "bot signature");
    }
  }

  // 2. Same anonymous IP hash clicking far more than a human would.
  const byIp = new Map<string, Row[]>();
  for (const row of clicks) {
    const key = row.ip_hash || `session:${row.session_id}`;
    byIp.set(key, [...(byIp.get(key) ?? []), row]);
  }
  let duplicateIpClicks = 0;
  for (const [key, rows] of byIp) {
    if (rows.length <= 5) continue;
    for (const row of rows.slice(5)) {
      duplicateIpClicks += 1;
      flag(row, key, "duplicate IP burst");
    }
  }

  // 3. Clicks from sessions that never recorded an impression.
  const impressionSessions = new Set(
    list.filter((r) => r.event_type === "impression").map((r) => r.session_id),
  );
  let noImpressionClicks = 0;
  for (const row of clicks) {
    if (!impressionSessions.has(row.session_id)) {
      noImpressionClicks += 1;
      flag(row, row.ip_hash || row.session_id, "click without impression");
    }
  }

  // 4. Sessions with an impossible CTR (>60% with meaningful volume).
  const sessionStats = new Map<string, { impressions: number; clicks: Row[] }>();
  for (const row of list) {
    if (row.event_type !== "impression" && row.event_type !== "click") continue;
    const entry = sessionStats.get(row.session_id) ?? { impressions: 0, clicks: [] };
    if (row.event_type === "impression") entry.impressions += 1;
    else entry.clicks.push(row);
    sessionStats.set(row.session_id, entry);
  }
  let burstSessions = 0;
  for (const [session, entry] of sessionStats) {
    const total = entry.impressions + entry.clicks.length;
    if (total < 6) continue;
    if (entry.clicks.length / total <= 0.6) continue;
    burstSessions += 1;
    for (const row of entry.clicks) flag(row, session, "impossible CTR");
  }

  const topOffenders = [...reasons.entries()]
    .map(([key, v]) => ({ key, clicks: v.clicks, reason: v.reason }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return {
    invalid,
    summary: {
      totalClicks: clicks.length,
      botClicks,
      duplicateIpClicks,
      noImpressionClicks,
      burstSessions,
      filteredClicks: invalid.size,
      fraudRate: clicks.length > 0 ? (invalid.size / clicks.length) * 100 : 0,
      topOffenders,
    },
  };
}

/** Applies the dashboard filters (country / device / format / audience). */
export function filterRows(list: Row[], filters: EventFilters = {}): Row[] {
  const { invalid } = detectFraud(list);
  return list.filter((row) => {
    if (filters.country && (row.country ?? "??") !== filters.country) return false;
    if (filters.device && (row.device ?? "unknown") !== filters.device) return false;
    if (filters.format && (row.format ?? row.slot) !== filters.format) return false;
    if (filters.slot && row.slot !== filters.slot) return false;
    if (filters.audience === "vip" && !row.is_vip) return false;
    if (filters.audience === "free" && row.is_vip) return false;
    if (filters.excludeSuspect && (row.suspect || invalid.has(row))) return false;
    return true;
  });
}

function timeseries(rows: Row[], days: number): TimePoint[] {
  const hourly = days <= 2;
  const map = new Map<string, TimePoint>();
  for (const row of rows) {
    const at = row.created_at;
    if (!at) continue;
    const bucket = hourly ? `${at.slice(0, 13)}:00` : at.slice(0, 10);
    const point =
      map.get(bucket) ?? { bucket, impressions: 0, clicks: 0, conversions: 0, revenueCents: 0 };
    if (row.event_type === "impression") point.impressions += 1;
    if (row.event_type === "click") point.clicks += 1;
    if (row.event_type === "conversion") point.conversions += 1;
    point.revenueCents += row.revenue_cents ?? 0;
    map.set(bucket, point);
  }
  return [...map.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
}

const FUNNEL_ORDER = [
  "visit",
  "test_start",
  "return_1m",
  "return_3m",
  "result_view",
  "vip_gate_shown",
  "vip_downgrade",
  "vip_purchase",
] as const;

/** Rebuilds the visit → test → dwell → result → VIP funnel from event rows. */
/**
 * Session-level acquisition cohorts.
 *
 * A session counts as: started when it fired `test_start` / `tool_start`,
 * completed when it fired `result_view` / `tool_complete`, bounced when it
 * never started anything, and converted when it fired `vip_purchase`.
 */
export function buildCohorts(list: Row[], pick: (row: Row) => string): Cohort[] {
  type Agg = {
    started: boolean;
    completed: boolean;
    vip: boolean;
    revenueCents: number;
  };
  const dim = new Map<string, string>();
  const sessions = new Map<string, Agg>();

  for (const row of list) {
    const sid = row.session_id || "unknown";
    if (!dim.has(sid)) dim.set(sid, pick(row) || "unknown");
    const agg = sessions.get(sid) ?? {
      started: false,
      completed: false,
      vip: false,
      revenueCents: 0,
    };
    const funnelStep = row.event_type === "funnel" ? row.slot : "";
    if (row.event_type === "tool_start" || funnelStep === "test_start") agg.started = true;
    if (row.event_type === "tool_complete" || funnelStep === "result_view") agg.completed = true;
    if (funnelStep === "vip_purchase" || row.event_type === "conversion") agg.vip = true;
    agg.revenueCents += row.revenue_cents ?? 0;
    sessions.set(sid, agg);
  }

  const map = new Map<string, Cohort>();
  for (const [sid, agg] of sessions) {
    const key = dim.get(sid) ?? "unknown";
    const cohort =
      map.get(key) ??
      {
        key,
        sessions: 0,
        bounces: 0,
        bounceRate: 0,
        starts: 0,
        startRate: 0,
        completes: 0,
        completionRate: 0,
        revenueCents: 0,
        rpm: 0,
        rpv: 0,
        vips: 0,
        vipRate: 0,
      };
    cohort.sessions += 1;
    if (agg.started) cohort.starts += 1;
    else cohort.bounces += 1;
    if (agg.completed) cohort.completes += 1;
    if (agg.vip) cohort.vips += 1;
    cohort.revenueCents += agg.revenueCents;
    map.set(key, cohort);
  }

  return [...map.values()]
    .map((c) => ({
      ...c,
      bounceRate: c.sessions > 0 ? (c.bounces / c.sessions) * 100 : 0,
      startRate: c.sessions > 0 ? (c.starts / c.sessions) * 100 : 0,
      completionRate: c.starts > 0 ? (c.completes / c.starts) * 100 : 0,
      rpm: c.sessions > 0 ? (c.revenueCents / 100 / c.sessions) * 1000 : 0,
      rpv: c.sessions > 0 ? c.revenueCents / 100 / c.sessions : 0,
      vipRate: c.sessions > 0 ? (c.vips / c.sessions) * 100 : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

export function buildFunnel(list: Row[]): FunnelStep[] {
  const sessions = new Map<string, Set<string>>();
  const dwell = new Map<string, number[]>();
  for (const row of list) {
    if (row.event_type !== "funnel") continue;
    const step = row.slot;
    const set = sessions.get(step) ?? new Set<string>();
    set.add(row.session_id);
    sessions.set(step, set);
    const times = dwell.get(step) ?? [];
    times.push(Number(row.duration_ms ?? 0));
    dwell.set(step, times);
  }
  const first = sessions.get("visit")?.size ?? 0;
  let previous = 0;
  return FUNNEL_ORDER.map((step, index) => {
    const count = sessions.get(step)?.size ?? 0;
    const times = dwell.get(step) ?? [];
    const entry: FunnelStep = {
      step,
      sessions: count,
      ofVisit: first > 0 ? (count / first) * 100 : 0,
      ofPrevious: index === 0 ? 100 : previous > 0 ? (count / previous) * 100 : 0,
      dropOff: index === 0 ? 0 : Math.max(0, previous - count),
      avgDwellMs: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
    };
    previous = count;
    return entry;
  });
}

/** Per-tool ad economics joined with quiz start/complete rates. */
export function buildToolRevenue(list: Row[]): ToolRevenue[] {
  const slugs = new Set<string>();
  for (const row of list) if (row.tool_slug) slugs.add(row.tool_slug);

  const adRows = list.filter(
    (r) => r.tool_slug && ["impression", "click", "conversion"].includes(r.event_type),
  );
  const stats = new Map(group(adRows, (r) => r.tool_slug ?? "site").map((s) => [s.key, s]));

  return [...slugs]
    .map((slug) => {
      const base = stats.get(slug) ?? empty(slug);
      const starts = list.filter((r) => r.event_type === "tool_start" && r.tool_slug === slug).length;
      const completes = list.filter(
        (r) => r.event_type === "tool_complete" && r.tool_slug === slug,
      ).length;
      const touched = new Set(list.filter((r) => r.tool_slug === slug).map((r) => r.session_id));
      return {
        ...base,
        key: slug,
        starts,
        completes,
        completion: starts > 0 ? (completes / starts) * 100 : 0,
        sessionConversion: touched.size > 0 ? (completes / touched.size) * 100 : 0,
      };
    })
    .sort((a, b) => b.revenueCents - a.revenueCents || b.starts - a.starts);
}

/** A/B copy experiments: exposure per arm vs. sessions that started a test. */
export function buildExperiments(list: Row[]) {
  const converted = new Set(
    list.filter((r) => r.event_type === "funnel" && r.slot === "test_start").map((r) => r.session_id),
  );
  const bySlot = new Map<string, Map<string, { exposures: number; sessions: Set<string> }>>();
  for (const row of list) {
    if (row.event_type !== "experiment") continue;
    const arm = row.format || row.variant || "control";
    const arms = bySlot.get(row.slot) ?? new Map();
    const entry = arms.get(arm) ?? { exposures: 0, sessions: new Set<string>() };
    entry.exposures += 1;
    entry.sessions.add(row.session_id);
    arms.set(arm, entry);
    bySlot.set(row.slot, arms);
  }
  return [...bySlot.entries()].map(([slot, arms]) => ({
    slot,
    arms: [...arms.entries()]
      .map(([arm, v]) => {
        const conversions = [...v.sessions].filter((id) => converted.has(id)).length;
        return {
          arm,
          exposures: v.sessions.size,
          conversions,
          rate: v.sessions.size > 0 ? (conversions / v.sessions.size) * 100 : 0,
        };
      })
      .sort((a, b) => b.rate - a.rate),
  }));
}

export function aggregate(list: Row[], days: number): MonetizationStats {
  const totals = finalize(
    list.reduce((acc, row) => {
      if (row.event_type === "impression") acc.impressions += 1;
      if (row.event_type === "click") acc.clicks += 1;
      if (row.event_type === "conversion") acc.conversions += 1;
      acc.revenueCents += row.revenue_cents ?? 0;
      return acc;
    }, empty("all")),
  );

  const adRows = list.filter((r) => ["impression", "click", "conversion"].includes(r.event_type));

  const toolMap = new Map<string, { starts: number; completes: number }>();
  for (const row of list) {
    if (row.event_type !== "tool_start" && row.event_type !== "tool_complete") continue;
    const slug = row.tool_slug ?? row.slot;
    const entry = toolMap.get(slug) ?? { starts: 0, completes: 0 };
    if (row.event_type === "tool_start") entry.starts += 1;
    else entry.completes += 1;
    toolMap.set(slug, entry);
  }

  const perfMap = new Map<string, { loads: number[]; errors: number; blocked: number }>();
  for (const row of list) {
    if (!["script_load", "script_error", "script_blocked"].includes(row.event_type)) continue;
    const key = row.format || row.slot || "unknown";
    const entry = perfMap.get(key) ?? { loads: [], errors: 0, blocked: 0 };
    if (row.event_type === "script_load") entry.loads.push(Number(row.duration_ms ?? 0));
    if (row.event_type === "script_error") entry.errors += 1;
    if (row.event_type === "script_blocked") entry.blocked += 1;
    perfMap.set(key, entry);
  }
  const scriptPerf: FormatPerf[] = [...perfMap.entries()].map(([format, v]) => {
    const sorted = [...v.loads].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      format,
      loads: sorted.length,
      errors: v.errors,
      blocked: v.blocked,
      avgLoadMs: sorted.length ? Math.round(sum / sorted.length) : 0,
      p75LoadMs: sorted.length ? Math.round(sorted[Math.floor(sorted.length * 0.75)] ?? 0) : 0,
    };
  });

  const vitalMap = new Map<string, number[]>();
  for (const row of list) {
    if (row.event_type !== "web_vital") continue;
    const values = vitalMap.get(row.slot) ?? [];
    values.push(Number(row.metric_value ?? 0));
    vitalMap.set(row.slot, values);
  }
  const vitals: Vitals[] = [...vitalMap.entries()].map(([metric, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      metric,
      samples: sorted.length,
      avg: Math.round((sum / sorted.length) * 1000) / 1000,
      p75: Math.round((sorted[Math.floor(sorted.length * 0.75)] ?? 0) * 1000) / 1000,
    };
  });

  const consentAccepted = list.filter(
    (r) => r.event_type === "consent" && r.slot === "all",
  ).length;
  const consentEssential = list.filter(
    (r) => r.event_type === "consent" && r.slot === "essential",
  ).length;
  const consentBlocked = list.filter((r) => r.event_type === "script_blocked").length;

  const gateShown = list.filter((r) => r.event_type === "gate_shown").length;
  const gateCompleted = list.filter((r) => r.event_type === "gate_completed").length;

  const uniqueSessions = new Set(list.map((r) => r.session_id)).size;

  return {
    days,
    rpv: uniqueSessions > 0 ? totals.revenueCents / 100 / uniqueSessions : 0,
    totals,
    funnel: buildFunnel(list),
    cohorts: {
      geo: buildCohorts(list, (r) => r.country ?? "??"),
      device: buildCohorts(list, (r) => r.device ?? "unknown"),
      source: buildCohorts(list, (r) => r.utm_source ?? "direct"),
    },
    byTool: buildToolRevenue(list),
    experiments: buildExperiments(list),
    bySlot: group(adRows, (r) => r.slot),
    byVariant: group(adRows, (r) => r.variant),
    byDevice: group(adRows, (r) => r.device ?? "unknown"),
    bySource: group(adRows, (r) => r.utm_source ?? "direct"),
    tools: [...toolMap.entries()]
      .map(([slug, v]) => ({
        slug,
        starts: v.starts,
        completes: v.completes,
        conversion: v.starts > 0 ? (v.completes / v.starts) * 100 : 0,
      }))
      .sort((a, b) => b.starts - a.starts),
    gate: {
      shown: gateShown,
      completed: gateCompleted,
      completion: gateShown > 0 ? (gateCompleted / gateShown) * 100 : 0,
    },
    sessions: new Set(list.map((r) => r.session_id)).size,
    byFormat: group(adRows, (r) => r.format || r.slot),
    byZone: group(adRows, (r) => r.zone || r.slot),
    vipSplit: group(adRows, (r) => (r.is_vip ? "vip" : "free")),
    scriptPerf: scriptPerf.sort((a, b) => b.loads - a.loads),
    vitals,
    byCountry: group(adRows, (r) => r.country ?? "??"),
    timeseries: timeseries(adRows, days),
    fraud: detectFraud(list).summary,
    recent: [...list]
      .filter((r) => ["impression", "click", "conversion"].includes(r.event_type))
      .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
      .slice(0, 40)
      .map((r) => ({
        at: r.created_at ?? "",
        event_type: r.event_type,
        slot: r.slot,
        country: r.country ?? null,
        device: r.device ?? null,
        click_id: r.click_id ?? null,
        suspect: Boolean(r.suspect),
        revenueCents: r.revenue_cents ?? 0,
      })),
    consent: {
      accepted: consentAccepted,
      essential: consentEssential,
      blocked: consentBlocked,
      rate:
        consentAccepted + consentEssential > 0
          ? (consentAccepted / (consentAccepted + consentEssential)) * 100
          : 0,
    },
  };
}
