import { createServerFn } from "@tanstack/react-start";

/**
 * Admin orders + payment reliability report.
 *
 * Answers three operator questions in one call:
 *  1. Which checkouts were started and never paid (and how risky each looks)?
 *  2. Did every paid order actually reach Meta as exactly one `Purchase`?
 *  3. What did Whop's webhook actually deliver, and what did Meta answer?
 * Plus the VIP-gate A/B arms measured all the way to a paid order.
 */

export type AdminOrderRow = {
  orderId: string;
  email: string | null;
  plan: string;
  amountCents: number;
  status: string;
  provider: string;
  country: string | null;
  utmSource: string | null;
  sessionId: string | null;
  createdAt: string;
  paidAt: string | null;
  ageMinutes: number;
  /** Pending for long enough that the buyer almost certainly dropped off. */
  abandoned: boolean;
  /** Pending, young, still plausibly mid-payment. */
  atRisk: boolean;
  hasFbp: boolean;
};

export type PurchaseReconRow = {
  orderId: string;
  eventId: string;
  paidAt: string | null;
  amountCents: number;
  country: string | null;
  deliveries: number;
  issue: "missing" | "duplicate" | "ok";
};

export type WebhookLogRow = {
  at: string;
  eventType: string;
  orderId: string | null;
  verified: boolean;
  outcome: string;
  httpStatus: number | null;
  capiStatus: number | null;
  capiResponse: string | null;
  capiPayload: unknown;
  detail: string | null;
  durationMs: number | null;
};

export type GateArmStat = {
  arm: string;
  views: number;
  checkouts: number;
  paid: number;
  /** gate view → checkout start, % */
  checkoutRate: number;
  /** checkout start → paid, % */
  paidRate: number;
};

export type OrdersReport = {
  days: number;
  totals: {
    orders: number;
    paid: number;
    pending: number;
    refunded: number;
    revenueCents: number;
    paidRate: number;
    medianMinutesToPay: number | null;
  };
  byCountry: Array<{ country: string; orders: number; paid: number; paidRate: number }>;
  orders: AdminOrderRow[];
  recon: {
    missing: number;
    duplicate: number;
    rows: PurchaseReconRow[];
  };
  webhooks: {
    received: number;
    rejected: number;
    processed: number;
    rows: WebhookLogRow[];
  };
  gateTest: GateArmStat[];
};

/** Pending longer than this and the checkout is treated as abandoned. */
const ABANDON_MINUTES = 45;

