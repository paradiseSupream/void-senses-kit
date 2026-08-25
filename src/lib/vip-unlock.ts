/**
 * Return-from-checkout unlock + local persistence — server verified.
 *
 * Nothing in the URL or in localStorage grants access on its own. After
 * checkout we carry our own order id (`?vip_order=` / `?matrix_order=`) and ask
 * the server to confirm it was actually paid (the Whop webhook is the only
 * writer of that state). Local flags exist purely as a cache and are revalidated
 * against the server on every load, so a spoofed `?vip_success=true` or an
 * edited localStorage value unlocks nothing.
 */

import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { useVip } from "@/lib/vip";
import { verifyEntitlement } from "@/lib/vip.functions";

export const VIP_FLAG = "senses_vip_unlocked";
export const MATRIX_FLAG = "senses_matrix_unlocked";
/** Proofs kept so a real buyer can be revalidated on the next visit. */
export const ORDER_KEY = "sov.vip.order";
export const MATRIX_ORDER_KEY = "sov.matrix.order";
export const EMAIL_KEY = "sov.vip.email";
/** Server-issued license key — the only cross-device proof of purchase. */
export const LICENSE_KEY = "sov.vip.license";
const MATRIX_EVENT = "sov:matrix";

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

/** Remembers the proof for an order the visitor just started paying for. */
export function rememberOrder(orderId: string, email?: string | null) {
  if (!orderId) return;
  writeLocal(orderId.startsWith("sovm_") ? MATRIX_ORDER_KEY : ORDER_KEY, orderId);
  if (email) writeLocal(EMAIL_KEY, email.trim().toLowerCase());
}

/** Stores the license key issued by the server after a verified payment. */
export function rememberLicense(licenseKey: string | null) {
  writeLocal(LICENSE_KEY, licenseKey ? licenseKey.trim().toLowerCase() : null);
}

export function hasMatrix(): boolean {
  return readLocal(MATRIX_FLAG) === "true";
}

/** Cache-only writer: never called without a server-confirmed payment. */
export function grantMatrix() {
  writeLocal(MATRIX_FLAG, "true");
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MATRIX_EVENT));
}

function revokeMatrix() {
  writeLocal(MATRIX_FLAG, null);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(MATRIX_EVENT));
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
 * Verifies the return-from-checkout order (or a stored proof) with the server,
 * then persists the unlock. Reports whether the post-purchase upsell should show.
 */
export function useVipSuccessUnlock(): { showUpsell: boolean; dismissUpsell: () => void } {
  const { setVip } = useVip();
  const verify = useServerFn(verifyEntitlement);
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const returnedVipOrder = params.get("vip_order");
      const returnedMatrixOrder = params.get("matrix_order");
      if (returnedVipOrder) rememberOrder(returnedVipOrder);
      if (returnedMatrixOrder) rememberOrder(returnedMatrixOrder);
      // Legacy/spoofable params are dropped without ever granting anything.
      stripParams(["vip_success", "matrix_success", "plan", "vip_order", "matrix_order"]);

      const orderId = returnedVipOrder ?? readLocal(ORDER_KEY);
      const matrixOrder = returnedMatrixOrder ?? readLocal(MATRIX_ORDER_KEY);
      const licenseKey = readLocal(LICENSE_KEY);
      const hadCachedVip = readLocal(VIP_FLAG) === "true";
      const hadCachedMatrix = hasMatrix();

      if (!orderId && !matrixOrder && !licenseKey) {
        // No proof at all — clear any hand-edited cache flags.
        if (hadCachedVip) writeLocal(VIP_FLAG, null);
        if (hadCachedMatrix) revokeMatrix();
        if (hadCachedVip) setVip(false);
        return;
      }

      let result: Awaited<ReturnType<typeof verify>> | null = null;
      try {
        result = await verify({ data: { orderId: orderId ?? matrixOrder, licenseKey } });
        if (matrixOrder && orderId && !result.matrix) {
          const second = await verify({ data: { orderId: matrixOrder, licenseKey } });
          result = { ...result, matrix: second.matrix, vip: result.vip || second.vip };
        }
      } catch {
        return; // Offline / transient: keep the cached state, never escalate it.
      }
      if (cancelled || !result) return;

      if (result.vip) {
        writeLocal(VIP_FLAG, "true");
        if (result.email) writeLocal(EMAIL_KEY, result.email);
        if (result.licenseKey) writeLocal(LICENSE_KEY, result.licenseKey);
        setVip(true, result.plan ?? "lifetime");
      } else {
        writeLocal(VIP_FLAG, null);
        writeLocal(LICENSE_KEY, null);
        setVip(false);
      }

      if (result.matrix) grantMatrix();
      else if (hadCachedMatrix) revokeMatrix();

      const justUnlocked = Boolean(returnedVipOrder) && result.vip;
      if (justUnlocked && !result.matrix) setShowUpsell(true);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [setVip, verify]);

  const dismissUpsell = useCallback(() => setShowUpsell(false), []);
  return { showUpsell, dismissUpsell };
}
