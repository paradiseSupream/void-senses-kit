/**
 * Single source of truth for every VIP price shown in the UI.
 *
 * Every surface (offer card, locked report, mid-quiz offer, exit offer, quiz
 * nudge, VIP modal, checkout page) must read prices from here so a visitor
 * never sees one number on the result page and a different one at payment.
 * The authoritative amounts charged still live server-side in
 * `vip.functions.ts` and MUST stay identical to these constants.
 */

import { useVipOffer } from "@/lib/vip-offer";
import { MONTHLY_OFFER_CENTS, OFFER_CENTS } from "@/lib/vip-offer";
import { LIFETIME_FULL_CENTS, MONTHLY_FULL_CENTS } from "@/lib/vip-prices";

/**
 * Customer-facing totals. Provider/processing cost is folded into these
 * amounts, so checkout never adds a surprise line after the CTA price.
 */
export const VIP_MONTHLY_CENTS = MONTHLY_FULL_CENTS;

/** Standard lifetime pass. */
export const VIP_LIFETIME_CENTS = LIFETIME_FULL_CENTS;

/** Discounted amounts once the one-visit downsell has been granted. */
export const VIP_MONTHLY_OFFER_CENTS = MONTHLY_OFFER_CENTS;
export const VIP_LIFETIME_OFFER_CENTS = OFFER_CENTS;

export const usd = (cents: number, decimals = 2) => `$${(cents / 100).toFixed(decimals)}`;

export type VipPrices = {
  offerActive: boolean;
  monthlyCents: number;
  lifetimeCents: number;
  /** Formatted customer total, e.g. "$3.49". */
  monthly: string;
  /** Formatted customer total, e.g. "$20.49". */
  lifetime: string;
  /** Undiscounted list prices, used only as honest strike-through anchors. */
  monthlyFull: string;
  lifetimeFull: string;
};

/**
 * Reactive prices for the current session. When the one-visit downsell is
 * active every surface drops to the discounted amounts at the same time.
 */
export function useVipPrices(): VipPrices {
  const offerActive = useVipOffer();
  const monthlyCents = offerActive ? VIP_MONTHLY_OFFER_CENTS : VIP_MONTHLY_CENTS;
  const lifetimeCents = offerActive ? VIP_LIFETIME_OFFER_CENTS : VIP_LIFETIME_CENTS;
  return {
    offerActive,
    monthlyCents,
    lifetimeCents,
    monthly: usd(monthlyCents),
    lifetime: usd(lifetimeCents),
    monthlyFull: usd(VIP_MONTHLY_CENTS),
    lifetimeFull: usd(VIP_LIFETIME_CENTS),
  };
}
