import { createFileRoute } from "@tanstack/react-router";

import { countryOf } from "@/lib/geo-header";

/**
 * Server-side conversion forwarding (Meta Conversions API + TikTok Events API).
 *
 * The browser pixels send the same `event_id`, so both platforms de-duplicate
 * automatically. PII (email, IP, user agent) is SHA-256 hashed before it
 * leaves this handler; nothing is stored on our side.
 */

const EVENTS = new Set([
  "ViewContent",
  "Lead",
  "CompleteRegistration",
  "InitiateCheckout",
  "AddToCart",
  "Purchase",
]);

const TIKTOK_MAP: Record<string, string> = {
  ViewContent: "ViewContent",
  Lead: "SubmitForm",
  CompleteRegistration: "CompleteRegistration",
  InitiateCheckout: "InitiateCheckout",
  AddToCart: "AddToCart",
  Purchase: "CompletePayment",
};

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function str(value: unknown, max = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

function clientIp(request: Request): string | null {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ??
    null
  );
}

export const Route = createFileRoute("/api/public/capi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event = str(body["event"], 40);
        if (!event || !EVENTS.has(event)) return new Response(null, { status: 204 });

        const eventId = str(body["event_id"], 80) ?? crypto.randomUUID();
        const url = str(body["url"], 500) ?? "https://sensesofvoid.app/";
        const currency = str(body["currency"], 8) ?? "USD";
        const rawValue = Number(body["value"]);
        const value = Number.isFinite(rawValue) ? Math.max(0, Math.min(100000, rawValue)) : null;
        const email = str(body["email"], 200);
        const ip = clientIp(request);
        const country = countryOf(request);
        const userAgent = request.headers.get("user-agent");
        const emailHash = email ? await sha256(email) : null;
        const timestamp = Math.floor(Date.now() / 1000);

        const tasks: Promise<unknown>[] = [];
        const { logTrackingEvents, claimServerEvent } = await import("@/lib/tracking-log.server");
        const log: Array<Parameters<typeof logTrackingEvents>[0][number]> = [];

        // One `event_id` is forwarded server-side exactly once: a repeated
        // beacon (retry, back/forward cache, double mount) is dropped here so
        // Meta / TikTok never count the same conversion twice.
        if (!(await claimServerEvent(eventId, event))) {
          return new Response(null, { status: 204, headers: { "x-dedup": "1" } });
        }

        // Credentials live in the admin panel (app_settings.tracking) and fall
        // back to environment secrets when they were never saved there.
        let cfg: {
          server_side?: boolean;
          meta_pixel_id?: string;
          meta_capi_token?: string;
          meta_test_event_code?: string;
          tiktok_pixel_id?: string;
          tiktok_events_token?: string;
        } = {};
        try {
          const { readSettings } = await import("@/lib/admin-core.server");
          cfg = (await readSettings()).tracking;
        } catch {
          /* settings unavailable — fall back to env below */
        }
        if (cfg.server_side === false) return new Response(null, { status: 204 });

        const metaPixel = cfg.meta_pixel_id || process.env["META_PIXEL_ID"];
        const metaToken = cfg.meta_capi_token || process.env["META_CAPI_ACCESS_TOKEN"];
        const metaFbp = str(body["fbp"], 120);
        const metaFbc = str(body["fbc"], 200);
        // Meta rejects (400 / subcode 2804050) any event without a usable
        // matching key, so an anonymous hit is skipped instead of logged as a
        // delivery failure.
        const hasMatchKey = Boolean(emailHash || ip || metaFbp || metaFbc);
        if (metaPixel && metaToken && hasMatchKey) {
          const userData: Record<string, unknown> = {};
          if (emailHash) userData["em"] = [emailHash];
          if (ip) userData["client_ip_address"] = ip;
          if (country) userData["country"] = [await sha256(country)];
          if (userAgent) userData["client_user_agent"] = userAgent;
          const fbp = metaFbp;
          const fbc = metaFbc;
          if (fbp) userData["fbp"] = fbp;
          if (fbc) userData["fbc"] = fbc;

          tasks.push(

            fetch(
              `https://graph.facebook.com/v20.0/${metaPixel}/events?access_token=${encodeURIComponent(metaToken)}`,
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  ...(cfg.meta_test_event_code
                    ? { test_event_code: cfg.meta_test_event_code }
                    : {}),
                  data: [
                    {
                      event_name: event,
                      event_time: timestamp,
                      event_id: eventId,
                      event_source_url: url,
                      action_source: "website",
                      user_data: userData,
                      custom_data: value != null ? { value, currency } : {},
                    },
                  ],
                }),
              },
            ).then(async (res) => {
              const text = res.ok ? "" : await res.text();
              if (!res.ok) console.error("meta capi failed", res.status, text);
              log.push({
                channel: "meta",
                source: "server",
                event,
                ok: res.ok,
                status: res.status,
                detail: res.ok ? "Conversions API accepted" : text,
                eventId,
                country,
              });
            }),
          );
        }

        const tiktokPixel = cfg.tiktok_pixel_id || process.env["TIKTOK_PIXEL_ID"];
        const tiktokToken = cfg.tiktok_events_token || process.env["TIKTOK_EVENTS_ACCESS_TOKEN"];
        if (tiktokPixel && tiktokToken) {
          const user: Record<string, unknown> = {};
          if (emailHash) user["email"] = emailHash;
          if (ip) user["ip"] = ip;
          if (userAgent) user["user_agent"] = userAgent;
          const ttclid = str(body["ttclid"], 200);
          const ttp = str(body["ttp"], 200);
          if (ttclid) user["ttclid"] = ttclid;
          if (ttp) user["ttp"] = ttp;

          tasks.push(
            fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
              method: "POST",
              headers: { "content-type": "application/json", "Access-Token": tiktokToken },
              body: JSON.stringify({
                event_source: "web",
                event_source_id: tiktokPixel,
                data: [
                  {
                    event: TIKTOK_MAP[event] ?? event,
                    event_time: timestamp,
                    event_id: eventId,
                    user,
                    page: { url },
                    properties: value != null ? { value, currency } : {},
                  },
                ],
              }),
            }).then(async (res) => {
              const body = (await res.json().catch(() => ({}))) as {
                code?: number;
                message?: string;
              };
              const ok = res.ok && body.code === 0;
              if (!ok) console.error("tiktok capi failed", res.status, body.message);
              log.push({
                channel: "tiktok",
                source: "server",
                event,
                ok,
                status: res.status,
                detail: ok ? "Events API accepted" : (body.message ?? `HTTP ${res.status}`),
                eventId,
                country,
              });
            }),
          );
        }

        await Promise.allSettled(tasks);
        await logTrackingEvents(log);
        return new Response(null, { status: 204 });
      },
    },
  },
});
