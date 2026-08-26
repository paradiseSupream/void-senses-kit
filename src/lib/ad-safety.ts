/**
 * Runs non-critical ad work only after the document has loaded and the browser
 * has an idle window. The timeout fallback keeps this working on older mobile
 * browsers without making ads part of the critical rendering path.
 */
export function scheduleAdWork(work: () => void, timeoutMs = 2_000): () => void {
  if (typeof window === "undefined") return () => undefined;

  let cancelled = false;
  let fallbackTimer: number | undefined;
  let idleId: number | undefined;

  const safelyRun = () => {
    if (cancelled) return;
    try {
      work();
    } catch (error) {
      console.warn("[ads] isolated ad work failed", error);
    }
  };

  const queueIdle = () => {
    if (cancelled) return;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(safelyRun, { timeout: timeoutMs });
      return;
    }
    fallbackTimer = window.setTimeout(safelyRun, Math.min(timeoutMs, 1_000));
  };

  if (document.readyState === "complete") queueIdle();
  else window.addEventListener("load", queueIdle, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", queueIdle);
    if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    const idleWindow = window as Window & { cancelIdleCallback?: (id: number) => void };
    if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
  };
}