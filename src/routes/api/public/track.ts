import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const EVENT_TYPES = new Set([
  "impression",
  "click",
  "conversion",
  "tool_start",
  "tool_complete",
  "gate_shown",
  "gate_completed",
]);

const MAX_EVENTS = 25;

function str(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { events?: unknown };
        try {
          body = (await request.json()) as { events?: unknown };
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const raw = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS) : [];
        const rows = raw
          .map((item) => {
            if (typeof item !== "object" || item === null) return null;
            const e = item as Record<string, unknown>;
            const eventType = str(e["event_type"], 32);
            const slot = str(e["slot"], 64);
            const sessionId = str(e["session_id"], 64);
            if (!eventType || !EVENT_TYPES.has(eventType) || !slot || !sessionId) return null;
            const revenue = Number(e["revenue_cents"]);
            return {
              event_type: eventType,
              slot,
              variant: str(e["variant"], 32) ?? "control",
              session_id: sessionId,
              tool_slug: str(e["tool_slug"], 64),
              revenue_cents: Number.isFinite(revenue)
                ? Math.max(0, Math.min(100_000, Math.round(revenue)))
                : 0,
              utm_source: str(e["utm_source"], 120),
              utm_medium: str(e["utm_medium"], 120),
              utm_campaign: str(e["utm_campaign"], 120),
              referrer: str(e["referrer"], 400),
              device: str(e["device"], 16),
              path: str(e["path"], 200),
              click_id: str(e["click_id"], 80),
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null);

        if (rows.length === 0) return new Response(null, { status: 204 });

        const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
        const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!url || !key) return new Response(null, { status: 204 });

        const admin = createClient(url, key, { auth: { persistSession: false } });
        const { error } = await admin.from("ad_events").insert(rows);
        if (error) {
          console.error("track insert failed", error.message);
          return new Response(null, { status: 204 });
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
