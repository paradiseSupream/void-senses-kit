/**
 * Per-session "full report" unlock state.
 *
 * A free visitor unlocks the deep part of a result either by going VIP or by
 * passing one sponsor step (rewarded unlock). VIP status is handled elsewhere;
 * this module only remembers the rewarded unlocks for the current session.
 */

const KEY = "sov.unlocked";
const EVENT = "sov:unlock";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function isUnlocked(slug: string): boolean {
  return read().includes(slug);
}

export function unlockReport(slug: string) {
  if (typeof window === "undefined") return;
  try {
    const list = read();
    if (!list.includes(slug)) {
      window.sessionStorage.setItem(KEY, JSON.stringify([...list, slug]));
    }
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: slug }));
}

export function onUnlock(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
