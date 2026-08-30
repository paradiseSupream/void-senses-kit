/**
 * Shared server-side Meta Conversions API sender.
 *
 * Used by the browser-mirroring endpoint (/api/public/capi) and by the Whop
 * webhook, which is the authoritative source for `Purchase`: a payment is
 * reported even when the buyer never returns to the site. The browser fire and
 * this delivery carry the same `event_id`, so Meta counts one conversion.
 */

export type MetaServerEvent = {
  event: string;
  eventId: string;
  url?: string | null;
  value?: number | null;
  currency?: string;
  email?: string | null;
  country?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Pixel id + access token from the admin panel, falling back to env secrets. */
export async function metaCredentials(): Promise<{
  pixelId: string | null;
  token: string | null;
  testEventCode: string | null;
  enabled: boolean;
}> {
  let cfg: {
    server_side?: boolean;
    meta_pixel_id?: string;
    meta_capi_token?: string;
    meta_test_event_code?: string;
  } = {};
  try {
    const { readSettings } = await import("@/lib/admin-core.server");
    cfg = (await readSettings()).tracking;
  } catch {
    /* settings unavailable — env fallback below */
  }
  return {
    pixelId: cfg.meta_pixel_id || process.env["META_PIXEL_ID"] || null,
    token: cfg.meta_capi_token || process.env["META_CAPI_ACCESS_TOKEN"] || null,
    testEventCode: cfg.meta_test_event_code || null,
    enabled: cfg.server_side !== false,
  };
}

/**
 * Sends one conversion to Meta. Returns the delivery result so the caller can
 * log it into `tracking_events` for the admin monitor.
 */
export async function sendMetaEvent(
  input: MetaServerEvent,
): Promise<{ sent: boolean; ok: boolean; status: number; detail: string }> {
  const { pixelId, token, testEventCode, enabled } = await metaCredentials();
  if (!enabled || !pixelId || !token) {
    return { sent: false, ok: false, status: 0, detail: "Meta CAPI not configured" };
  }

  const userData: Record<string, unknown> = {};
  if (input.email) userData["em"] = [await sha256(input.email)];
  if (input.country) userData["country"] = [await sha256(input.country)];
  if (input.ip) userData["client_ip_address"] = input.ip;
  if (input.userAgent) userData["client_user_agent"] = input.userAgent;
  if (input.fbp) userData["fbp"] = input.fbp;
  if (input.fbc) userData["fbc"] = input.fbc;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(testEventCode ? { test_event_code: testEventCode } : {}),
          data: [
            {
              event_name: input.event,
              event_time: Math.floor(Date.now() / 1000),
              event_id: input.eventId,
              event_source_url: input.url ?? "https://sensesofvoid.app/",
              action_source: "website",
              user_data: userData,
              custom_data:
                input.value != null
                  ? { value: input.value, currency: input.currency ?? "USD" }
                  : {},
            },
          ],
        }),
      },
    );
    const text = res.ok ? "" : await res.text();
    if (!res.ok) console.error("meta capi failed", res.status, text);
    return {
      sent: true,
      ok: res.ok,
      status: res.status,
      detail: res.ok ? "Conversions API accepted" : text.slice(0, 400),
    };
  } catch (error) {
    console.error("meta capi error", error);
    return { sent: true, ok: false, status: 0, detail: String(error).slice(0, 300) };
  }
}
