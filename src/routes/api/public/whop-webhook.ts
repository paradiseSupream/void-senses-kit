import { createFileRoute } from "@tanstack/react-router";

import { purchaseEventId } from "@/lib/purchase-event";

type PurchaseReport = {
  attempted: boolean;
  payload: Record<string, unknown> | null;
  status: number | null;
  response: string | null;
};

/**
 * Reports a verified payment to Meta's Conversions API and logs the delivery
 * for the admin tracking monitor. Never throws: a tracking failure must not
 * fail the webhook (Whop would retry and re-grant access).
 */
async function reportPurchase(
  orderId: string,
  email: string | null,
  amountCents: number,
): Promise<PurchaseReport> {
  const empty: PurchaseReport = { attempted: false, payload: null, status: null, response: null };
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("vip_orders")
      .select("country,fbp,fbc,user_agent")
      .eq("order_id", orderId)
      .maybeSingle();

    const eventId = purchaseEventId(orderId);
    const { claimServerEvent, logTrackingEvents } = await import("@/lib/tracking-log.server");
    // The success page may already have mirrored this purchase server-side.
    if (!(await claimServerEvent(eventId, "Purchase"))) {
      return { ...empty, response: "skipped: already delivered for this event_id" };
    }

    const { sendMetaEvent } = await import("@/lib/meta-capi.server");
    const country = row?.country ? row.country.toUpperCase().slice(0, 2) : null;
    const payload = {
      event: "Purchase",
      eventId,
      value: amountCents / 100,
      currency: "USD",
      country,
      hasEmail: Boolean(email),
      hasFbp: Boolean(row?.fbp),
      hasFbc: Boolean(row?.fbc),
    };
    const result = await sendMetaEvent({
      event: "Purchase",
      eventId,
      value: amountCents / 100,
      currency: "USD",
      email,
      country,
      url: "https://sensesofvoid.app/vip/success",
      userAgent: row?.user_agent ?? null,
      fbp: row?.fbp ?? null,
      fbc: row?.fbc ?? null,
    });
    if (!result.sent) {
      return { attempted: false, payload, status: null, response: result.detail };
    }
    await logTrackingEvents([
      {
        channel: "meta",
        source: "server",
        event: "Purchase",
        ok: result.ok,
        status: result.status,
        detail: `webhook: ${result.detail}`,
        eventId,
        country,
      },
    ]);
    return { attempted: true, payload, status: result.status, response: result.detail };
  } catch (error) {
    console.error("[whop] purchase tracking failed", error);
    return { ...empty, response: String(error).slice(0, 300) };
  }
}

/**
 * Whop payment webhook — the only thing that actually activates paid VIP.
 *
 * Signature is verified before any payload field is read, and every event is
 * idempotent: a repeated delivery just re-confirms the same order. Every
 * attempt is written to `whop_webhook_logs` for the admin orders dashboard.
 */
