/**
 * Server-only aggregation for the paid-ads intelligence surfaces.
 *
 * Everything is rebuilt from the `ad_events` log (one row per visitor signal)
 * and the `tracking_events` delivery log, so no extra tables are needed.
 */

import type {
  AttributionReport,
  AttributionRow,
  CohortKey,
  CohortReport,
  CohortRow,
  CreativeReport,
  CreativeRow,
  FunnelCounts,
  PixelDebugReport,
  PixelDelivery,
  PixelEventPair,
  RoiDefaults,
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
  ip_hash: string | null;
  ua_hash: string | null;
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
  firstSeen: string;
  lastSeen: string;
  /** Pseudonymous visitor key (ip + ua hash) used for the returning cohort. */
  visitorKey: string;
  /** True when this visitor already had an earlier session in the window. */
  returning: boolean;
  /** True when the session carries a UTM / click id (i.e. paid or campaign). */
  paid: boolean;
};

const SELECT =
  "event_type,slot,session_id,tool_slug,utm_source,utm_campaign,utm_content,ad_click_id,ad_platform,referrer,revenue_cents,suspect,ip_hash,ua_hash,created_at";

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
        firstSeen: row.created_at,
        lastSeen: row.created_at,
        visitorKey: `${row.ip_hash ?? "?"}|${row.ua_hash ?? "?"}`,
        returning: false,
        paid: Boolean(row.utm_source || row.ad_click_id),
      };
      map.set(row.session_id, s);
    }
    s.lastSeen = row.created_at;
    if (s.visitorKey.startsWith("?|") && (row.ip_hash || row.ua_hash)) {
      s.visitorKey = `${row.ip_hash ?? "?"}|${row.ua_hash ?? "?"}`;
    }
    if (!s.paid && (row.utm_source || row.ad_click_id)) s.paid = true;
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

  const list = [...map.values()].sort((a, b) => (a.firstSeen < b.firstSeen ? -1 : 1));
  const seen = new Set<string>();
  for (const s of list) {
    if (s.visitorKey === "?|?") continue;
    if (seen.has(s.visitorKey)) s.returning = true;
    else seen.add(s.visitorKey);
  }
  return list;
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

/**
 * Applies the operator's attribution rules to a session list: UTM
 * normalization, organic / click-id filters and the first- or last-touch
 * credit model across a visitor's sessions inside the lookback window.
 */
export function applyAttributionRules(
  sessions: SessionFacts[],
  rules: AttributionRules,
): { sessions: SessionFacts[]; excluded: number } {
  let list = sessions.map((s) => ({ ...s }));

  if (rules.normalize) {
    for (const s of list) {
      s.source = normalizeSource(s.source, "direct");
      s.campaign = normalizeUtmValue(s.campaign, "(none)");
      s.creative = normalizeUtmValue(s.creative, "unattributed");
      s.platform = normalizeSource(s.platform, s.paid ? "utm" : "organic");
    }
  }

  const before = list.length;
  if (rules.requireClickId) list = list.filter((s) => Boolean(s.clickId));
  if (!rules.includeOrganic) list = list.filter((s) => s.paid);
  const excluded = before - list.length;

  if (rules.model !== "session") {
    const byVisitor = new Map<string, SessionFacts[]>();
    for (const s of list) {
      if (s.visitorKey === "?|?") continue;
      const bucket = byVisitor.get(s.visitorKey) ?? [];
      bucket.push(s);
      byVisitor.set(s.visitorKey, bucket);
    }
    const windowMs = Math.max(1, rules.lookbackDays) * 86_400_000;
    for (const bucket of byVisitor.values()) {
      if (bucket.length < 2) continue;
      bucket.sort((a, b) => (a.firstSeen < b.firstSeen ? -1 : 1));
      const paid = bucket.filter((s) => s.paid);
      if (paid.length === 0) continue;
      const anchor = rules.model === "first_touch" ? paid[0]! : paid[paid.length - 1]!;
      const anchorAt = new Date(anchor.firstSeen).getTime();
      for (const s of bucket) {
        const at = new Date(s.firstSeen).getTime();
        if (Math.abs(at - anchorAt) > windowMs) continue;
        // Credit the touch, but never rewrite the touch session itself.
        if (s === anchor) continue;
        s.source = anchor.source;
        s.campaign = anchor.campaign;
        s.creative = anchor.creative;
        s.platform = anchor.platform;
      }
    }
  }

  return { sessions: list, excluded };
}

