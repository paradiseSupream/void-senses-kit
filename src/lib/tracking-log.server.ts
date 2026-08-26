/**
 * Delivery log for advertising events (browser pixels + server-side APIs).
 *
 * Writes are best-effort: tracking must never break a request, so every
 * failure is swallowed. Reads happen only from the admin monitor.
 */

export type TrackingLogEntry = {
  channel: "meta" | "tiktok" | "ga4" | "google_ads";
  source: "browser" | "server" | "sandbox";
  event: string;
  ok: boolean;
  status?: number | null;
  detail?: string | null;
  eventId?: string | null;
};

export async function logTrackingEvents(entries: TrackingLogEntry[]): Promise<void> {
  if (entries.length === 0) return;
  try {
    const { admin } = await import("@/lib/admin-core.server");
    await admin()
      .from("tracking_events")
      .insert(
        entries.map((entry) => ({
          channel: entry.channel,
          source: entry.source,
          event: entry.event.slice(0, 60),
          ok: entry.ok,
          status: entry.status ?? null,
          detail: entry.detail ? entry.detail.slice(0, 500) : null,
          event_id: entry.eventId ? entry.eventId.slice(0, 80) : null,
        })),
      );
  } catch {
    /* logging must never break tracking */
  }
}
