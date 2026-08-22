/**
 * One-time exit-intent discount on lifetime VIP.
 *
 * The offer is granted client-side when the visitor is about to leave and is
 * remembered for the session, so the VIP modal can show the reduced price.
 */

import { useEffect, useState } from "react";

const KEY = "sov.vipOffer";
const EVENT = "sov:vip-offer";

/** Discounted lifetime price while the exit offer is active. */
export const OFFER_CENTS = 900;

export function hasVipOffer(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function grantVipOffer() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, "1");
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
