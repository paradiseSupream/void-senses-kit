/**
 * Server-only admin helpers: credential check, HMAC session tokens and a
 * service-role Supabase client. Never imported by client code.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  const secret = process.env["ADMIN_SESSION_SECRET"];
  if (!secret) throw new Error("Admin sessions are not configured.");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return b64url(new Uint8Array(sig));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const TTL_MS = 8 * 60 * 60 * 1000;

export async function login(username: string, password: string): Promise<string> {
  const user = process.env["ADMIN_USERNAME"];
  const pass = process.env["ADMIN_PASSWORD"];
  if (!user || !pass) throw new Error("Admin credentials are not configured.");
  if (!safeEqual(username, user) || !safeEqual(password, pass)) {
    throw new Error("Invalid username or password.");
  }
  const payload = `${Date.now() + TTL_MS}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function requireAdmin(token: string): Promise<void> {
  const [payload, sig] = String(token ?? "").split(".");
  if (!payload || !sig) throw new Error("Unauthorized");
  const expected = await hmac(payload);
  if (!safeEqual(sig, expected)) throw new Error("Unauthorized");
  if (Number(payload) < Date.now()) throw new Error("Session expired");
}

export function admin(): SupabaseClient {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Backend is not configured.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export type { AdsSettings, SiteSettings, TrackingSettings } from "@/lib/admin-types";
import {
  DEFAULT_CAPS,
  DEFAULT_PRIVACY,
  DEFAULT_TRACKING,
  ADSTERRA,
  MONETAG,
  type AdsSettings,
  type SiteSettings,
  type TrackingSettings,
} from "@/lib/admin-types";


export const DEFAULT_ADS: AdsSettings = {
  enabled: true,
  lean_mode: false,
  monetag_verify: "d7498800db613e1e682b5c72b66a050b",
  monetag_zone: "",
  monetag_popunder: true,
  monetag_popunder_zone: MONETAG.popunder.zone,
  monetag_inpage_push: true,
  monetag_push_zone: MONETAG.push.zone,
  monetag_vignette: true,
  monetag_vignette_zone: MONETAG.vignette.zone,
  smartlink_url: MONETAG.smartlink,
  adsterra_banner_key: "",
  adsterra_native_key: "",
  adsterra_social_bar: false,
  adsterra_social_bar_src: ADSTERRA.social_bar,
  // Adsterra Social Bar occupies the bottom of the mobile viewport, so the
  // first-party sticky mobile ad is off by default to avoid double-stacking.
  slots: { result: true, gate: true, sticky_mobile: true, sticky_desktop: true, native_feed: true },
  caps: DEFAULT_CAPS,
  privacy: DEFAULT_PRIVACY,
  rpm_estimate_cents: 120,
};

export const DEFAULT_SITE: SiteSettings = {
  maintenance: false,
  announcement: "",
  vip_price_cents: 1900,
  vip_sol_address: "8y9Bo4hHAead7VnkbMEMBUgwxSUMBZzPDKodE1PFs9vP",
  stripe_enabled: false,
};

/** Environment fallbacks so ids configured as secrets keep working. */
function trackingEnvDefaults(): TrackingSettings {
  const env = (name: string) => (process.env[name] ?? "").trim();
  return {
    ...DEFAULT_TRACKING,
    meta_pixel_id: env("META_PIXEL_ID") || env("VITE_META_PIXEL_ID"),
    meta_capi_token: env("META_CAPI_ACCESS_TOKEN"),
    tiktok_pixel_id: env("TIKTOK_PIXEL_ID") || env("VITE_TIKTOK_PIXEL_ID"),
    tiktok_events_token: env("TIKTOK_EVENTS_ACCESS_TOKEN"),
    google_ads_id: env("VITE_GOOGLE_ADS_ID"),
    ga4_id: env("VITE_GA4_ID"),
  };
}

export async function readSettings(): Promise<{
  ads: AdsSettings;
  site: SiteSettings;
  tracking: TrackingSettings;
}> {
  const db = admin();
  const { data } = await db.from("app_settings").select("key,value");
  const map = new Map((data ?? []).map((row) => [row.key as string, row.value as object]));
  const storedAds = (map.get("ads") ?? {}) as Partial<AdsSettings>;
  return {
    ads: {
      ...DEFAULT_ADS,
      ...storedAds,
      slots: { ...DEFAULT_ADS.slots, ...(storedAds.slots ?? {}) },
      caps: { ...DEFAULT_CAPS, ...(storedAds.caps ?? {}) },
      privacy: { ...DEFAULT_PRIVACY, ...(storedAds.privacy ?? {}) },
    },
    site: { ...DEFAULT_SITE, ...(map.get("site") as SiteSettings | undefined) },
    tracking: (() => {
      const envDefaults = trackingEnvDefaults();
      const stored = (map.get("tracking") ?? {}) as Partial<TrackingSettings>;
      const merged = { ...envDefaults, ...stored } as TrackingSettings;
      // A blank stored value must not wipe out a working environment id.
      for (const key of Object.keys(envDefaults) as Array<keyof TrackingSettings>) {
        if (typeof merged[key] === "string" && merged[key] === "") {
          (merged[key] as string) = envDefaults[key] as string;
        }
      }
      return merged;
    })(),
  };
}

export async function writeSetting(
  key: "ads" | "site" | "tracking",
  value: object,
): Promise<void> {
  const db = admin();
  const { error } = await db
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}
