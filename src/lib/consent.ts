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
