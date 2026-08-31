import { useEffect, useState } from "react";
import { Crown, Loader2, Lock, Sparkles, Swords } from "lucide-react";
import { toast } from "sonner";

import { useVip } from "@/lib/vip";
import { useActionGate } from "@/components/monetization/ActionGate";
import { AdSlot } from "@/components/monetization/AdSlot";
import { EmailCapture } from "@/components/monetization/EmailCapture";
import { ScarcityTimer } from "@/components/monetization/ScarcityTimer";
import { isUnlocked, onUnlock, unlockReport } from "@/lib/unlock";
import { partnerLink, track } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";
import { compareUrl, type ComparePayload } from "@/lib/compare-link";
import { useVipPrices } from "@/lib/vip-pricing";
import { useDirectCheckout } from "@/lib/use-direct-checkout";


/**
 * Paywall-lite for the deep half of a result.
 *
 * Free visitors see a blurred preview with two ways forward: go VIP (revenue),
 * or pass one sponsor step (rewarded unlock — an extra ad impression without
 * costing a bounce). VIPs and already-unlocked sessions see the content plain.
 */
export function LockedReport({
  toolSlug,
  title = "Full report",
  blurb = "Trait-by-trait breakdown, what it means and how it usually plays out.",
  share,
  children,
}: {
  toolSlug: string;
  title?: string;
  blurb?: string;
  /** Enables the free "share to unlock" path — the K-factor engine. */
  share?: ComparePayload;
  children: React.ReactNode;
}) {
  const { isVip } = useVip();
  const runGated = useActionGate();
  const { busy: checkoutBusy, error: checkoutError, go } = useDirectCheckout();
  const { monthly: price } = useVipPrices();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOpen(isUnlocked(toolSlug));
    return onUnlock(() => setOpen(isUnlocked(toolSlug)));
  }, [toolSlug]);

  useEffect(() => {
    if (isVip || open) return;
    track({ event_type: "impression", slot: "result_lock", tool_slug: toolSlug });
    trackFunnel("vip_gate_shown", toolSlug);
  }, [isVip, open, toolSlug]);

  if (isVip || open) {
    return (
      <div>
        {children}
        {!isVip ? <AdSlot id="result-deep" toolSlug={toolSlug} className="mt-6" /> : null}
        {!isVip ? <EmailCapture toolSlug={toolSlug} className="mt-6" /> : null}
      </div>
    );
  }



  const rewardedUnlock = async () => {
    if (busy) return;
    setBusy(true);
    const partner = partnerLink("result_lock", toolSlug);
    track({
      event_type: "click",
      slot: "result_lock",
      tool_slug: toolSlug,
      click_id: partner.clickId,
    });
    try {
      window.open(partner.url, "_blank", "noopener,noreferrer");
    } catch {
      /* popup blocked — the gate below still unlocks */
    }
    await runGated({ openPartnerTab: false, toolSlug });
    unlockReport(toolSlug);
    setBusy(false);
  };

  /** Free, zero-cost unlock: the visitor pays with a share instead of a click. */
  const shareUnlock = async () => {
    if (!share || busy) return;
    setBusy(true);
    const url = compareUrl(share);
    const text = `I got ${share.h} on ${share.n}. Think you can beat me?`;
    let shared = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: share.n, text, url });
        shared = true;
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        shared = true;
        toast.success("Challenge link copied — send it to a friend.");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        shared = true;
        toast.success("Challenge link copied — send it to a friend.");
      } catch {
        toast.error("Sharing blocked by your browser — try the free unlock instead.");
      }
    }
    if (shared) {
      track({ event_type: "conversion", slot: "result_lock_share", tool_slug: toolSlug });
      unlockReport(toolSlug);
    }
    setBusy(false);
  };


  return (
    <div className="relative overflow-hidden rounded-2xl border border-hairline">
      <div aria-hidden="true" className="pointer-events-none max-h-64 overflow-hidden blur-[6px] select-none">
        {children}
      </div>
      <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-b from-transparent to-background" />
      <div className="relative -mt-24 px-4 pb-5 text-center sm:px-6">
        <span className="mx-auto grid size-11 place-items-center rounded-xl border border-hairline bg-surface-2">
          <Lock className="size-5 text-primary" aria-hidden="true" />
        </span>
        <h3 className="mt-3 font-display text-lg font-semibold">
          You&apos;ve earned this {title.toLowerCase()} — it&apos;s still locked
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{blurb}</p>
        <ScarcityTimer className="mt-3" label="This price ends in" />
        <div className="relative z-50 mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => void go("monthly")}
            disabled={checkoutBusy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {checkoutBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Crown className="size-4" aria-hidden="true" />
            )}
            Unlock now · {price}
          </button>
          {share ? (
            <button
              type="button"
              onClick={shareUnlock}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
            >
              <Swords className="size-4" aria-hidden="true" /> Share to unlock free
            </button>
          ) : null}
          <button
            type="button"
            onClick={rewardedUnlock}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-hairline px-5 text-sm font-medium transition-colors hover:bg-surface-2 disabled:opacity-60"
          >
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            {busy ? "Unlocking…" : "Continue free"}
          </button>
        </div>
        {checkoutError ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {checkoutError} Tap Unlock to retry.
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          {share
            ? "Share with one friend to unlock instantly, or open one sponsor page — VIP skips both, forever."
            : "Free unlock opens one sponsor page — VIP skips it everywhere, forever."}
        </p>

      </div>
    </div>
  );
}
