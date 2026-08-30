/**
 * Delivery log for Whop payment webhooks.
 *
 * Every incoming call is recorded — including the ones rejected for a bad
 * signature — together with the Meta Conversions API payload and response we
 * produced for it. Writes are best-effort: a logging failure must never make
 * the webhook fail, because Whop would retry and re-grant access.
 */

export type WebhookLogEntry = {
  eventType: string;
  orderId?: string | null;
  email?: string | null;
  verified: boolean;
  /** received | rejected | ignored | processed | closed | error */
  outcome: string;
  httpStatus?: number | null;
  capiPayload?: Record<string, string | number | boolean | null> | null;
  capiStatus?: number | null;
  capiResponse?: string | null;
  detail?: string | null;
  durationMs?: number | null;
};

export async function logWhopWebhook(entry: WebhookLogEntry): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("whop_webhook_logs").insert({
      event_type: entry.eventType.slice(0, 60),
      order_id: entry.orderId ? entry.orderId.slice(0, 80) : null,
      email: entry.email ? entry.email.slice(0, 200) : null,
      verified: entry.verified,
      outcome: entry.outcome.slice(0, 30),
      http_status: entry.httpStatus ?? null,
      capi_payload: entry.capiPayload ?? null,
      capi_status: entry.capiStatus ?? null,
      capi_response: entry.capiResponse ? entry.capiResponse.slice(0, 1000) : null,
      detail: entry.detail ? entry.detail.slice(0, 500) : null,
      duration_ms: entry.durationMs ?? null,
    });
  } catch {
    /* logging must never break a payment webhook */
  }
}
