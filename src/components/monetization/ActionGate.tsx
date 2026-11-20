import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Crown, ScanLine } from "lucide-react";

import { useVip } from "@/lib/vip";
import { adVariant, claimImpression, partnerLink, shouldGate, track } from "@/lib/monetization";

const SLOT = "gate-interstitial";

/** Rewarded window length: long enough to earn a real ad view, short enough to keep completion high. */
const REWARD_SECONDS = 22;

type GateOptions = {
  openPartnerTab?: boolean;
  toolSlug?: string;
  /** Skip the session/frequency check — used where the smartlink must always fire (vault downloads). */
  force?: boolean;
  /** Override the rewarded countdown length in seconds. */
  seconds?: number;
};

type GateContextValue = {
  /** Resolves when the user may proceed (instantly for VIP). */
  runGated: (options?: GateOptions) => Promise<void>;
};

const GateContext = createContext<GateContextValue | null>(null);

export function ActionGateProvider({ children }: { children: ReactNode }) {
  const { isVip, openVipModal } = useVip();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [left, setLeft] = useState(REWARD_SECONDS);
  const total = useRef(REWARD_SECONDS);
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
    const span = total.current * 1000;
    const id = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.min(100, (elapsed / span) * 100);
      setProgress(pct);
      setLeft(Math.max(0, Math.ceil((span - elapsed) / 1000)));
      if (pct >= 100) {
        window.clearInterval(id);
        finish();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [open, finish]);

  const runGated = useCallback<GateContextValue["runGated"]>(
    ({ openPartnerTab = true, toolSlug, force = false, seconds = REWARD_SECONDS }: GateOptions = {}) => {
      if (isVip) return Promise.resolve();

      toolRef.current = toolSlug ?? null;
      // Session-based gating: the first export of a session stays friction-free
      // unless the caller forces the sponsor step (vault downloads always do).
      if (!force && (!shouldGate() || !claimImpression("gate"))) return Promise.resolve();

      const variant = adVariant();
      const partner = partnerLink(SLOT, toolSlug ?? null);
      clickId.current = partner.clickId;
      total.current = Math.max(5, seconds);

      track({
        event_type: "gate_shown",
        slot: SLOT,
        tool_slug: toolSlug ?? null,
        click_id: partner.clickId,
        format: variant,
      });
      track({
        event_type: "impression",
        slot: SLOT,
        tool_slug: toolSlug ?? null,
        click_id: partner.clickId,
      });

      // Smartlink opens alongside every gated download for free users; the
      // A/B arm is still recorded so RPM per variant stays comparable.
      if (openPartnerTab) {
        window.open(partner.url, "_blank", "noopener,noreferrer");
        track({
          event_type: "click",
          slot: SLOT,
          tool_slug: toolSlug ?? null,
          click_id: partner.clickId,
        });
      }

      setProgress(0);
      setLeft(total.current);
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
          aria-label="Sponsor step"
          className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm"
        >
          <div className="glass w-full max-w-sm rounded-2xl p-8 text-center">
            <div className="relative mx-auto grid size-20 place-items-center overflow-hidden rounded-xl border border-hairline bg-surface-2">
              <ScanLine className="size-8 text-primary" aria-hidden="true" />
              <span className="absolute inset-x-0 h-px animate-[bounce_1.4s_ease-in-out_infinite] bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
            </div>
            <h2 className="mt-6 font-display text-lg font-semibold">
              To continue — see ads for {left}s
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your file is being prepared in the sponsor tab. Keep this open — unlock happens
              automatically when the timer ends.
            </p>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-2xl tabular-nums text-foreground">
              00:{String(left).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={() => {
                track({ event_type: "click", slot: "gate_vip_skip", tool_slug: toolRef.current });
                finish();
                openVipModal();
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Crown className="size-4" aria-hidden="true" /> Skip all ads forever — go VIP
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
