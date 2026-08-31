import { useEffect, useState } from "react";
import { Bitcoin, Check, Crown, Loader2, Lock, ShieldCheck, Users, Zap } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { EmailCapture } from "@/components/monetization/EmailCapture";
import { ScarcityTimer } from "@/components/monetization/ScarcityTimer";
import { useVip } from "@/lib/vip";

import { track, visitorCountry } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";
import { useDirectCheckout } from "@/lib/use-direct-checkout";
import { preloadWhopCheckout } from "@/lib/whop-preload";
import { getSocialProof, type SocialProof } from "@/lib/social-proof.functions";
import { useVipPrices } from "@/lib/vip-pricing";

const REGION_NAME: Record<string, string> = {
  SA: "Saudi Arabia",
  AE: "the UAE",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
  OM: "Oman",
  US: "the US",
  GB: "the UK",
  BD: "Bangladesh",
  IN: "India",
  PK: "Pakistan",
};

/**
 * Always-visible entry offer on every result screen.
 *
 * The persuasion stack here is deliberate and each layer is honest:
 * ownership ("your report" — they already earned it), loss aversion (what
 * stays hidden), anchoring ($19 lifetime next to the $2.99 entry), real
 * social proof counted from live events, session-true scarcity, and risk
 * reversal right under the button where the hesitation actually happens.
 */
export function VipOfferCard({
  toolSlug,
  className = "",
}: {
  toolSlug: string;
  className?: string;
}) {
  const { isVip, openVipModal } = useVip();
  const { busy, error, go } = useDirectCheckout();
  const loadProof = useServerFn(getSocialProof);
  const [proof, setProof] = useState<SocialProof | null>(null);

  // One shared price source — the card, the modal and the checkout page all
  // read the same numbers, so the quoted price is the charged price.
  const { monthly, lifetime, lifetimeFull, offerActive } = useVipPrices();

  useEffect(() => {
    if (isVip) return;
    track({ event_type: "impression", slot: "vip_offer_card", tool_slug: toolSlug });
    trackFunnel("vip_gate_shown", toolSlug);
    // The buyer's next tap is checkout — warm it now so the page is instant.
    preloadWhopCheckout();
  }, [isVip, toolSlug]);

  useEffect(() => {
    if (isVip) return;
    let alive = true;
    void loadProof({ data: { country: visitorCountry() } })
      .then((data) => {
        if (alive) setProof(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isVip, loadProof]);

  if (isVip) return null;

  const region = proof?.country ? (REGION_NAME[proof.country] ?? null) : null;
  const localCount = proof?.reportsTodayLocal ?? 0;
  const globalCount = proof?.reportsToday ?? 0;
  const proofLine =
    region && localCount >= 20
      ? `${localCount.toLocaleString()} people in ${region} opened this report in the last 24 hours`
      : globalCount >= 50
        ? `${globalCount.toLocaleString()} reports opened in the last 24 hours`
        : null;

  return (
    <section
      className={`glass rounded-2xl border border-primary/25 p-5 sm:p-6 ${className}`}
      aria-labelledby="vip-offer-card-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label-mono text-primary">Your full profile is ready</span>
        <ScarcityTimer label="This price ends in" />
      </div>

      <h3 id="vip-offer-card-title" className="mt-1.5 font-display text-xl font-bold">
        You finished the hard part — don&apos;t leave the answer locked
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Your score is calculated. The part that explains{" "}
        <span className="text-foreground">why you answer the way you do</span> — the trait-by-trait
        breakdown, blind spots and how others read you — stays hidden until you unlock it.
      </p>

      {/* Anchor: the lifetime price is shown first so the entry price reads as
          a decision that's already been discounted for them. */}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="text-sm text-muted-foreground line-through">
          {lifetimeFull} lifetime
        </span>
        <span className="font-display text-3xl font-bold text-primary">{monthly}</span>
        <span className="text-sm text-muted-foreground">to open everything right now</span>
      </div>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {[
          "Full deep report, no blur",
          "No ads, no export gates",
          "HD PDF + share cards",
          "Every future tool included",
        ].map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {perk}
          </li>
        ))}
      </ul>

      <p className="mt-3 flex items-start gap-2 rounded-xl border border-hairline bg-surface-2/60 px-3 py-2 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
        Leave this page and the locked half closes with it — results aren&apos;t stored to your
        device, so you&apos;d have to sit the whole test again.
      </p>

      <div className="relative z-50 mt-5 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => void go("monthly")}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Zap className="size-4" aria-hidden="true" />
          )}
          Open my full report · {monthly}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void go("lifetime")}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
        >
          <Crown className="size-4" aria-hidden="true" /> Keep it forever · {lifetime}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-center text-xs text-destructive">
          {error} Tap the button to retry.
        </p>
      ) : null}

      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
        Apple Pay / Google Pay in one tap · no account needed · monthly plan renews until cancelled
      </p>

      {proofLine ? (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Users className="size-3.5 text-primary" aria-hidden="true" />
          {proofLine}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => openVipModal("monthly")}
          className="underline underline-offset-4 hover:text-foreground"
        >
          Compare plans or restore a purchase
        </button>
        <button
          type="button"
          onClick={() => {
            openVipModal("monthly");
            window.setTimeout(() => window.dispatchEvent(new Event("sov:vip-crypto")), 0);
          }}
          className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-foreground"
        >
          <Bitcoin className="size-3.5" aria-hidden="true" /> Pay with crypto (SOL / USDC)
        </button>
      </div>


      {/* Not ready to pay is the majority case — capturing the email here turns
          a one-shot paid visitor into someone we can bring back for free. */}
      <EmailCapture toolSlug={toolSlug} source="offer_card" className="mt-5" />
    </section>
  );
}
