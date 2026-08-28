/**
 * Server-only aggregation for the paid-ads intelligence surfaces.
 *
 * Everything is rebuilt from the `ad_events` log (one row per visitor signal)
 * and the `tracking_events` delivery log, so no extra tables are needed.
 */

import type {
  AttributionReport,
  AttributionRow,
  CreativeReport,
  CreativeRow,
  FunnelCounts,
  PixelDebugReport,
  PixelEventPair,
  RetargetReport,
  RetargetSegment,
} from "@/lib/ads-intel.types";

type Row = {
  event_type: string;
  slot: string;
  session_id: string;
  tool_slug: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  ad_click_id: string | null;
  ad_platform: string | null;
  referrer: string | null;
  revenue_cents: number | null;
  suspect: boolean | null;
  created_at: string;
};

/** One visitor session reduced to the funnel steps it reached. */
export type SessionFacts = {
  sessionId: string;
  source: string;
  campaign: string;
  creative: string;
  platform: string;
  clickId: string | null;
  testStart: boolean;
  resultView: boolean;
  gateShown: boolean;
  purchase: boolean;
  revenueCents: number;
  lastSeen: string;
};

const SELECT =
  "event_type,slot,session_id,tool_slug,utm_source,utm_campaign,utm_content,ad_click_id,ad_platform,referrer,revenue_cents,suspect,created_at";

function hostOf(referrer: string | null): string {
  if (!referrer) return "direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }
}

/** Loads the raw events for a window and folds them into per-session facts. */
export async function loadSessions(days: number): Promise<SessionFacts[]> {
  const { admin } = await import("@/lib/admin-core.server");
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await admin()
    .from("ad_events")
    .select(SELECT)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(50000);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Row[];
  const map = new Map<string, SessionFacts>();

  for (const row of rows) {
    if (row.suspect) continue;
    let s = map.get(row.session_id);
    if (!s) {
      s = {
        sessionId: row.session_id,
        source: row.utm_source ?? hostOf(row.referrer),
        campaign: row.utm_campaign ?? "(none)",
        creative: row.utm_content ?? "unattributed",
        platform: row.ad_platform ?? (row.utm_source ? "utm" : "organic"),
        clickId: row.ad_click_id ?? null,
        testStart: false,
        resultView: false,
        gateShown: false,
        purchase: false,
        revenueCents: 0,
        lastSeen: row.created_at,
      };
      map.set(row.session_id, s);
    }
    s.lastSeen = row.created_at;
    if (!s.clickId && row.ad_click_id) s.clickId = row.ad_click_id;
    if (s.creative === "unattributed" && row.utm_content) s.creative = row.utm_content;
    if (s.campaign === "(none)" && row.utm_campaign) s.campaign = row.utm_campaign;

    if (row.event_type === "tool_start" || (row.event_type === "funnel" && row.slot === "test_start")) {
      s.testStart = true;
    }
    if (row.event_type === "funnel" && row.slot === "result_view") s.resultView = true;
    if (
      (row.event_type === "funnel" && row.slot === "vip_gate_shown") ||
      row.event_type === "gate_shown"
    ) {
      s.gateShown = true;
    }
    if (
      (row.event_type === "funnel" && row.slot === "vip_purchase") ||
      (row.event_type === "conversion" && (row.revenue_cents ?? 0) > 0)
    ) {
      s.purchase = true;
      s.revenueCents += row.revenue_cents ?? 0;
    }
  }

  return [...map.values()];
}

function emptyFunnel(): FunnelCounts {
  return { sessions: 0, testStart: 0, resultView: 0, gateShown: 0, purchase: 0 };
}

function addTo(funnel: FunnelCounts, s: SessionFacts) {
  funnel.sessions += 1;
  if (s.testStart) funnel.testStart += 1;
  if (s.resultView) funnel.resultView += 1;
  if (s.gateShown) funnel.gateShown += 1;
  if (s.purchase) funnel.purchase += 1;
}

const rate = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

