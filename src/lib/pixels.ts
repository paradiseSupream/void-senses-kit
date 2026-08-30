/**
 * Advertising pixels: Meta (Facebook), TikTok and Google Ads.
 *
 * Every pixel is consent-gated and loads only in the browser. Each conversion
 * event also gets a stable `event_id` so the browser pixel and the server-side
 * Conversions API (see /api/public/capi) can be de-duplicated by the platform.
 */

/**
 * Ids come from the admin panel at runtime; the build-time env values are only
 * a fallback so an existing .env setup keeps working.
 */
type PixelIds = {
  meta?: string | undefined;
  tiktok?: string | undefined;
  googleAds?: string | undefined;
  googleLabel?: string | undefined;
};

const ids: PixelIds = {
  meta: (import.meta.env["VITE_META_PIXEL_ID"] as string | undefined) || undefined,
  tiktok: (import.meta.env["VITE_TIKTOK_PIXEL_ID"] as string | undefined) || undefined,
  googleAds: (import.meta.env["VITE_GOOGLE_ADS_ID"] as string | undefined) || undefined,
};

/** Called by the pixel loader with the ids saved in the admin panel. */
export function configurePixels(next: PixelIds) {
  if (next.meta) ids.meta = next.meta;
  if (next.tiktok) ids.tiktok = next.tiktok;
  if (next.googleAds) ids.googleAds = next.googleAds;
  if (next.googleLabel) ids.googleLabel = next.googleLabel;
  // Ids may arrive after an early conversion already queued itself; replay now.
  flushBrowserFires();
}

const META_ID = () => ids.meta;
const TIKTOK_ID = () => ids.tiktok;
const GOOGLE_ADS_ID = () => ids.googleAds;

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown };
    _fbq?: unknown;
    ttq?: Record<string, (...args: unknown[]) => void> & { load?: (id: string) => void; page?: () => void };
    TiktokAnalyticsObject?: string;
  }
}

let metaLoaded = false;
let tiktokLoaded = false;
let googleAdsLoaded = false;

export const metaEnabled = () => typeof window !== "undefined" && Boolean(META_ID());
export const tiktokEnabled = () => typeof window !== "undefined" && Boolean(TIKTOK_ID());
export const googleAdsEnabled = () => typeof window !== "undefined" && Boolean(GOOGLE_ADS_ID());
export const pixelsEnabled = () => metaEnabled() || tiktokEnabled() || googleAdsEnabled();

export function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function injectScript(src: string) {
  const el = document.createElement("script");
  el.async = true;
  el.src = src;
  document.head.appendChild(el);
}

/** Pixel ids already initialised in this tab (static boot code included). */
const metaInited = new Set<string>();

/** Meta's own consent API — nothing is sent while consent is revoked. */
function setMetaConsent(granted: boolean) {
  if (typeof window.fbq !== "function") return;
  window.fbq("consent", granted ? "grant" : "revoke");
}

function loadMeta() {
  if (!metaEnabled()) return;
  // Some in-app browsers/privacy extensions remove `fbq` after the loader was
  // requested. `metaLoaded` alone is therefore not proof that the callable
  // queue still exists. Recreate the official stub whenever it disappeared.
  if (typeof window.fbq === "function") {
    metaLoaded = true;
    // The static base code in <head> may have booted another id (env value);
    // initialise the admin-configured one too, exactly once.
    const id = META_ID()!;
    const booted = (window as unknown as { __sovMetaBooted?: string }).__sovMetaBooted;
    if (!metaInited.has(id) && booted !== id) {
      metaInited.add(id);
      window.fbq("init", id);
    }
    setMetaConsent(true);
    return;
  }
  metaLoaded = true;
  const n: any = (window.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue!.push(args);
  } as any);
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  if (!document.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]')) {
    injectScript("https://connect.facebook.net/en_US/fbevents.js");
  }
  window.fbq!("init", META_ID());
  window.fbq!("track", "PageView");
}

