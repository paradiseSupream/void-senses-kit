import { useEffect } from "react";

import { track } from "@/lib/monetization";

/**
 * Session dwell tracker.
 *
 * Sends a tiny `heartbeat` event at a few milestones (and once on hide) with
 * the elapsed time, so the admin panel can report real "time on site" per
 * session, per country and per traffic source. No personal data is involved —
 * only the anonymous session id already used by the ad layer.
 */
const MILESTONES_MS = [15_000, 30_000, 60_000, 120_000, 300_000, 600_000];

export function SessionPulse() {
  useEffect(() => {
    const startedAt = Date.now();
    const timers: number[] = [];

    const beat = (path: string) => {
      const elapsed = Date.now() - startedAt;
      track({
        event_type: "heartbeat",
        slot: path,
        duration_ms: Math.min(600_000, elapsed),
      });
    };

    for (const ms of MILESTONES_MS) {
      timers.push(window.setTimeout(() => beat(window.location.pathname), ms));
    }

    const onHide = () => {
      if (document.visibilityState === "hidden") beat(window.location.pathname);
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      for (const id of timers) window.clearTimeout(id);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  return null;
}
