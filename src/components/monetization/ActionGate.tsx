import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ScanLine } from "lucide-react";

import { useVip } from "@/lib/vip";
import { adVariant, claimImpression, partnerLink, shouldGate, track } from "@/lib/monetization";

const SLOT = "gate-interstitial";

type GateContextValue = {
  /** Resolves when the user may proceed (instantly for VIP). */
  runGated: (options?: { openPartnerTab?: boolean; toolSlug?: string }) => Promise<void>;
};

const GateContext = createContext<GateContextValue | null>(null);

export function ActionGateProvider({ children }: { children: ReactNode }) {
  const { isVip } = useVip();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const resolver = useRef<(() => void) | null>(null);
  const clickId = useRef<string | null>(null);
  const toolRef = useRef<string | null>(null);

  const finish = useCallback(() => {
    setOpen(false);
    setProgress(0);
    track({
      event_type: "gate_completed",
      slot: SLOT,
      tool_slug: toolRef.current,
      click_id: clickId.current,
    });
    resolver.current?.();
    resolver.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / 3000) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(id);
        finish();
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [open, finish]);

  const runGated = useCallback<GateContextValue["runGated"]>(
    ({ openPartnerTab = true, toolSlug } = {}) => {
      if (isVip) return Promise.resolve();

      toolRef.current = toolSlug ?? null;
      // Session-based gating: first export of a session is friction-free, and
      // the interstitial is frequency-capped so heavy users are not punished.
      if (!shouldGate() || !claimImpression("gate")) return Promise.resolve();

      const variant = adVariant();
      const partner = partnerLink(SLOT, toolSlug ?? null);
      clickId.current = partner.clickId;

      track({
        event_type: "gate_shown",
        slot: SLOT,
        tool_slug: toolSlug ?? null,
        click_id: partner.clickId,
      });
      track({
        event_type: "impression",
        slot: SLOT,
        tool_slug: toolSlug ?? null,
        click_id: partner.clickId,
      });

      // In the gate-heavy variant the partner smartlink opens alongside the
      // download; in the result-heavy variant the gate stays ad-light.
      if (openPartnerTab && variant === "gate_heavy") {
        window.open(partner.url, "_blank", "noopener,noreferrer");
        track({
          event_type: "click",
          slot: SLOT,
          tool_slug: toolSlug ?? null,
          click_id: partner.clickId,
        });
      }

      setProgress(0);
      setOpen(true);
      return new Promise<void>((resolve) => {
        resolver.current = resolve;
      });
    },
    [isVip],
  );

  const value = useMemo(() => ({ runGated }), [runGated]);

  return (
    <GateContext.Provider value={value}>
      {children}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preparing your file"
          className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm"
        >
          <div className="glass w-full max-w-sm rounded-2xl p-8 text-center">
            <div className="relative mx-auto grid size-20 place-items-center overflow-hidden rounded-xl border border-hairline bg-surface-2">
              <ScanLine className="size-8 text-primary" aria-hidden="true" />
              <span className="absolute inset-x-0 h-px animate-[bounce_1.4s_ease-in-out_infinite] bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
            </div>
            <h2 className="mt-6 font-display text-lg font-semibold">Preparing your file</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compiling assets — this takes about three seconds.
            </p>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              type="button"
              onClick={finish}
              className="mt-5 text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
            >
              Skip
            </button>
          </div>
        </div>
      ) : null}
    </GateContext.Provider>
  );
}

export function useActionGate() {
  const ctx = useContext(GateContext);
  if (!ctx) throw new Error("useActionGate must be used inside ActionGateProvider");
  return ctx.runGated;
}
