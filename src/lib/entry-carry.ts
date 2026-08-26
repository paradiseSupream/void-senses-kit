/**
 * Home-page "live entry": the visitor answers the first statement inside the
 * hero, then lands on the tool with that answer already recorded.
 *
 * Presentation-only plumbing — the scoring engine, the question bank and the
 * randomisation are untouched. The carried answer is just a pre-filled entry in
 * the same answers map the runner would have produced on question one.
 */

const KEY = "sov.entry.carry";

export type CarriedAnswer = { slug: string; id: string; weight: number };

export function carryAnswer(answer: CarriedAnswer) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(answer));
  } catch {
    /* private mode — the visitor simply answers the item again */
  }
}

/** Reads and clears the carried answer when it belongs to `slug`. */
export function takeCarriedAnswer(slug: string): CarriedAnswer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CarriedAnswer>;
    if (parsed?.slug !== slug || typeof parsed.id !== "string") return null;
    if (typeof parsed.weight !== "number") return null;
    sessionStorage.removeItem(KEY);
    return { slug, id: parsed.id, weight: parsed.weight };
  } catch {
    return null;
  }
}