export const adminOrdersReport = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    days: [1, 7, 14, 30, 60].includes(Number(input?.days)) ? Number(input?.days) : 14,
  }))
  .handler(async ({ data }): Promise<OrdersReport> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    const { purchaseEventId } = await import("@/lib/purchase-event");
    const db = admin();
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();

    const [ordersRes, purchaseRes, hookRes, expRes] = await Promise.all([
      db
        .from("vip_orders")
        .select(
          "order_id,email,plan,amount_cents,status,provider,country,utm_source,session_id,created_at,paid_at,fbp",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      db
        .from("tracking_events")
        .select("event_id,ok,created_at,channel,event")
        .eq("event", "Purchase")
        .gte("created_at", since)
        .limit(2000),
      db
        .from("whop_webhook_logs")
        .select(
          "created_at,event_type,order_id,verified,outcome,http_status,capi_status,capi_response,capi_payload,detail,duration_ms",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("ad_events")
        .select("slot,zone,session_id,event_type")
        .eq("event_type", "experiment")
        .in("slot", ["vip_gate_view", "vip_checkout_start"])
        .gte("created_at", since)
        .limit(20_000),
    ]);

    type OrderRow = {
      order_id: string;
      email: string | null;
      plan: string | null;
      amount_cents: number | null;
      status: string | null;
      provider: string | null;
      country: string | null;
      utm_source: string | null;
      session_id: string | null;
      created_at: string;
      paid_at: string | null;
      fbp: string | null;
    };

    const orders = (ordersRes.data ?? []) as OrderRow[];
    const now = Date.now();

    const rows: AdminOrderRow[] = orders.map((row) => {
      const ageMinutes = Math.max(0, Math.round((now - new Date(row.created_at).getTime()) / 60_000));
      const pending = (row.status ?? "pending") === "pending";
      return {
        orderId: row.order_id,
        email: row.email,
        plan: row.plan ?? "lifetime",
        amountCents: row.amount_cents ?? 0,
        status: row.status ?? "pending",
        provider: row.provider ?? "whop",
        country: row.country,
        utmSource: row.utm_source,
        sessionId: row.session_id,
        createdAt: row.created_at,
        paidAt: row.paid_at,
        ageMinutes,
        abandoned: pending && ageMinutes >= ABANDON_MINUTES,
        atRisk: pending && ageMinutes < ABANDON_MINUTES,
        hasFbp: Boolean(row.fbp),
      };
    });

    const paidOrders = rows.filter((row) => row.status === "paid");
    const revenueCents = paidOrders.reduce((sum, row) => sum + row.amountCents, 0);
    const payMinutes = paidOrders
      .filter((row) => row.paidAt)
      .map((row) =>
        Math.max(0, (new Date(row.paidAt!).getTime() - new Date(row.createdAt).getTime()) / 60_000),
      )
      .sort((a, b) => a - b);
    const medianMinutesToPay =
      payMinutes.length > 0
        ? Math.round(payMinutes[Math.floor(payMinutes.length / 2)]! * 10) / 10
        : null;

    const countryMap = new Map<string, { orders: number; paid: number }>();
    for (const row of rows) {
      const key = row.country ?? "??";
      const stat = countryMap.get(key) ?? { orders: 0, paid: 0 };
      stat.orders += 1;
      if (row.status === "paid") stat.paid += 1;
      countryMap.set(key, stat);
    }

    // --- Purchase reconciliation (paid order ⇄ Meta Purchase by event_id) ---
    const deliveries = new Map<string, number>();
    for (const item of (purchaseRes.data ?? []) as Array<{ event_id: string | null; ok: boolean }>) {
      if (!item.event_id || !item.ok) continue;
      deliveries.set(item.event_id, (deliveries.get(item.event_id) ?? 0) + 1);
    }
    const reconRows: PurchaseReconRow[] = paidOrders.map((row) => {
      const eventId = purchaseEventId(row.orderId);
      const count = deliveries.get(eventId) ?? 0;
      return {
        orderId: row.orderId,
        eventId,
        paidAt: row.paidAt,
        amountCents: row.amountCents,
        country: row.country,
        deliveries: count,
        issue: count === 0 ? "missing" : count > 1 ? "duplicate" : "ok",
      };
    });

    // --- VIP gate A/B arms, measured to money ---
    type Exp = { slot: string; zone: string | null; session_id: string | null };
    const paidSessions = new Set(
      paidOrders.map((row) => row.sessionId).filter((id): id is string => Boolean(id)),
    );
    const armMap = new Map<
      string,
      { views: Set<string>; checkouts: Set<string> }
    >();
    for (const item of (expRes.data ?? []) as Exp[]) {
      const arm = item.zone ?? "unknown";
      const session = item.session_id ?? "";
      if (!session) continue;
      const stat = armMap.get(arm) ?? { views: new Set<string>(), checkouts: new Set<string>() };
      if (item.slot === "vip_gate_view") stat.views.add(session);
      else stat.checkouts.add(session);
      armMap.set(arm, stat);
    }
    const gateTest: GateArmStat[] = [...armMap.entries()]
      .map(([arm, stat]) => {
        const views = stat.views.size;
        const checkouts = stat.checkouts.size;
        const paid = [...stat.checkouts].filter((s) => paidSessions.has(s)).length;
        return {
          arm,
          views,
          checkouts,
          paid,
          checkoutRate: views > 0 ? (checkouts / views) * 100 : 0,
          paidRate: checkouts > 0 ? (paid / checkouts) * 100 : 0,
        };
      })
      .sort((a, b) => b.views - a.views);

    const hooks = (hookRes.data ?? []) as Array<{
      created_at: string;
      event_type: string;
      order_id: string | null;
      verified: boolean;
      outcome: string;
      http_status: number | null;
      capi_status: number | null;
      capi_response: string | null;
      capi_payload: unknown;
      detail: string | null;
      duration_ms: number | null;
    }>;

    return {
      days: data.days,
      totals: {
        orders: rows.length,
        paid: paidOrders.length,
        pending: rows.filter((row) => row.status === "pending").length,
        refunded: rows.filter((row) => row.status === "refunded" || row.status === "cancelled")
          .length,
        revenueCents,
        paidRate: rows.length > 0 ? (paidOrders.length / rows.length) * 100 : 0,
        medianMinutesToPay,
      },
      byCountry: [...countryMap.entries()]
        .map(([country, stat]) => ({
          country,
          orders: stat.orders,
          paid: stat.paid,
          paidRate: stat.orders > 0 ? (stat.paid / stat.orders) * 100 : 0,
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 12),
      orders: rows.slice(0, 120),
      recon: {
        missing: reconRows.filter((row) => row.issue === "missing").length,
        duplicate: reconRows.filter((row) => row.issue === "duplicate").length,
        rows: reconRows.slice(0, 60),
      },
      webhooks: {
        received: hooks.length,
        rejected: hooks.filter((row) => !row.verified).length,
        processed: hooks.filter((row) => row.outcome === "processed").length,
        rows: hooks.map((row) => ({
          at: row.created_at,
          eventType: row.event_type,
          orderId: row.order_id,
          verified: row.verified,
          outcome: row.outcome,
          httpStatus: row.http_status,
          capiStatus: row.capi_status,
          capiResponse: row.capi_response,
          capiPayload: row.capi_payload,
          detail: row.detail,
          durationMs: row.duration_ms,
        })),
      },
      gateTest,
    };
  });