function loadTikTok() {
  if (tiktokLoaded || !tiktokEnabled()) return;
  tiktokLoaded = true;
  window.TiktokAnalyticsObject = "ttq";
  const ttq: any = (window.ttq = window.ttq || ({} as any));
  ttq.methods = [
    "page",
    "track",
    "identify",
    "instances",
    "debug",
    "on",
    "off",
    "once",
    "ready",
    "alias",
    "group",
    "enableCookie",
    "disableCookie",
  ];
  ttq._i = ttq._i || {};
  ttq._t = ttq._t || {};
  ttq._o = ttq._o || {};
  for (const method of ttq.methods) {
    ttq[method] = ((m: string) =>
      function (...args: unknown[]) {
        (ttq._q = ttq._q || []).push([m, args]);
      })(method);
  }
  const tid = TIKTOK_ID()!;
  ttq._i[tid] = [];
  ttq._t[tid] = Date.now();
  ttq._o[tid] = {};
  injectScript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${TIKTOK_ID()}&lib=ttq`);
  ttq.page?.();
}

function loadGoogleAds() {
  if (googleAdsLoaded || !googleAdsEnabled()) return;
  googleAdsLoaded = true;
  if (typeof window.gtag !== "function") {
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID()}`);
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
  }
  window.gtag!("config", GOOGLE_ADS_ID());
}

/**
 * Whether advertising consent currently allows the pixels to run. Set by the
 * pixel loader so conversions fired before the loader effect ran (or during a
 * fast route change) can still bootstrap the pixel instead of being lost.
 */
let pixelsAllowed = false;

/**
 * Browser pixel fires that happened before the pixels were allowed/loaded —
 * e.g. during the ~2s geo-consent check, or a fast route change. They are
 * replayed the moment pixels come online, so a conversion that fired a few
 * hundred ms too early is never reported as "Pixel not loaded".
 */
const pendingBrowserFires: Array<() => void> = [];

export function setPixelsAllowed(allowed: boolean) {
  pixelsAllowed = allowed;
  if (allowed) flushBrowserFires();
}

/** Loads every configured pixel (call only after advertising consent). */
export function loadPixels() {
  loadMeta();
  loadTikTok();
  loadGoogleAds();
  flushBrowserFires();
}

/** Replays any browser fires that were queued while pixels were offline. */
function flushBrowserFires() {
  // Consent and runtime configuration resolve independently. Do not replay
  // until at least one configured pixel can actually accept the event.
  if (!pixelsAllowed || !pixelsEnabled() || pendingBrowserFires.length === 0) return;
  // Make sure the pixel stubs exist before replaying, in case the loader
  // effect has not run yet (ids configured late, fast route change, etc.).
  loadMeta();
  loadTikTok();
  loadGoogleAds();
  const fires = pendingBrowserFires.splice(0);
  for (const fire of fires) fire();
}

/** Makes sure the pixels are live before a conversion event is fired. */
function ensurePixelsLoaded() {
  if (!pixelsAllowed || !pixelsEnabled()) return;
  loadPixels();
}

export function pixelPageView(path: string) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "PageView", { page_path: path });
  window.ttq?.page?.();
  if (googleAdsEnabled()) window.gtag?.("event", "page_view", { page_path: path });
}

/** Reads a first-party cookie (used for _fbc/_fbp click identifiers). */
export function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : undefined;
}

export type PixelEvent =
  | "ViewContent"
  | "Lead"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "AddToCart"
  | "Purchase";

const TIKTOK_MAP: Record<PixelEvent, string> = {
  ViewContent: "ViewContent",
  Lead: "SubmitForm",
  CompleteRegistration: "CompleteRegistration",
  InitiateCheckout: "InitiateCheckout",
  AddToCart: "AddToCart",
  Purchase: "CompletePayment",
};

export type PixelPayload = {
  value?: number;
  currency?: string;
  contentName?: string;
  email?: string;
  eventId?: string;
};

/**
 * Fires one conversion on every configured pixel and mirrors it to the
 * server-side Conversions API with the same event id (de-duplicated).
 */
/** Event ids already fired in this tab — blocks accidental double sends. */
const firedEventIds = new Set<string>();

/**
 * Stable `event_id` for a logical conversion (survives remounts and reloads in
 * the same session), so browser and server deliveries always pair up.
 */
