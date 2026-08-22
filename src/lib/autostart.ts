import { useEffect, useRef } from "react";

/**
 * Chained sessions: when a result page sends the visitor to the next quiz it
 * appends `?auto=1`, and the target tool skips its intro screen automatically.
 */
export const AUTO_START_PARAM = "auto";

export function autoStartRequested(): boolean {
  if (typeof window === "undefined") return false;
  const raw = new URLSearchParams(window.location.search).get(AUTO_START_PARAM);
  // Router search serialisation can JSON-encode the value, so `1` may arrive as `"1"`.
  return raw?.replace(/^"|"$/g, "") === "1";
}

/** Fires `start()` once on mount when the URL asked for an auto-start. */
export function useAutoStart(start: () => void) {
  const ref = useRef(start);
  ref.current = start;

  useEffect(() => {
    if (!autoStartRequested()) return;
    ref.current();
    const url = new URL(window.location.href);
    url.searchParams.delete(AUTO_START_PARAM);
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, []);
}
