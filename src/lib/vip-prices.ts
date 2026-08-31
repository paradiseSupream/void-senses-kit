/**
 * Pure price constants — the single source of truth shared by the browser UI
 * (`vip-pricing.ts`) and the server (`vip.functions.ts`, `whop.server.ts`).
 *
 * Keeping them in one dependency-free module means a price change can never
 * leave the checkout page, the Whop plan shape and the displayed number out of
 * sync — every consumer derives from these four values.
 */

/** Regular monthly pass (primary entry price). */
export const MONTHLY_FULL_CENTS = 499;
/** Genuine-exit one-time monthly price. */
export const MONTHLY_OFFER_CENTS = 249;
/** Regular lifetime pass (primary CTA). */
export const LIFETIME_FULL_CENTS = 2049;
/** Genuine-exit one-time lifetime price. */
export const LIFETIME_OFFER_CENTS = 999;

export const VIP_PRICE_TABLE = {
  lifetime: { full: LIFETIME_FULL_CENTS, offer: LIFETIME_OFFER_CENTS },
  monthly: { full: MONTHLY_FULL_CENTS, offer: MONTHLY_OFFER_CENTS },
} as const;

/** Every amount that is billed as a recurring monthly plan. */
export const MONTHLY_AMOUNTS: readonly number[] = [MONTHLY_FULL_CENTS, MONTHLY_OFFER_CENTS];

/** Dynamic check — replaces hardcoded amount comparisons in the UI. */
export function isMonthlyAmount(cents: number | string | null | undefined): boolean {
  if (cents === null || cents === undefined) return false;
  const value = typeof cents === "number" ? cents : Number(String(cents).replace(/\D/g, ""));
  return Number.isFinite(value) && MONTHLY_AMOUNTS.includes(value);
}
