import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

const KEY = "sov.scarcityStart";

/** Offer window length in milliseconds (15 minutes). */
const WINDOW_MS = 15 * 60_000;

function startedAt(): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && Date.now() - parsed < WINDOW_MS) return parsed;
    const now = Date.now();
    window.sessionStorage.setItem(KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/**
 * Session-scoped countdown next to the VIP price. Honest scarcity: the window
 * really is per visit, and the price shown is the one charged while it runs.
 */
export function ScarcityTimer({
  label = "Launch price ends in",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const start = startedAt();
    const tick = () => setLeft(Math.max(0, WINDOW_MS - (Date.now() - start)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (left === null || left <= 0) return null;

  const mins = Math.floor(left / 60_000);
  const secs = Math.floor((left % 60_000) / 1000);

  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary ${className}`}
      role="status"
    >
      <Timer className="size-3.5" aria-hidden="true" />
      {label}{" "}
      <span className="font-mono tabular-nums">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </p>
  );
}
