import { createFileRoute } from "@tanstack/react-router";

import { purchaseEventId } from "@/lib/purchase-event";

/**
 * Reports a verified payment to Meta's Conversions API and logs the delivery
 * for the admin tracking monitor. Never throws: a tracking failure must not
 * fail the webhook (Whop would retry and re-grant access).
 */
async function reportPurchase(orderId: string, email: string | null, amountCents: number) {
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
    if (!(await claimServerEvent(eventId, "Purchase"))) return;

    const { sendMetaEvent } = await import("@/lib/meta-capi.server");
    const country = row?.country ? row.country.toUpperCase().slice(0, 2) : null;
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
    if (!result.sent) return;
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
  } catch (error) {
    console.error("[whop] purchase tracking failed", error);
  }
}


/**
 * Whop payment webhook — the only thing that actually activates paid VIP.
 *
 * Signature is verified before any payload field is read, and every event is
 * idempotent: a repeated delivery just re-confirms the same order.
 */
export const Route = createFileRoute("/api/public/whop-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { verifyWhopWebhook, readWhopEvent } = await import("@/lib/whop.server");

        if (!verifyWhopWebhook(raw, request.headers)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: unknown;
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const parsed = readWhopEvent(event as Parameters<typeof readWhopEvent>[0]);
        const paidEvent =
          parsed.type === "payment.succeeded" || parsed.type === "membership.activated";
        const endedEvent =
          parsed.type === "membership.deactivated" || parsed.type === "payment.refunded";

        if (!paidEvent && !endedEvent) return new Response("ignored", { status: 200 });

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
        if (parsed.orderId) {
          await reportPurchase(parsed.orderId, email, amountCents);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