/** Creative-level A/B report: which FB creative converts VIP best. */
export function buildCreativeReport(
  sessions: SessionFacts[],
  days: number,
  minSample: number,
): CreativeReport {
  const groups = new Map<string, { row: CreativeRow }>();
  const totals = emptyFunnel();

  for (const s of sessions) {
    addTo(totals, s);
    const key = s.creative;
    let entry = groups.get(key);
    if (!entry) {
      entry = {
        row: {
          creative: key,
          campaign: s.campaign,
          source: s.source,
          platform: s.platform,
          funnel: emptyFunnel(),
          vipConvRate: 0,
          revenueCents: 0,
          rpmCents: 0,
          winner: false,
        },
      };
      groups.set(key, entry);
    }
    addTo(entry.row.funnel, s);
    entry.row.revenueCents += s.revenueCents;
  }

  const rows = [...groups.values()].map(({ row }) => {
    row.vipConvRate = rate(row.funnel.purchase, row.funnel.sessions);
    row.rpmCents = row.funnel.sessions > 0 ? (row.revenueCents / row.funnel.sessions) * 1000 : 0;
    return row;
  });

  const eligible = rows.filter(
    (row) => row.creative !== "unattributed" && row.funnel.sessions >= minSample,
  );
  const best = eligible.sort((a, b) => b.vipConvRate - a.vipConvRate || b.revenueCents - a.revenueCents)[0];
  if (best) {
    const winning = rows.find((row) => row.creative === best.creative);
    if (winning) winning.winner = true;
  }

  rows.sort((a, b) => b.revenueCents - a.revenueCents || b.funnel.sessions - a.funnel.sessions);
  return { days, rows, totals, winner: best?.creative ?? null, minSample };
}

/** Retargeting segments derived from quiz completion and checkout intent. */
export function buildRetargetReport(
  sessions: SessionFacts[],
  days: number,
  monthlyOfferEnabled: boolean,
): RetargetReport {
  const defs: Array<{
    key: RetargetSegment["key"];
    label: string;
    description: string;
    match: (s: SessionFacts) => boolean;
  }> = [
    {
      key: "quiz_completers",
      label: "Quiz completers — no purchase",
      description: "Finished a test and saw a result, but never bought. Best $2.99 monthly audience.",
      match: (s) => s.resultView && !s.purchase,
    },
    {
      key: "checkout_abandoners",
      label: "Checkout abandoners",
      description: "Saw the VIP gate or checkout and left. Highest intent, retarget within 3 days.",
      match: (s) => s.gateShown && !s.purchase,
    },
    {
      key: "result_viewers",
      label: "Test starters — no result",
      description: "Started a test but dropped before the result. Retarget with a completion reminder.",
      match: (s) => s.testStart && !s.resultView,
    },
    {
      key: "purchasers",
      label: "Buyers (exclusion + lookalike seed)",
      description: "Exclude from cold campaigns and use as the 1% lookalike seed.",
      match: (s) => s.purchase,
    },
  ];

  const segments: RetargetSegment[] = defs.map((def) => {
    const matched = sessions.filter(def.match);
    return {
      key: def.key,
      label: def.label,
      description: def.description,
      sessions: matched.length,
      withClickId: matched.filter((s) => s.clickId).length,
      revenueCents: matched.reduce((sum, s) => sum + s.revenueCents, 0),
    };
  });

  return { days, segments, monthlyOfferEnabled };
}

