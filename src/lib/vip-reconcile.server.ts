/**
 * Order reconciliation (server only).
 *
 * The Whop webhook is the fast path that activates VIP. This module is the
 * safety net: it asks Whop directly what happened to one of our order ids, so a
 * lost, delayed or signature-rejected webhook can never leave a real buyer
 * stuck on "pending". It also reports *why* an order never completed, which is
 * what the success page and the admin dashboard show instead of a spinner.
 *
 * Fulfilment stays idempotent: an already-paid order is never re-granted, and
 * the Meta Purchase uses the same `purchase:<orderId>` event id as the webhook
 * and the browser, so no conversion is ever counted twice.
 */

import { VIP_PRICE_TABLE } from "@/lib/vip-prices";
import { purchaseEventId } from "@/lib/purchase-event";

export type ReconcileResult = {
  orderId: string;
  /** Our order status after reconciliation. */
  status: "paid" | "pending" | "refunded" | "cancelled" | "unknown";
  /** Did this call flip a pending order to paid? */
  changed: boolean;
  email: string | null;
  /** Plain-language reason a pending order has not completed. */
  reason: string | null;
  paymentId: string | null;
  method: string | null;
};

export async function reconcileOrder(orderId: string): Promise<ReconcileResult> {
  const base: ReconcileResult = {
    orderId,
    status: "unknown",
    changed: false,
    email: null,
    reason: null,
    paymentId: null,
    method: null,
  };
  if (!orderId) return base;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("vip_orders")
    .select("order_id,email,plan,amount_cents,status,country,fbp,fbc,user_agent")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order) return base;
  if (order.status === "paid" || order.status === "refunded" || order.status === "cancelled") {
    return {
      ...base,
      status: order.status as ReconcileResult["status"],
      email: order.email ?? null,
    };
  }

  const { fetchWhopPaymentForOrder, whopConfigured } = await import("@/lib/whop.server");
  if (!whopConfigured()) {
    return { ...base, status: "pending", email: order.email ?? null, reason: null };
  }

  let payment;
  try {
    payment = await fetchWhopPaymentForOrder(orderId);
  } catch (error) {
    console.error("[vip] reconcile lookup failed", error);
    return { ...base, status: "pending", email: order.email ?? null };
  }

  const email = order.email ?? payment.email ?? null;

  if (payment.state === "refunded") {
    await supabaseAdmin.from("vip_orders").update({ status: "refunded" }).eq("order_id", orderId);
    return { ...base, status: "refunded", email, paymentId: payment.paymentId };
  }

  if (payment.state !== "paid") {
    return {
      ...base,
      status: "pending",
      email,
      paymentId: payment.paymentId,
      method: payment.method,
      reason:
        payment.state === "none"
          ? "No payment attempt reached the provider for this checkout."
          : payment.reason,
    };
  }

  // Real captured payment the webhook never told us about → fulfil now.
  const plan = (order.plan as "lifetime" | "monthly") ?? "lifetime";
  const amountCents =
    order.amount_cents ?? payment.amountCents ?? VIP_PRICE_TABLE[plan === "monthly" ? "monthly" : "lifetime"].full;

  await supabaseAdmin
    .from("vip_orders")
    .update({
      status: "paid",
      email,
      payment_id: payment.paymentId,
      paid_at: new Date().toISOString(),
      payment_method: payment.method,
      card_brand: payment.cardBrand,
      card_last4: payment.cardLast4,
      billing_country: payment.billingCountry,
      billing_name: payment.billingName,
      receipt_url: payment.receiptUrl,
      currency: payment.currency ?? "USD",
      synced_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);


  if (email) {
    const { grantVip } = await import("@/lib/vip-fulfil.server");
    await grantVip({
      email,
      plan,
      amountCents,
      paymentRef: payment.paymentId,
      provider: "whop",
    });
  }

  await reportReconciledPurchase(orderId, email, amountCents, order);

  return {
    orderId,
    status: "paid",
    changed: true,
    email,
    reason: null,
    paymentId: payment.paymentId,
    method: payment.method,
  };
}

async function reportReconciledPurchase(
  orderId: string,
  email: string | null,
  amountCents: number,
  order: { country?: string | null; fbp?: string | null; fbc?: string | null; user_agent?: string | null },
): Promise<void> {
  try {
    const eventId = purchaseEventId(orderId);
    const { claimServerEvent, logTrackingEvents } = await import("@/lib/tracking-log.server");
    if (!(await claimServerEvent(eventId, "Purchase"))) return;

    const country = order.country ? order.country.toUpperCase().slice(0, 2) : null;
    const { sendMetaEvent } = await import("@/lib/meta-capi.server");
    const result = await sendMetaEvent({
      event: "Purchase",
      eventId,
      value: amountCents / 100,
      currency: "USD",
      email,
      country,
      url: "https://sensesofvoid.app/vip/success",
      userAgent: order.user_agent ?? null,
      fbp: order.fbp ?? null,
      fbc: order.fbc ?? null,
    });
    if (!result.sent) return;
    await logTrackingEvents([
      {
        channel: "meta",
        source: "server",
        event: "Purchase",
        ok: result.ok,
        status: result.status,
        detail: `reconcile: ${result.detail}`,
        eventId,
        country,
      },
    ]);
  } catch (error) {
    console.error("[vip] reconcile tracking failed", error);
  }
}

/**
 * Pulls the provider's billing detail (method, card brand/last4, billing
 * country, receipt link) onto an order that is already known to be paid.
 *
 * Best effort by design: this only enriches the operator dashboard, so a
 * provider hiccup must never fail the webhook that grants access.
 */
export async function syncOrderPaymentDetails(orderId: string): Promise<void> {
  if (!orderId) return;
  try {
    const { whopConfigured, fetchWhopPaymentForOrder } = await import("@/lib/whop.server");
    if (!whopConfigured()) return;
    const payment = await fetchWhopPaymentForOrder(orderId);
    if (payment.state === "none") return;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("vip_orders")
      .update({
        payment_method: payment.method,
        card_brand: payment.cardBrand,
        card_last4: payment.cardLast4,
        billing_country: payment.billingCountry,
        billing_name: payment.billingName,
        receipt_url: payment.receiptUrl,
        currency: payment.currency ?? "USD",
        ...(payment.paymentId ? { payment_id: payment.paymentId } : {}),
        ...(payment.refundedAt ? { refunded_at: payment.refundedAt } : {}),
        synced_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);
  } catch (error) {
    console.error("[vip] billing sync failed", error);
  }
}

/** Reconciles every still-pending order in a window. Used by the admin panel. */

export async function reconcilePendingOrders(days: number): Promise<ReconcileResult[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data: rows } = await supabaseAdmin
    .from("vip_orders")
    .select("order_id")
    .eq("status", "pending")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  const out: ReconcileResult[] = [];
  for (const row of rows ?? []) {
    out.push(await reconcileOrder(row.order_id as string));
  }
  return out;
}
