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
  /** ISO-3166 alpha-2 country of the visitor this delivery belongs to. */
  country?: string | null;
};

/**
 * In-memory guard against duplicate server-side deliveries fired within the
 * same isolate (double beacon, retried fetch, React strict-mode double call).
 * The database check below catches the cross-isolate case.
 */
const recentEventIds = new Map<string, number>();
const RECENT_TTL_MS = 10 * 60_000;

function rememberRecent(key: string): boolean {
  const now = Date.now();
  for (const [k, at] of recentEventIds) {
    if (now - at > RECENT_TTL_MS) recentEventIds.delete(k);
  }
  if (recentEventIds.has(key)) return false;
  recentEventIds.set(key, now);
  return true;
}

/**
 * Returns true when this `event_id` has not been forwarded server-side yet,
 * and claims it. Prevents the same conversion reaching Meta / TikTok twice —
 * the browser pixel de-duplication only covers browser vs server, not two
 * identical server posts.
 */
export async function claimServerEvent(eventId: string, event: string): Promise<boolean> {
  const key = `${event}:${eventId}`;
  if (!rememberRecent(key)) return false;
  try {
    const { admin } = await import("@/lib/admin-core.server");
    const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const { data, error } = await admin()
      .from("tracking_events")
      .select("id")
      .eq("event_id", eventId.slice(0, 80))
      .eq("source", "server")
      .gte("created_at", since)
      .limit(1);
    if (error) return true; // never block a conversion on a logging failure
    return (data ?? []).length === 0;
  } catch {
    return true;
  }
}

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
          country: entry.country ? entry.country.slice(0, 2).toUpperCase() : null,
        })),
      );
  } catch {
    /* logging must never break tracking */
  }
}
