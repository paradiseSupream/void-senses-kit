import { useEffect, useState } from "react";
import { Crown, PlayCircle, X } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";
import { useActionGate } from "@/components/monetization/ActionGate";
import { ScarcityTimer } from "@/components/monetization/ScarcityTimer";
import { grantVipOffer } from "@/lib/vip-offer";
import { useVipPrices } from "@/lib/vip-pricing";
import { track } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";

const SEEN_KEY = "sov.midQuizOfferSeen";

/**
 * One-time mid-test downsell. Fires once per session while the visitor is
 * already invested (past the halfway point), offering the discounted lifetime /
 * monthly pass with a live countdown — or a rewarded "see ads to continue"
 * step for people who want to stay free.
 */
export function MidQuizOffer({
  step,
  total,
  toolSlug,
  // Interrupting at the halfway mark cost completions — the offer now waits
  // until the visitor is nearly finished, where abandoning costs them more
  // than closing the dialog.
  showFrom = 0.85,
}: {
  step: number;
  total: number;
  toolSlug?: string;
  showFrom?: number;
}) {
  const { isVip, openVipModal } = useVip();
  const { site } = useSiteConfig();
  const runGated = useActionGate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const due = !isVip && total >= 3 && (step + 1) / total >= showFrom;

  useEffect(() => {
    if (!due) return;
    try {
      if (window.sessionStorage.getItem(SEEN_KEY) === "1") return;
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    setOpen(true);
    track({ event_type: "impression", slot: "midquiz_offer", tool_slug: toolSlug ?? null });
    trackFunnel("vip_gate_shown", toolSlug);
  }, [due, toolSlug]);

  if (!open || isVip) return null;


  const continueFree = async () => {
    if (busy) return;
    setBusy(true);
    track({ event_type: "click", slot: "midquiz_offer_ads", tool_slug: toolSlug ?? null });
    await runGated({ toolSlug: toolSlug ?? "quiz", force: true });
    setBusy(false);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="midquiz-offer-title"
      className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div className="glass relative w-full max-w-sm rounded-2xl p-7 text-center">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <span className="mx-auto grid size-12 place-items-center rounded-xl border border-hairline bg-surface-2">
          <Crown className="size-5 text-primary" aria-hidden="true" />
        </span>
        <h2 id="midquiz-offer-title" className="mt-4 font-display text-xl font-bold">
          Almost done — unlock the full report for {monthly}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Finish ad-free and your complete breakdown opens the moment you submit. The
          lifetime pass is <span className="line-through">{full}</span> — this entry price
          is {monthly}.
        </p>
        <ScarcityTimer className="mt-3" label="This price ends in" />
        <button
          type="button"
          onClick={() => {
            grantVipOffer();
            track({ event_type: "click", slot: "midquiz_offer_monthly", tool_slug: toolSlug ?? null });
            setOpen(false);
            openVipModal("monthly");
          }}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Unlock now · {monthly}
        </button>
        <button
          type="button"
          onClick={() => {
            grantVipOffer();
            track({ event_type: "click", slot: "midquiz_offer", tool_slug: toolSlug ?? null });
            setOpen(false);
            openVipModal("lifetime");
          }}
          className="mt-2.5 w-full rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Or keep it forever — {offer} lifetime
        </button>

        <button
          type="button"
          onClick={continueFree}
          disabled={busy}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-hairline px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-2 disabled:opacity-60"
        >
          <PlayCircle className="size-4 text-primary" aria-hidden="true" />
          {busy ? "Loading sponsor…" : "To continue free — see ads"}
        </button>
      </div>
    </div>
  );
}
