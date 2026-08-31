/**
 * Shared client-side VIP price constants.
 *
 * Kept in a plain module (not the modal) so cards and gates can show the
 * entry price without importing the whole checkout UI. The authoritative
 * amounts still live server-side in `vip.functions.ts`.
 */

/** Entry-priced monthly no-ads pass — the first offer cold traffic sees. */
export const VIP_MONTHLY_CENTS = 299;
