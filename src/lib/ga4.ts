/**
 * Google Analytics 4 (gtag.js) loader + custom event helpers.
 *
 * Loads only after the visitor accepts analytics cookies, and never for
 * bots/SSR. Custom events mirror the in-app funnel so SEO traffic can be
 * measured end-to-end (landing -> tool start -> result -> VIP).
 */

const MEASUREMENT_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as
  | string
  | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let loaded = false;

export function ga4Enabled(): boolean {
  return typeof window !== "undefined" && Boolean(MEASUREMENT_ID);
}

export function loadGa4(): void {
  if (loaded || !ga4Enabled()) return;
  loaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, { send_page_view: true });
}

export function gaEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export function gaPageView(path: string, title?: string): void {
  gaEvent("page_view", { page_path: path, page_title: title ?? document.title });
}
