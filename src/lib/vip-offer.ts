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
export const OFFER_CENTS = 999;

/** Discounted monthly pass price while the exit offer is active. */
export const MONTHLY_OFFER_CENTS = 249;

/** The leaving offer is only live for this long after it was shown. */
const OFFER_TTL_MS = 30 * 60 * 1000;

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

/** Timestamp the offer was granted, or 0. */
function grantedAt(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.localStorage.getItem(KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

/**
 * True only while the one-time offer is granted, unspent and still inside its
 * short window. Outside that window every surface (VIP tab included) shows the
 * regular prices again — the discount is a leaving offer, not the default.
 */
export function hasVipOffer(): boolean {
  if (read(USED_KEY)) return false;
  const at = grantedAt();
  return at > 0 && Date.now() - at < OFFER_TTL_MS;
}

/** True when this visitor has already been given (or spent) the offer. */
export function vipOfferSpent(): boolean {
  return read(USED_KEY);
}

export function grantVipOffer() {
  if (typeof window === "undefined") return;
  if (read(USED_KEY)) return; // never a second time
  try {
    // Refresh the window only when there is no live grant already.
    if (!hasVipOffer()) window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
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
