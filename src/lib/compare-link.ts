/**
 * Friend-compare viral links. A result is encoded into a short URL-safe token
 * so a friend can open `/compare?r=<token>`, see the challenger's score and be
 * pushed straight into the same test — the cheapest K-factor we have.
 */

export type ComparePayload = {
  /** Tool slug, e.g. "iq". */
  t: string;
  /** Tool display name. */
  n: string;
  /** Headline score, e.g. "128" or "Architect". */
  h: string;
  /** Up to 4 short supporting lines. */
  l: string[];
  /** Route to the tool, e.g. "/tools/iq". */
  p: string;
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
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeCompare(payload: ComparePayload): string {
  return toBase64Url(JSON.stringify({ ...payload, l: payload.l.slice(0, 4) }));
}

export function decodeCompare(token: string): ComparePayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as Partial<ComparePayload>;
    if (!parsed || typeof parsed.t !== "string" || typeof parsed.h !== "string") return null;
    return {
      t: parsed.t,
      n: typeof parsed.n === "string" ? parsed.n : parsed.t,
      h: parsed.h,
      l: Array.isArray(parsed.l) ? parsed.l.filter((x): x is string => typeof x === "string") : [],
      p: typeof parsed.p === "string" && parsed.p.startsWith("/") ? parsed.p : "/tools",
    };
  } catch {
    return null;
  }
}

export function compareUrl(payload: ComparePayload): string {
  const origin =
    typeof window === "undefined" ? "https://sensesofvoid.app" : window.location.origin;
  return `${origin}/compare?r=${encodeCompare(payload)}`;
}