export const Route = createFileRoute("/api/public/whop-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = Date.now();
        const raw = await request.text();
        const { verifyWhopWebhook, readWhopEvent } = await import("@/lib/whop.server");
        const { logWhopWebhook } = await import("@/lib/webhook-log.server");

        if (!verifyWhopWebhook(raw, request.headers)) {
          await logWhopWebhook({
            eventType: "unknown",
            verified: false,
            outcome: "rejected",
            httpStatus: 401,
            detail: "Signature verification failed",
            durationMs: Date.now() - startedAt,
          });
          return new Response("Invalid signature", { status: 401 });
        }

        let event: unknown;
        try {
          event = JSON.parse(raw);
        } catch {
          await logWhopWebhook({
            eventType: "unknown",
            verified: true,
            outcome: "error",
            httpStatus: 400,
            detail: "Payload was not valid JSON",
            durationMs: Date.now() - startedAt,
          });
          return new Response("Bad payload", { status: 400 });
        }

        const parsed = readWhopEvent(event as Parameters<typeof readWhopEvent>[0]);
        const paidEvent =
          parsed.type === "payment.succeeded" || parsed.type === "membership.activated";
        const endedEvent =
          parsed.type === "membership.deactivated" || parsed.type === "payment.refunded";

        if (!paidEvent && !endedEvent) {
          await logWhopWebhook({
            eventType: parsed.type ?? "unknown",
            orderId: parsed.orderId,
            verified: true,
            outcome: "ignored",
            httpStatus: 200,
            detail: "Event type not relevant to VIP fulfilment",
            durationMs: Date.now() - startedAt,
          });
          return new Response("ignored", { status: 200 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (endedEvent) {
          // Close the order first so a replayed `payment.succeeded` cannot
          // silently re-grant access after a refund/cancellation.
          if (parsed.orderId) {
            await supabaseAdmin
              .from("vip_orders")
              .update({ status: parsed.type === "payment.refunded" ? "refunded" : "cancelled" })
              .eq("order_id", parsed.orderId);
          }
          if (parsed.email) {
            await supabaseAdmin
              .from("vip_members")
              .update({ active: false })
              .ilike("email", parsed.email);
          }
          await logWhopWebhook({
            eventType: parsed.type ?? "unknown",
            orderId: parsed.orderId,
            email: parsed.email,
            verified: true,
            outcome: "closed",
            httpStatus: 200,
            detail: parsed.type === "payment.refunded" ? "Order refunded" : "Membership cancelled",
            durationMs: Date.now() - startedAt,
          });
          return new Response("ok", { status: 200 });
        }

        // Resolve the order (email may only exist on the order row).
        const order = parsed.orderId
          ? (
              await supabaseAdmin
                .from("vip_orders")
                .select("order_id,email,plan,amount_cents,status")
                .eq("order_id", parsed.orderId)
                .maybeSingle()
            ).data
          : null;

        // Terminal states never transition back to paid.
        if (order && (order.status === "refunded" || order.status === "cancelled")) {
          await logWhopWebhook({
            eventType: parsed.type ?? "unknown",
            orderId: parsed.orderId,
            email: parsed.email,
            verified: true,
            outcome: "ignored",
            httpStatus: 200,
            detail: `Order already ${order.status}`,
            durationMs: Date.now() - startedAt,
          });
          return new Response("order closed", { status: 200 });
        }

        const email = parsed.email ?? order?.email ?? null;
        const plan = (order?.plan as "lifetime" | "monthly") ?? parsed.plan;
        const amountCents = order?.amount_cents ?? (plan === "monthly" ? 499 : 1900);

        if (order) {
          await supabaseAdmin
            .from("vip_orders")
            .update({
              status: "paid",
              email,
              payment_id: parsed.paymentId,
              paid_at: new Date().toISOString(),
            })
            .eq("order_id", order.order_id);
        }

        if (email) {
          const { grantVip } = await import("@/lib/vip-fulfil.server");
          await grantVip({
            email,
            plan,
            amountCents,
            paymentRef: parsed.paymentId,
            provider: "whop",
          });
        }

        // Verified payment → authoritative server-side Purchase. The browser
        // fire on /vip/success uses the same event id, so Meta de-duplicates.
        const report = parsed.orderId
          ? await reportPurchase(parsed.orderId, email, amountCents)
          : { attempted: false, payload: null, status: null, response: "no order id on event" };

        await logWhopWebhook({
          eventType: parsed.type ?? "unknown",
          orderId: parsed.orderId,
          email,
          verified: true,
          outcome: "processed",
          httpStatus: 200,
          capiPayload: report.payload,
          capiStatus: report.status,
          capiResponse: report.response,
          detail: order ? "Order marked paid, VIP granted" : "Payment without a matching order row",
          durationMs: Date.now() - startedAt,
        });

        return new Response("ok", { status: 200 });
      },
    },
  },
});