/** CSV of one segment, ready for a Meta / TikTok custom-audience upload. */
export function segmentCsv(
  sessions: SessionFacts[],
  key: RetargetSegment["key"],
): { csv: string; rows: number } {
  const match: Record<RetargetSegment["key"], (s: SessionFacts) => boolean> = {
    quiz_completers: (s) => s.resultView && !s.purchase,
    checkout_abandoners: (s) => s.gateShown && !s.purchase,
    result_viewers: (s) => s.testStart && !s.resultView,
    purchasers: (s) => s.purchase,
  };
  const list = sessions.filter(match[key]);
  const header = "session_id,platform,click_id,source,campaign,creative,revenue_cents,last_seen";
  const body = list
    .map((s) =>
      [
        s.sessionId,
        s.platform,
        s.clickId ?? "",
        s.source,
        s.campaign,
        s.creative,
        String(s.revenueCents),
        s.lastSeen,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  return { csv: `${header}\n${body}`, rows: list.length };
}

/** Source / campaign / creative revenue breakdown plus funnel drop-off. */
export function buildAttributionReport(sessions: SessionFacts[], days: number): AttributionReport {
  const groups = new Map<string, AttributionRow>();
  const totals = emptyFunnel();
  let revenueCents = 0;

  for (const s of sessions) {
    addTo(totals, s);
    revenueCents += s.revenueCents;
    const key = `${s.source}|${s.campaign}|${s.creative}`;
    let row = groups.get(key);
    if (!row) {
      row = {
        source: s.source,
        campaign: s.campaign,
        creative: s.creative,
        platform: s.platform,
        funnel: emptyFunnel(),
        revenueCents: 0,
        conversionRate: 0,
        epcCents: 0,
      };
      groups.set(key, row);
    }
    addTo(row.funnel, s);
    row.revenueCents += s.revenueCents;
  }

  const rows = [...groups.values()].map((row) => {
    row.conversionRate = rate(row.funnel.purchase, row.funnel.sessions);
    row.epcCents = row.funnel.sessions > 0 ? row.revenueCents / row.funnel.sessions : 0;
    return row;
  });
  rows.sort((a, b) => b.revenueCents - a.revenueCents || b.funnel.sessions - a.funnel.sessions);

  const steps: Array<[string, number]> = [
    ["Landing", totals.sessions],
    ["Test start", totals.testStart],
    ["Result view", totals.resultView],
    ["VIP gate", totals.gateShown],
    ["Purchase", totals.purchase],
  ];
  const dropOff = steps.slice(0, -1).map((step, i) => {
    const next = steps[i + 1]!;
    const lost = Math.max(0, step[1] - next[1]);
    return {
      from: step[0],
      to: next[0],
      kept: next[1],
      lost,
      lostPct: rate(lost, step[1]),
    };
  });

  return { days, rows, totals, revenueCents, dropOff };
}

type TrackingRow = {
  channel: string;
  source: string;
  event: string;
  ok: boolean;
  status: number | null;
  detail: string | null;
  event_id: string | null;
  created_at: string;
};

/** Live pixel / CAPI debug view: pairs browser fires with server deliveries. */
export async function buildPixelDebug(limit: number, onlyPurchase: boolean): Promise<PixelDebugReport> {
  const { admin } = await import("@/lib/admin-core.server");
  let query = admin()
    .from("tracking_events")
    .select("channel,source,event,ok,status,detail,event_id,created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(1000, limit * 6));
  if (onlyPurchase) query = query.eq("event", "Purchase");
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as TrackingRow[];
  const pairs = new Map<string, PixelEventPair>();
  const channels = new Map<string, { ok: number; failed: number }>();

  for (const row of rows) {
    const stat = channels.get(row.channel) ?? { ok: 0, failed: 0 };
    if (row.ok) stat.ok += 1;
    else stat.failed += 1;
    channels.set(row.channel, stat);

    const id = row.event_id ?? `${row.event}-${row.created_at}`;
    let pair = pairs.get(id);
    if (!pair) {
      pair = {
        eventId: id,
        event: row.event,
        at: row.created_at,
        browser: [],
        server: [],
        failed: [],
        deduplicated: false,
      };
      pairs.set(id, pair);
    }
    if (row.created_at > pair.at) pair.at = row.created_at;
    if (!row.ok) {
      if (!pair.failed.includes(row.channel)) pair.failed.push(`${row.channel}: ${row.detail ?? row.status ?? "failed"}`);
      continue;
    }
    const bucket = row.source === "browser" ? pair.browser : pair.server;
    if (!bucket.includes(row.channel)) bucket.push(row.channel);
  }

  const list = [...pairs.values()]
    .map((pair) => {
      pair.deduplicated = pair.browser.length > 0 && pair.server.length > 0;
      return pair;
    })
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, limit);

  return {
    pairs: list,
    summary: {
      total: list.length,
      purchases: list.filter((p) => p.event === "Purchase").length,
      deduplicated: list.filter((p) => p.deduplicated).length,
      browserOnly: list.filter((p) => p.browser.length > 0 && p.server.length === 0).length,
      serverOnly: list.filter((p) => p.server.length > 0 && p.browser.length === 0).length,
      failures: list.filter((p) => p.failed.length > 0).length,
    },
    channels: [...channels.entries()].map(([channel, stat]) => ({ channel, ...stat })),
  };
}
