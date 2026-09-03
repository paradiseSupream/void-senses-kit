/**
 * Two-player link encoding for the invite-based tools (Friend Quiz, Battle).
 *
 * Player one's answers are packed into a short URL-safe token that lives only
 * in the link — nothing is stored server-side, so an invite is fully private
 * and works even if the friend never returns to the site again.
 */

export type DuelPayload = {
  /** Tool key: "fq" (friend quiz) or "bt" (battle). */
  k: "fq" | "bt";
  /** Optional first name of the challenger (display only, max 16 chars). */
  n: string;
  /** Question ids, in asked order. */
  q: string[];
  /** Answer index per question, aligned with `q`. */
  a: number[];
};

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeDuel(payload: DuelPayload): string {
  return toBase64Url(
    JSON.stringify({
      k: payload.k,
      n: payload.n.slice(0, 16),
      q: payload.q,
      a: payload.a,
    }),
  );
}

export function decodeDuel(token: string, expect: DuelPayload["k"]): DuelPayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as Partial<DuelPayload>;
    if (!parsed || parsed.k !== expect) return null;
    if (!Array.isArray(parsed.q) || !Array.isArray(parsed.a)) return null;
    if (parsed.q.length === 0 || parsed.q.length !== parsed.a.length) return null;
    const q = parsed.q.filter((x): x is string => typeof x === "string");
    const a = parsed.a.filter((x): x is number => Number.isInteger(x) && x >= 0 && x < 8);
    if (q.length !== parsed.q.length || a.length !== parsed.a.length) return null;
    return { k: expect, n: typeof parsed.n === "string" ? parsed.n.slice(0, 16) : "", q, a };
  } catch {
    return null;
  }
}

export function duelUrl(path: string, payload: DuelPayload): string {
  const origin = typeof window === "undefined" ? "https://sensesofvoid.app" : window.location.origin;
  return `${origin}${path}?k=${encodeDuel(payload)}`;
}
