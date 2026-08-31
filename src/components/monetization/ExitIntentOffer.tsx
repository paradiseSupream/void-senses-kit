import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";
import { grantVipOffer } from "@/lib/vip-offer";
import { useVipPrices } from "@/lib/vip-pricing";
import { track } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";
import { isMonthlyRetargetVisitor } from "@/lib/retarget";

const SEEN_KEY = "sov.exitOfferSeen";

/**
 * One-time exit-intent offer: discounted lifetime VIP shown once per session
 * when the visitor is about to leave (pointer to the top edge on desktop, or
 * long dwell + deep scroll on touch).
 */
export function ExitIntentOffer() {
  const { isVip, openVipModal } = useVip();
  const { monthly, lifetime: offer, lifetimeFull: full } = useVipPrices();
  const { tracking } = useSiteConfig();
  const [open, setOpen] = useState(false);
  const [retarget, setRetarget] = useState(false);

  useEffect(() => {
    if (isVip) return;
    // Returning non-buyers get the $2.99 monthly pass first, and sooner.
    const isRetarget = tracking?.retarget_monthly !== false && isMonthlyRetargetVisitor();
    setRetarget(isRetarget);
    try {
      if (window.sessionStorage.getItem(SEEN_KEY) === "1") return;
    } catch {
      /* storage unavailable */
    }

    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* storage unavailable */
      }
      // Grant the downsell before showing it so the discounted price on
      // screen is the exact price the checkout will charge.
      grantVipOffer();
      setOpen(true);
      track({ event_type: "impression", slot: "exit_intent" });
      trackFunnel("vip_gate_shown");
      cleanup();
    };

    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0 && !event.relatedTarget) fire();
    };

    // Touch fallback: only after real dwell and scrolling, never on arrival.
    const touchTimer = window.setTimeout(() => {
      const onScroll = () => {
        const scrolled = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
        if (scrolled > 0.4) fire();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanupScroll = () => window.removeEventListener("scroll", onScroll);
    }, isRetarget ? 12_000 : 45_000);

    let cleanupScroll = () => undefined as void;
    document.addEventListener("mouseout", onMouseOut);

    function cleanup() {
      document.removeEventListener("mouseout", onMouseOut);
      window.clearTimeout(touchTimer);
      cleanupScroll();
    }
    return cleanup;
  }, [isVip, tracking?.retarget_monthly]);

  if (!open || isVip) return null;


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-offer-title"
      className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div className="glass relative w-full max-w-sm rounded-2xl p-7 text-center">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <span className="mx-auto grid size-12 place-items-center rounded-xl border border-hairline bg-surface-2">
          <Crown className="size-5 text-primary" aria-hidden="true" />
        </span>
        <h2 id="exit-offer-title" className="mt-4 font-display text-xl font-bold">
          {retarget ? `Welcome back — try 1 month for ${monthly}` : `Before you go — ${offer} lifetime`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {retarget ? (
            <>
              You already know what the report unlocks. Start with a month ad-free for {monthly}, or
              take lifetime for {offer} instead of <span className="line-through">{full}</span>.
            </>
          ) : (
            <>
              One payment, no ads, no export gate, every future tool. Normally{" "}
              <span className="line-through">{full}</span> — this price is for this visit only.
            </>
          )}
        </p>
        <div className="mt-5 flex flex-col">
          <button
            type="button"
            onClick={() => {
              grantVipOffer();
              track({ event_type: "click", slot: retarget ? "retarget_monthly" : "exit_intent_monthly" });
              setOpen(false);
              openVipModal("monthly");
            }}
            className={
              retarget
                ? "order-1 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                : "order-2 mt-2.5 w-full rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
            }
          >
            {retarget ? `Start 1 month — ${monthly}` : `Or try 1 month ad-free — ${monthly}`}
          </button>
          <button
            type="button"
            onClick={() => {
              grantVipOffer();
              track({ event_type: "click", slot: "exit_intent" });
              setOpen(false);
              openVipModal("lifetime");
            }}
            className={
              retarget
                ? "order-2 mt-2.5 w-full rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                : "order-1 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            }
          >
            {retarget ? `Or take lifetime — ${offer}` : `Claim ${offer} lifetime VIP`}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          No thanks, keep the ads
        </button>
      </div>
    </div>
  );
}
