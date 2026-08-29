/**
 * Cookie / privacy consent state. Advertising scripts are only injected when
 * the visitor has accepted advertising cookies (or when consent is not
 * required by the admin settings).
 */
import { useEffect, useState } from "react";

export type ConsentValue = "all" | "essential";

export const CONSENT_KEY = "sov.cookies";
export const CONSENT_EVENT = "sov:consent";

export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw === "all" || raw === "essential" ? raw : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

export function clearConsent() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
  window.dispatchEvent(new Event("sov:cookies-reset"));
}

/** Reactive consent value; `undefined` until hydrated. */
export function useConsent(): ConsentValue | null | undefined {
  const [value, setValue] = useState<ConsentValue | null | undefined>(undefined);

  useEffect(() => {
    const sync = () => setValue(readConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("sov:cookies-reset", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("sov:cookies-reset", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return value;
}

/** Whether advertising scripts may run right now. */
export function adsAllowed(consent: ConsentValue | null | undefined, required: boolean): boolean {
  if (!required) return consent !== "essential";
  return consent === "all";
}

/**
 * Regions where an opt-in consent banner is required before advertising
 * cookies may load (EEA + UK + Switzerland + Brazil).
 */
export const CONSENT_REGIONS = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO",
  "GB","CH","BR",
]);

/**
 * Region gate for the consent banner: visitors outside the regulated regions
 * are tracked without a banner, everyone inside sees it. Fails open (banner
 * shown) whenever the country cannot be resolved.
 */
export function useConsentRequired(adminRequires: boolean): boolean {
  const [required, setRequired] = useState(true);

  useEffect(() => {
    if (!adminRequires) {
      setRequired(false);
      return;
    }
    let alive = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2000);
    fetch("/cdn-cgi/trace", { signal: controller.signal })
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error("bad status"))))
      .then((text) => {
        const loc = /(?:^|\n)loc=([A-Z]{2})/.exec(text)?.[1];
        if (!alive) return;
        if (!loc || loc === "XX" || loc === "T1") setRequired(true);
        else setRequired(CONSENT_REGIONS.has(loc));
      })
      .catch(() => alive && setRequired(true))
      .finally(() => window.clearTimeout(timer));
    return () => {
      alive = false;
      controller.abort();
    };
  }, [adminRequires]);

  return required;
}
