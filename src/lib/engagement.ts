/**
 * Engagement signals used to delay ads until the visitor is actually invested.
 *
 * Two signals live here:
 *  - page-view depth per session (so the vignette can skip the first view)
 *  - "the visitor started interacting with a quiz" (so heavy formats lazy-load)
 *
 * Both are session-scoped and storage-safe; nothing personal is stored.
 */

const PV_KEY = "sov.pv";
const INTERACTED_KEY = "sov.interacted";
export const INTERACTION_EVENT = "sov:interaction";

/* ------------------------------------------------------------- page views */

/** Increments and returns the page-view depth of this session. */
export function bumpPageView(): number {
  if (typeof window === "undefined") return 0;
  try {
    const next = pageViews() + 1;
    window.sessionStorage.setItem(PV_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function pageViews(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.sessionStorage.getItem(PV_KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

/* ------------------------------------------------------------ interaction */

export function hasInteracted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(INTERACTED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Called the moment a visitor answers a question / uses a tool. */
export function markQuizInteraction(): void {
  if (typeof window === "undefined" || hasInteracted()) return;
  try {
    window.sessionStorage.setItem(INTERACTED_KEY, "1");
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(INTERACTION_EVENT));
}

/**
 * Runs `cb` once the visitor interacts with a tool, or after `fallbackMs` of
 * dwell time (so pure readers still monetise). Returns a cleanup function.
 */
const mountedAt = typeof performance === "undefined" ? 0 : performance.now();

export function whenEngaged(cb: () => void, fallbackMs = 12_000): () => void {
  if (typeof window === "undefined") return () => undefined;
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    cb();
  };
  if (hasInteracted()) {
    fire();
    return () => undefined;
  }
  window.addEventListener(INTERACTION_EVENT, fire, { once: true });
  const timer = window.setTimeout(fire, fallbackMs);
  return () => {
    window.removeEventListener(INTERACTION_EVENT, fire);
    window.clearTimeout(timer);
  };
}
