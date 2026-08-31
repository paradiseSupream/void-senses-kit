import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Heart, Loader2, ShieldHalf, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { startMatrixCheckout } from "@/lib/vip.functions";
import { rememberOrder } from "@/lib/vip-unlock";
import { attribution, sessionId } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";
import { cookie } from "@/lib/pixels";
import { grantMatrix, useMatrix } from "@/lib/vip-unlock";
import { useVip } from "@/lib/vip";
import type { Dossier } from "@/lib/archetype-core";

/** Shared checkout kick-off for the $9 Shadow Matrix add-on. */
function useMatrixCheckout() {
  const begin = useServerFn(startMatrixCheckout);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const attr = attribution();
      const result = await begin({
        data: {
          sessionId: sessionId(),
          toolSlug: "dark-personality",
          utmSource: attr.utm_source ?? null,
          fbp: cookie("_fbp") ?? null,
          fbc: cookie("_fbc") ?? null,
        },
      });
      if (!result.ok || !result.checkoutId || !result.planId) {
        toast.error(result.reason ?? "Could not open checkout — please try again.");
        return;
      }
      if (result.orderId) rememberOrder(result.orderId);
      trackFunnel("vip_gate_shown", "dark-personality");
      await navigate({
        to: "/vip/checkout",
        search: {
          s: result.checkoutId,
          p: result.planId,
          order: result.orderId ?? "",
          amount: String(result.amountCents ?? 900),
          m: "1",
        },
      });
    } catch {
      toast.error("Could not open checkout — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return { start, busy };
}

/**
 * One-click post-purchase upsell, shown once immediately after VIP unlocks and
 * before the dossier renders.
 */
export function MatrixUpsellModal({ onDismiss }: { onDismiss: () => void }) {
  const { start, busy } = useMatrixCheckout();
  const [mounted, setMounted] = useState(false);

  // Portal to <body>: the dossier card is a transformed/blurred ancestor, which
  // would otherwise become the containing block for `fixed` and push the modal
  // out of the viewport.
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="matrix-title"
    >
      <div className="glass relative w-full max-w-md rounded-2xl p-7">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <span className="label-mono flex items-center gap-2">
          <Zap className="size-3.5 text-secondary" aria-hidden="true" /> one-time offer
        </span>
        <h2 id="matrix-title" className="mt-2 font-display text-2xl leading-tight font-bold">
          Wait! Complete your dark archetype analysis
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Unlock your <strong className="text-foreground">Shadow Trigger &amp; Compatibility
          Matrix</strong> — how your archetype manipulates, attracts, or destroys relationships.
        </p>

        <ul className="mt-4 space-y-2 text-sm">
          {[
            "Who you magnetise — and why they stay too long",
            "The exact triggers that make you escalate or vanish",
            "Trigger-defence protocol for your archetype",
            "Compatible and volatile archetype pairings",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Heart className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>

        <p className="mt-5 font-display text-3xl font-bold text-primary">
          $9.00 <span className="text-sm font-medium text-muted-foreground">one-time access</span>
        </p>

        <button
          type="button"
          onClick={() => void start()}
          disabled={busy}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Add Shadow Matrix for $9
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 min-h-11 w-full rounded-xl border border-hairline text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          No thanks, proceed to my VIP Dossier
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Relationship Compatibility & Trigger Defense module — injected into the VIP
 * dossier once the add-on is owned, teased with a buy button when it is not.
 */
export function MatrixModule({ dossier }: { dossier: Dossier }) {
  // VIP members already paid for the full dossier — the add-on is included for
  // them, so the $9 tease must never appear after a VIP purchase.
  const { isVip } = useVip();
  const owned = useMatrix() || isVip;
  const { start, busy } = useMatrixCheckout();
  const matrix = dossier.archetype.matrix;

  if (!owned) {
    return (
      <section className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-5">
        <span className="label-mono flex items-center gap-2">
          <Flame className="size-3.5 text-secondary" aria-hidden="true" /> add-on
        </span>
        <h3 className="mt-2 font-display text-lg font-semibold">
          Shadow Trigger &amp; Compatibility Matrix
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          How {dossier.archetype.name} attracts, triggers and destroys relationships — plus the
          defence protocol and archetype pairings. $9 one-time.
        </p>
        <button
          type="button"
          onClick={() => void start()}
          disabled={busy}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Add Shadow Matrix for $9
        </button>
        {import.meta.env.DEV ? (
          <button
            type="button"
            onClick={grantMatrix}
            className="mt-2 block text-xs text-muted-foreground underline"
          >
            dev: unlock locally
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-hairline bg-surface-2/30 p-5">
      <span className="label-mono flex items-center gap-2">
        <ShieldHalf className="size-3.5 text-secondary" aria-hidden="true" /> relationship
        compatibility &amp; trigger defence
      </span>
      <p className="mt-3 text-sm leading-relaxed">
        <strong className="font-semibold">Who you attract:</strong> {matrix.attracts}
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        <strong className="font-semibold">How you destroy it:</strong> {matrix.destroys}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="label-mono">Trigger map</span>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
            {matrix.triggers.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="label-mono">Defence protocol</span>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
            {matrix.defense.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-background/40 p-3.5">
          <span className="label-mono">Compatible</span>
          <p className="mt-1.5 text-sm">{matrix.compatible.join(" · ")}</p>
        </div>
        <div className="rounded-xl border border-hairline bg-background/40 p-3.5">
          <span className="label-mono">Volatile</span>
          <p className="mt-1.5 text-sm">{matrix.volatile.join(" · ")}</p>
        </div>
      </div>
    </section>
  );
}
