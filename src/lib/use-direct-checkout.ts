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
import { attribution, sessionId, track, trackExperiment, visitorCountry } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";
import { cookie } from "@/lib/pixels";
import { hasVipOffer } from "@/lib/vip-offer";
import { VIP_CHECKOUT_SLOT, vipGateArm } from "@/lib/vip-ab";
import type { VipPlan } from "@/lib/vip";

export function useDirectCheckout() {
  const beginCheckout = useServerFn(startVipCheckout);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async (plan: VipPlan) => {
    if (busy) return;
    const offerActive = hasVipOffer();
    setBusy(true);
    setError(null);
    track({ event_type: "click", slot: "vip_checkout_tap", format: plan });
    try {
      trackExperiment(VIP_CHECKOUT_SLOT, vipGateArm());
      const request = () =>
        beginCheckout({
          data: {
            plan,
            offer: offerActive,
            email: null,
            sessionId: sessionId(),
            utmSource: attribution().utm_source ?? null,
            country: visitorCountry(),
            fbp: cookie("_fbp") ?? null,
            fbc: cookie("_fbc") ?? null,
          },
        });
      // Gulf mobile networks routinely need more than 15s for the first
      // provider round-trip; one silent retry removes almost every
      // `checkout_request_failed` without the buyer noticing.
      const withTimeout = (ms: number) =>
        Promise.race([
          request(),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("checkout_timeout")), ms);
          }),
        ]);
      let result: Awaited<ReturnType<typeof request>>;
      try {
        result = await withTimeout(25_000);
      } catch (first) {
        track({ event_type: "funnel", slot: "checkout_retry", format: plan });
        result = await withTimeout(25_000).catch(() => {
          throw first;
        });
      }
      if (!result.ok || !result.checkoutId || !result.planId) {
        const reason = result.reason ?? "Checkout is unavailable right now.";
        track({ event_type: "funnel", slot: "checkout_session_failed", format: plan });
        setError(reason);
        toast.error(reason);
        return;
      }
      track({ event_type: "funnel", slot: "checkout_session_created", format: plan });
      trackFunnel("checkout_start");
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
    } catch (caught) {
      const reason = caught instanceof Error && caught.message === "checkout_timeout"
        ? "Checkout took too long. Check your connection and try again."
        : "Could not open checkout — please try again.";
      track({ event_type: "funnel", slot: "checkout_request_failed", format: plan });
      setError(reason);
      toast.error(reason);
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, go };
}
