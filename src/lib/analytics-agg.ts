
export type SlotStat = {
  key: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenueCents: number;
  ctr: number;
  rpm: number;
};

export type MonetizationStats = {
  days: number;
  totals: SlotStat;
  bySlot: SlotStat[];
  byVariant: SlotStat[];
  byDevice: SlotStat[];
  bySource: SlotStat[];
  tools: Array<{ slug: string; starts: number; completes: number; conversion: number }>;
  gate: { shown: number; completed: number; completion: number };
  sessions: number;
};

export type Row = {
  event_type: string;
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
  };
}
