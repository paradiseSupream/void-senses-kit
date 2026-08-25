/**
 * Time-limited signed report tokens — SERVER ONLY.
 *
 * A verified buyer gets a short-lived HMAC token that names the exact axis
 * vector and the proof of purchase it was issued against. The PDF endpoint
 * accepts nothing else: the token cannot be forged in the browser, expires on
 * its own, and is re-checked against the payment tables before any premium byte
 * is written. So browser access alone can never reconstruct premium data.
 */

export const REPORT_TOKEN_TTL_MS = 10 * 60 * 1000;

export type ReportTokenPayload = {
  /** Normalised six-axis vector the dossier is generated from. */
  axes: { dim: string; value: number }[];
  /** Proof of purchase the token was minted for (re-verified on use). */
  orderId: string | null;
  licenseKey: string | null;
  /** Optional display name for the PDF cover. */
  name: string | null;
  /** Epoch ms expiry. */
  exp: number;
};

function secret(): string {
  const value =
    process.env["REPORT_TOKEN_SECRET"] ??
    process.env["WHOP_WEBHOOK_SECRET"] ??
    process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!value) throw new Error("report token secret unavailable");
  return value;
}

function b64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function sign(body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return b64url(new Uint8Array(mac));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signReportToken(
  payload: Omit<ReportTokenPayload, "exp"> & { exp?: number },
): Promise<string> {
  const full: ReportTokenPayload = {
    axes: payload.axes.map((a) => ({ dim: String(a.dim), value: Math.round(a.value) })),
    orderId: payload.orderId ?? null,
    licenseKey: payload.licenseKey ?? null,
    name: payload.name ? String(payload.name).slice(0, 60) : null,
    exp: payload.exp ?? Date.now() + REPORT_TOKEN_TTL_MS,
  };
  const body = b64url(new TextEncoder().encode(JSON.stringify(full)));
  return `${body}.${await sign(body)}`;
}

/** Returns the payload only for an intact, unexpired signature. */
export async function verifyReportToken(token: string): Promise<ReportTokenPayload | null> {
  if (typeof token !== "string" || token.length > 4000) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  let expected: string;
  try {
    expected = await sign(body);
  } catch {
    return null;
  }
  if (!timingSafeEqual(mac, expected)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as ReportTokenPayload;
    if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (!Array.isArray(payload.axes) || payload.axes.length === 0) return null;
    return payload;
  } catch {
    return null;
  }
}
