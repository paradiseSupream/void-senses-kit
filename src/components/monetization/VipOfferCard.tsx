import { useEffect } from "react";
import { Check, Crown, Zap } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";
import { track } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";
import { MONTHLY_OFFER_CENTS, useVipOffer } from "@/lib/vip-offer";
import { VIP_MONTHLY_CENTS } from "@/lib/vip-pricing";

/**
 * Always-visible entry offer on every result screen.
 *
 * The gate used to render only inside `LockedReport`, so unlocked or
 * ungated tools showed no offer at all — most result views never saw a
 * price. This card guarantees 100% offer visibility for non-VIP visitors and
 * leads with the low-friction monthly pass, with lifetime as the upsell.
 */
export function VipOfferCard({
  toolSlug,
  className = "",
}: {
  toolSlug: string;
  className?: string;
}) {
  const { isVip, openVipModal } = useVip();
  const { site } = useSiteConfig();
  const offerActive = useVipOffer();

  const monthlyCents = offerActive ? MONTHLY_OFFER_CENTS : VIP_MONTHLY_CENTS;
  const monthly = `$${(monthlyCents / 100).toFixed(2)}`;
  const lifetime = `$${(site.vip_price_cents / 100).toFixed(0)}`;

  useEffect(() => {
    if (isVip) return;
    track({ event_type: "impression", slot: "vip_offer_card", tool_slug: toolSlug });
    trackFunnel("vip_gate_shown", toolSlug);
  }, [isVip, toolSlug]);

  if (isVip) return null;

  return (
    <section
      className={`glass rounded-2xl border border-primary/25 p-5 sm:p-6 ${className}`}
      aria-labelledby="vip-offer-card-title"
    >
      <span className="label-mono text-primary">Unlock everything</span>
      <h3 id="vip-offer-card-title" className="mt-1.5 font-display text-xl font-bold">
        Get the full breakdown, ad-free — from {monthly}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Start with a {monthly} pass, or go lifetime for {lifetime}. Both remove every ad and
        export gate instantly.
      </p>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {[
          "Full deep report, no blur",
          "No ads, no export gates",
          "HD PDF + share cards",
          "Every future tool included",
        ].map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {perk}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={() => openVipModal("monthly")}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Zap className="size-4" aria-hidden="true" /> Unlock now · {monthly}
        </button>
        <button
          type="button"
          onClick={() => openVipModal("lifetime")}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          <Crown className="size-4" aria-hidden="true" /> Lifetime · {lifetime}
        </button>
      </div>
      <p className="mt-2.5 text-center text-xs text-muted-foreground">
        Secure checkout · instant access · nothing auto-renews
      </p>

      {/* Not ready to pay is the majority case — capturing the email here turns
          a one-shot paid visitor into someone we can bring back for free. */}
      <EmailCapture toolSlug={toolSlug} source="offer_card" className="mt-5" />
    </section>
  );
}

