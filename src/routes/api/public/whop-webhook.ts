import { createFileRoute } from "@tanstack/react-router";

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

        return new Response("ok", { status: 200 });
      },
    },
  },
});
