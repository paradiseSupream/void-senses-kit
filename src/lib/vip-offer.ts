/**
 * One-time exit-intent discount on VIP.
 *
 * The offer is granted when the visitor is about to leave and is remembered
 * *persistently*: it may be shown once per visitor, and the moment it is used
 * (a checkout session is created on the discounted price) it is burned for
 * good. Previously the flag lived in sessionStorage, so a new session revived
 * the "one-time" price — which made the discount look fake and trained buyers
 * to wait for it.
 */

import { useEffect, useState } from "react";

const KEY = "sov.vipOffer";
const USED_KEY = "sov.vipOffer.used";
const EVENT = "sov:vip-offer";

/** Discounted lifetime price while the exit offer is active. */
export const OFFER_CENTS = 900;

/** Discounted monthly pass price while the exit offer is active. */
export const MONTHLY_OFFER_CENTS = 199;

function read(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function write(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* storage unavailable */
  }
}

/** True only while the one-time offer is granted and not yet consumed. */
export function hasVipOffer(): boolean {
  return read(KEY) && !read(USED_KEY);
}

/** True when this visitor has already been given (or spent) the offer. */
export function vipOfferSpent(): boolean {
  return read(USED_KEY);
}

export function grantVipOffer() {
  if (typeof window === "undefined") return;
  if (read(USED_KEY)) return; // never a second time
  write(KEY);
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Burns the offer. Called once a discounted checkout session exists, so the
 * visitor permanently returns to the regular price afterwards.
 */
export function markVipOfferUsed() {
  if (typeof window === "undefined") return;
  write(USED_KEY);
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Reactive read of the offer flag. */
export function useVipOffer(): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const sync = () => setActive(hasVipOffer());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return active;
}
