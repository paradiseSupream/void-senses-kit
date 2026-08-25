/**
 * Fetches the premium dossier from the server for a verified buyer.
 *
 * The client never holds the premium text until the server hands it over, and
 * the accompanying PDF token expires in minutes — so a locked visitor cannot
 * read, cache or reassemble the paid report from the bundle.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { getPremiumDossier } from "@/lib/dossier.functions";
import type { AxisScore, Dossier } from "@/lib/archetype-core";
import { LICENSE_KEY, ORDER_KEY } from "@/lib/vip-unlock";

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export type PremiumState = {
  dossier: Dossier | null;
  pdfToken: string | null;
  loading: boolean;
  locked: boolean;
  /** Re-mints an expired PDF token / refreshes the report. */
  refresh: () => void;
};

export function usePremiumDossier(axes: AxisScore[], enabled: boolean): PremiumState {
  const fetchDossier = useServerFn(getPremiumDossier);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [pdfToken, setPdfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(true);
  const [nonce, setNonce] = useState(0);

  const signature = axes.map((a) => `${a.dim}:${a.value}`).join("|");
  const inflight = useRef("");

  useEffect(() => {
    if (!enabled || axes.length === 0) return;
    const orderId = readLocal(ORDER_KEY);
    const licenseKey = readLocal(LICENSE_KEY);
    if (!orderId && !licenseKey) {
      setLocked(true);
      return;
    }
    const key = `${signature}#${nonce}`;
    if (inflight.current === key) return;
    inflight.current = key;

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const result = await fetchDossier({
          data: { axes: axes.map((a) => ({ dim: a.dim, value: a.value })), orderId, licenseKey },
        });
        if (cancelled) return;
        if (result.ok) {
          setDossier(result.dossier);
          setPdfToken(result.pdfToken);
          setLocked(false);
        } else {
          setDossier(null);
          setPdfToken(null);
          setLocked(true);
        }
      } catch {
        if (!cancelled) inflight.current = "";
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, signature, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { dossier, pdfToken, loading, locked, refresh };
}
