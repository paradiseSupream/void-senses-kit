/**
 * Client-side retargeting segments.
 *
 * The visitor's furthest funnel step is remembered in localStorage so a
 * returning non-buyer can be recognised on the next visit and offered the
 * $2.99 monthly pass instead of the full lifetime price. Purely first-party:
 * no personal data, only a segment name and a timestamp.
 */

const KEY = "sov.retarget";

export type RetargetSegment =
  | "test_starter"
  | "quiz_completer"
  | "checkout_abandoner"
  | "buyer";

type State = { segment: RetargetSegment; at: number };

const RANK: Record<RetargetSegment, number> = {
  test_starter: 1,
  quiz_completer: 2,
  checkout_abandoner: 3,
  buyer: 4,
};

function read(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as State;
    return parsed && parsed.segment in RANK ? parsed : null;
  } catch {
    return null;
  }
}

/** Records the visitor's furthest funnel step (never downgrades). */
export function markRetarget(segment: RetargetSegment): void {
  if (typeof window === "undefined") return;
  const current = read();
  if (current && RANK[current.segment] >= RANK[segment]) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ segment, at: Date.now() } satisfies State));
  } catch {
    /* storage unavailable */
  }
}

export function retargetSegment(): RetargetSegment | null {
  return read()?.segment ?? null;
}

/**
 * True when this is a *returning* visitor who reached the result or the VIP
 * gate on an earlier visit and never bought — the $2.99 monthly audience.
 */
export function isMonthlyRetargetVisitor(): boolean {
  const state = read();
  if (!state) return false;
  if (state.segment !== "quiz_completer" && state.segment !== "checkout_abandoner") return false;
  const ageMs = Date.now() - state.at;
  // At least 30 minutes old (so it is a later visit) and not older than 30 days.
  return ageMs > 30 * 60_000 && ageMs < 30 * 86_400_000;
}

/** Maps a funnel step onto its retargeting segment, if any. */
export function segmentForFunnelStep(step: string): RetargetSegment | null {
  if (step === "test_start") return "test_starter";
  if (step === "result_view") return "quiz_completer";
  if (step === "vip_gate_shown") return "checkout_abandoner";
  if (step === "vip_purchase") return "buyer";
  return null;
}
