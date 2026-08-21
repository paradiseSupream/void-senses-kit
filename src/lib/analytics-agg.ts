
export type SlotStat = {
  key: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenueCents: number;
  ctr: number;
  rpm: number;
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

export type MonetizationStats = {
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
  };
}

function finalize(stat: SlotStat): SlotStat {
  return {
    ...stat,
    ctr: stat.impressions > 0 ? (stat.clicks / stat.impressions) * 100 : 0,
    rpm: stat.impressions > 0 ? (stat.revenueCents / 100 / stat.impressions) * 1000 : 0,
  };
}

function group(rows: Row[], pick: (row: Row) => string): SlotStat[] {
  const map = new Map<string, SlotStat>();
  for (const row of rows) {
    const key = pick(row) || "unknown";
    const stat = map.get(key) ?? empty(key);
    if (row.event_type === "impression") stat.impressions += 1;
    if (row.event_type === "click") stat.clicks += 1;
    if (row.event_type === "conversion") stat.conversions += 1;
    stat.revenueCents += row.revenue_cents ?? 0;
    map.set(key, stat);
  }
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

  return {
    days,
    totals,
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
