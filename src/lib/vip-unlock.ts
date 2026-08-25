/**
 * Return-from-checkout unlock + local persistence.
 *
 * Whop sends the buyer back to the app with `?vip_success=true` (or
 * `?matrix_success=true` for the $9 Shadow Matrix add-on). We flip the local
 * flags, clean the URL without a reload, and keep the unlock across sessions.
 * The server webhook remains the source of truth for cross-device restore.
 */

import { useCallback, useEffect, useState } from "react";

import { useVip } from "@/lib/vip";

export const VIP_FLAG = "senses_vip_unlocked";
export const MATRIX_FLAG = "senses_matrix_unlocked";
const MATRIX_EVENT = "sov:matrix";

export function hasMatrix(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MATRIX_FLAG) === "true";
  } catch {
    return false;
  }
}

export function grantMatrix() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MATRIX_FLAG, "true");
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(MATRIX_EVENT));
}

export function useMatrix(): boolean {
  const [owned, setOwned] = useState(false);
  useEffect(() => {
    const sync = () => setOwned(hasMatrix());
    sync();
    window.addEventListener(MATRIX_EVENT, sync);
    return () => window.removeEventListener(MATRIX_EVENT, sync);
  }, []);
  return owned;
}

function stripParams(keys: string[]) {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of keys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  } catch {
    /* history unavailable */
  }
}

/**
 * Reads `?vip_success=true` / `?matrix_success=true`, persists the unlock and
 * reports whether the post-purchase upsell should be shown.
 */
export function useVipSuccessUnlock(): { showUpsell: boolean; dismissUpsell: () => void } {
  const { setVip, isVip } = useVip();
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    let vipJustUnlocked = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const vipSuccess = params.get("vip_success") === "true";
      const matrixSuccess = params.get("matrix_success") === "true";
      const plan = params.get("plan") === "monthly" ? "monthly" : "lifetime";

      if (vipSuccess) {
        window.localStorage.setItem(VIP_FLAG, "true");
        setVip(true, plan);
        vipJustUnlocked = true;
      }
      if (matrixSuccess) {
        window.localStorage.setItem(VIP_FLAG, "true");
        setVip(true, "lifetime");
        grantMatrix();
      }
      if (vipSuccess || matrixSuccess) stripParams(["vip_success", "matrix_success", "plan"]);

      // Legacy / cross-tab flag: an earlier purchase on this device.
      if (!vipSuccess && !matrixSuccess && window.localStorage.getItem(VIP_FLAG) === "true") {
        setVip(true, "lifetime");
      }
    } catch {
      /* storage unavailable */
    }
    if (vipJustUnlocked && !hasMatrix()) setShowUpsell(true);
  }, [setVip]);

  // Keep the mirrored flag truthful for VIPs restored through email.
  useEffect(() => {
    if (!isVip) return;
    try {
      window.localStorage.setItem(VIP_FLAG, "true");
    } catch {
      /* storage unavailable */
    }
  }, [isVip]);

  const dismissUpsell = useCallback(() => setShowUpsell(false), []);
  return { showUpsell, dismissUpsell };
}
