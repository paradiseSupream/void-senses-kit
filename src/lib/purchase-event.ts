/**
 * Deterministic Meta/TikTok `event_id` for a paid order.
 *
 * Both the browser pixel on /vip/success and the Whop webhook (server side)
 * derive the id from the order id, so the two deliveries de-duplicate into a
 * single counted conversion no matter which one arrives first.
 */
export function purchaseEventId(orderId: string): string {
  return `purchase:${orderId}`;
}
