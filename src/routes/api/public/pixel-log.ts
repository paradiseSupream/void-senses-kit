import { createFileRoute } from "@tanstack/react-router";

/**
 * Browser-pixel delivery beacon.
 *
 * The client reports which pixels actually fired (Meta / TikTok / GA4) so the
 * admin monitor can compare browser coverage against server-side deliveries.
 * No PII is accepted here — only a channel, an event name and an event id.
 */

const CHANNELS = new Set(["meta", "tiktok", "ga4", "google_ads"]);
const EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Lead",
  "CompleteRegistration",
  "InitiateCheckout",
  "AddToCart",
  "Purchase",
]);

export const Route = createFileRoute("/api/public/pixel-log")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response(null, { status: 204 });
        }

        const rawEntries = Array.isArray(body["entries"]) ? body["entries"] : [];
        const eventId = String(body["event_id"] ?? "").slice(0, 80) || null;

        const entries = rawEntries
          .slice(0, 6)
          .map((raw) => {
            const item = (raw ?? {}) as Record<string, unknown>;
            const channel = String(item["channel"] ?? "");
            const event = String(item["event"] ?? "");
            if (!CHANNELS.has(channel) || !EVENTS.has(event)) return null;
            return {
              channel: channel as "meta" | "tiktok" | "ga4" | "google_ads",
              source: "browser" as const,
              event,
              ok: item["ok"] !== false,
              detail:
                item["ok"] === false
                  ? "Pixel not loaded when the event fired"
                  : "Browser pixel fired",
              eventId,
            };
          })
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

        if (entries.length > 0) {
          const { logTrackingEvents } = await import("@/lib/tracking-log.server");
          await logTrackingEvents(entries);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
