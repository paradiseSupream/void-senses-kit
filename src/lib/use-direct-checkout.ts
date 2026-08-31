/**
 * One-tap checkout.
 *
 * The old path was: offer card → VIP modal → plan pick → pay button →
 * checkout page. Live data showed 75 offer impressions producing a single
 * `checkout_start`, so every extra tap was costing effectively the whole
 * funnel. This hook creates the provider session directly from the offer
 * button and sends the buyer straight to the payment page.
 */

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { startVipCheckout } from "@/lib/vip.functions";
import { rememberOrder } from "@/lib/vip-unlock";
import { attribution, sessionId, trackExperiment } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";
import { cookie } from "@/lib/pixels";
import { hasVipOffer } from "@/lib/vip-offer";
import { VIP_CHECKOUT_SLOT, vipGateArm } from "@/lib/vip-ab";
import type { VipPlan } from "@/lib/vip";

export function useDirectCheckout() {
  const beginCheckout = useServerFn(startVipCheckout);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const go = async (plan: VipPlan) => {
    if (busy) return;
    setBusy(true);
    try {
      trackFunnel("checkout_start");
      trackExperiment(VIP_CHECKOUT_SLOT, vipGateArm());
      const result = await beginCheckout({
        data: {
          plan,
          offer: hasVipOffer(),
          email: null,
          sessionId: sessionId(),
          utmSource: attribution().utm_source ?? null,
          fbp: cookie("_fbp") ?? null,
          fbc: cookie("_fbc") ?? null,
        },
      });
      if (!result.ok || !result.checkoutId || !result.planId) {
        toast.error(result.reason ?? "Checkout is unavailable right now.");
        return;
      }
      if (result.orderId) rememberOrder(result.orderId, null);
      await navigate({
        to: "/vip/checkout",
        search: {
          s: result.checkoutId,
          p: result.planId,
          ...(result.orderId ? { order: result.orderId } : {}),
          ...(typeof result.amountCents === "number"
            ? { amount: String(result.amountCents) }
            : {}),
        },
      });
    } catch {
      toast.error("Could not open checkout — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return { busy, go };
}
