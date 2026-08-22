import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";
import { grantVipOffer, OFFER_CENTS } from "@/lib/vip-offer";
import { track } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";

const SEEN_KEY = "sov.exitOfferSeen";

/**
 * One-time exit-intent offer: discounted lifetime VIP shown once per session
 * when the visitor is about to leave (pointer to the top edge on desktop, or
 * long dwell + deep scroll on touch).
 */
export function ExitIntentOffer() {
  const { isVip, openVipModal } = useVip();
  const { site } = useSiteConfig();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isVip) return;
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
    }, 45_000);

    let cleanupScroll = () => undefined as void;
    document.addEventListener("mouseout", onMouseOut);

    function cleanup() {
      document.removeEventListener("mouseout", onMouseOut);
      window.clearTimeout(touchTimer);
      cleanupScroll();
    }
    return cleanup;
  }, [isVip]);

  if (!open || isVip) return null;

  const full = `$${(site.vip_price_cents / 100).toFixed(0)}`;
  const offer = `$${(OFFER_CENTS / 100).toFixed(0)}`;

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
          Before you go — {offer} lifetime
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One payment, no ads, no export gate, every future tool. Normally{" "}
          <span className="line-through">{full}</span> — this price is for this visit only.
        </p>
        <button
          type="button"
          onClick={() => {
            grantVipOffer();
            track({ event_type: "click", slot: "exit_intent" });
            setOpen(false);
            openVipModal();
          }}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Claim {offer} lifetime VIP
        </button>
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