export function stableEventId(key: string): string {
  if (typeof window === "undefined") return newEventId();
  const storeKey = `sov.evid.${key}`;
  try {
    const existing = window.sessionStorage.getItem(storeKey);
    if (existing) return existing;
    const created = newEventId();
    window.sessionStorage.setItem(storeKey, created);
    return created;
  } catch {
    return newEventId();
  }
}

export function pixelTrack(event: PixelEvent, payload: PixelPayload = {}) {
  if (typeof window === "undefined") return;
  const eventId = payload.eventId ?? newEventId();
  const currency = payload.currency ?? "USD";

  // De-duplicate at the source: the same event id never fires twice.
  const dedupeKey = `${event}:${eventId}`;
  if (firedEventIds.has(dedupeKey)) return;
  firedEventIds.add(dedupeKey);

  /** Fires the browser pixels and reports their delivery status. */
  const fireBrowser = () => {
    ensurePixelsLoaded();
    // `ensurePixelsLoaded` normally creates the stub synchronously. If a host
    // browser removed it between calls, rebuild it once before reporting the
    // delivery result to the monitor.
    if (metaEnabled() && typeof window.fbq !== "function") loadMeta();
    const metaReady = typeof window.fbq === "function" && metaEnabled();
    if (metaReady) {
      window.fbq?.(
        "track",
        event,
        {
          value: payload.value,
          currency,
          content_name: payload.contentName,
        },
        { eventID: eventId },
      );
    }

    window.ttq?.["track"]?.(TIKTOK_MAP[event], {
      value: payload.value,
      currency,
      content_name: payload.contentName,
      event_id: eventId,
    });

    if (googleAdsEnabled()) {
      window.gtag?.("event", "conversion", {
        send_to: ids.googleLabel
          ? `${GOOGLE_ADS_ID()}/${ids.googleLabel}`
          : GOOGLE_ADS_ID(),
        value: payload.value,
        currency,
        transaction_id: eventId,
      });
    }

    void reportPixelFires(event, eventId, { meta: metaReady });
  };

  if (pixelsAllowed && pixelsEnabled()) {
    fireBrowser();
  } else {
    // Consent and runtime pixel ids can resolve in either order. Queue until
    // both are ready instead of logging a false "Pixel not loaded" failure.
    pendingBrowserFires.push(fireBrowser);
  }

  // Server-side CAPI fires immediately (deduped by event_id) so the conversion
  // is captured even if the visitor bounces before the geo check resolves.
  void sendServerEvent(event, { ...payload, eventId, currency });
}

/**
 * Tells our server which browser pixels actually fired, so the admin monitor
 * can chart browser coverage next to server-side deliveries.
 */
export function reportPixelFires(
  event: string,
  eventId: string,
  delivery?: { meta?: boolean; tiktok?: boolean; googleAds?: boolean },
) {
  const entries = [
    { channel: "meta", event, ok: delivery?.meta ?? (typeof window.fbq === "function" && metaEnabled()) },
    { channel: "tiktok", event, ok: delivery?.tiktok ?? (Boolean(window.ttq?.["track"]) && tiktokEnabled()) },
    { channel: "google_ads", event, ok: delivery?.googleAds ?? (typeof window.gtag === "function" && googleAdsEnabled()) },
  ].filter((entry) => entry.ok || entry.channel === "meta");

  const body = JSON.stringify({ event_id: eventId, entries });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/public/pixel-log", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch("/api/public/pixel-log", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/** Posts the same conversion to our server so it can reach Meta/TikTok CAPI. */
export function sendServerEvent(event: PixelEvent, payload: PixelPayload & { currency?: string }) {
  const body = JSON.stringify({
    event,
    event_id: payload.eventId,
    value: payload.value ?? null,
    currency: payload.currency ?? "USD",
    content_name: payload.contentName ?? null,
    email: payload.email ?? null,
    url: window.location.href,
    fbp: cookie("_fbp") ?? null,
    fbc: cookie("_fbc") ?? null,
    ttclid: new URLSearchParams(window.location.search).get("ttclid"),
    ttp: cookie("_ttp") ?? null,
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/public/capi", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch("/api/public/capi", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