/** Source / campaign / creative revenue breakdown plus funnel drop-off. */
export function buildAttributionReport(
  sessions: SessionFacts[],
  days: number,
  rules?: AttributionRules,
): AttributionReport {
  let excludedSessions = 0;
  if (rules) {
    const applied = applyAttributionRules(sessions, rules);
    sessions = applied.sessions;
    excludedSessions = applied.excluded;
  }
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

  const minSessions = rules?.minSessions ?? 0;
  const rows = [...groups.values()]
    .map((row) => {
      row.conversionRate = rate(row.funnel.purchase, row.funnel.sessions);
      row.epcCents = row.funnel.sessions > 0 ? row.revenueCents / row.funnel.sessions : 0;
      return row;
    })
    .filter((row) => row.funnel.sessions >= minSessions);
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

/**
 * Live benchmarks for the ROI calculator, measured from real sessions so the
 * operator starts from this project's numbers instead of generic guesses.
 */
export function buildRoiDefaults(sessions: SessionFacts[], days: number): RoiDefaults {
  const totals = emptyFunnel();
  let revenueCents = 0;
  let paidSessions = 0;
  for (const s of sessions) {
    addTo(totals, s);
    revenueCents += s.revenueCents;
    if (s.paid) paidSessions += 1;
  }
  return {
    days,
    sessions: totals.sessions,
    resultViews: totals.resultView,
    purchases: totals.purchase,
    revenueCents,
    quizRate: rate(totals.resultView, totals.sessions),
    vipRate: rate(totals.purchase, totals.resultView),
    aov: totals.purchase > 0 ? revenueCents / totals.purchase / 100 : 0,
    rpm: totals.sessions > 0 ? (revenueCents / 100 / totals.sessions) * 1000 : 0,
    paidSessions,
    confident: totals.purchase >= 10 && totals.sessions >= 200,
  };
}

const COHORTS: Array<{ key: CohortKey; label: string; match: (s: SessionFacts) => boolean }> = [
  { key: "paid_new", label: "UTM / paid — new", match: (s) => s.paid && !s.returning },
  { key: "paid_returning", label: "UTM / paid — returning", match: (s) => s.paid && s.returning },
  { key: "organic_new", label: "Organic — new", match: (s) => !s.paid && !s.returning },
  {
    key: "organic_returning",
    label: "Organic — returning",
    match: (s) => !s.paid && s.returning,
  },
];

const STEP_KEYS: Array<[string, keyof FunnelCounts]> = [
  ["Landing", "sessions"],
  ["Test start", "testStart"],
  ["Result view", "resultView"],
  ["VIP gate", "gateShown"],
  ["Purchase", "purchase"],
];

/** UTM (paid) vs returning-visitor cohort revenue and funnel analytics. */
export function buildCohortReport(sessions: SessionFacts[], days: number): CohortReport {
  const totals = emptyFunnel();
  let revenueCents = 0;
  for (const s of sessions) {
    addTo(totals, s);
    revenueCents += s.revenueCents;
  }

  const cohorts: CohortRow[] = COHORTS.map((def) => {
    const matched = sessions.filter(def.match);
    const funnel = emptyFunnel();
    let money = 0;
    for (const s of matched) {
      addTo(funnel, s);
      money += s.revenueCents;
    }
    return {
      key: def.key,
      label: def.label,
      funnel,
      revenueCents: money,
      conversionRate: rate(funnel.purchase, funnel.sessions),
      epcCents: funnel.sessions > 0 ? money / funnel.sessions : 0,
      sharePct: rate(funnel.sessions, totals.sessions),
    };
  });

  const bySource = new Map<
    string,
    { newF: FunnelCounts; retF: FunnelCounts; newRev: number; retRev: number }
  >();
  for (const s of sessions) {
    let entry = bySource.get(s.source);
    if (!entry) {
      entry = { newF: emptyFunnel(), retF: emptyFunnel(), newRev: 0, retRev: 0 };
      bySource.set(s.source, entry);
    }
    if (s.returning) {
      addTo(entry.retF, s);
      entry.retRev += s.revenueCents;
    } else {
      addTo(entry.newF, s);
      entry.newRev += s.revenueCents;
    }
  }

  const sources = [...bySource.entries()]
    .map(([source, e]) => ({
      source,
      newSessions: e.newF.sessions,
      returningSessions: e.retF.sessions,
      newRevenueCents: e.newRev,
      returningRevenueCents: e.retRev,
      newConvRate: rate(e.newF.purchase, e.newF.sessions),
      returningConvRate: rate(e.retF.purchase, e.retF.sessions),
    }))
    .sort(
      (a, b) =>
        b.newRevenueCents + b.returningRevenueCents - (a.newRevenueCents + a.returningRevenueCents) ||
        b.newSessions + b.returningSessions - (a.newSessions + a.returningSessions),
    );

  const newFunnel = emptyFunnel();
  const retFunnel = emptyFunnel();
  for (const s of sessions) addTo(s.returning ? retFunnel : newFunnel, s);

  const dropOff = STEP_KEYS.slice(0, -1).map((step, i) => {
    const next = STEP_KEYS[i + 1]!;
    return {
      from: step[0],
      to: next[0],
      newKeptPct: rate(newFunnel[next[1]], newFunnel[step[1]]),
      returningKeptPct: rate(retFunnel[next[1]], retFunnel[step[1]]),
    };
  });

  return { days, cohorts, sources, totals, revenueCents, dropOff };
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
export async function buildPixelDebug(
  limit: number,
  onlyPurchase: boolean,
  eventId?: string | null,
): Promise<PixelDebugReport> {
  const { admin } = await import("@/lib/admin-core.server");
  let query = admin()
    .from("tracking_events")
    .select("channel,source,event,ok,status,detail,event_id,created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(1000, limit * 6));
  if (onlyPurchase) query = query.eq("event", "Purchase");
  if (eventId) query = query.ilike("event_id", `%${eventId}%`);
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
        deliveries: [],
        deduplicated: false,
      };
      pairs.set(id, pair);
    }
    if (row.created_at > pair.at) pair.at = row.created_at;
    const delivery: PixelDelivery = {
      channel: row.channel,
      source: row.source,
      ok: row.ok,
      status: row.status,
      detail: row.detail,
      at: row.created_at,
    };
    pair.deliveries = [...(pair.deliveries ?? []), delivery];
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
