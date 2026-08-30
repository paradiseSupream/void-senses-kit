import { useEffect, useState } from "react";
import { Bitcoin, Check, CreditCard, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { subscribeLead } from "@/lib/leads.functions";
import { restoreVipAccess, startVipCheckout } from "@/lib/vip.functions";
import { rememberLicense, rememberOrder } from "@/lib/vip-unlock";
import { attribution, sessionId, trackExperiment } from "@/lib/monetization";
import {
  VIP_CHECKOUT_SLOT,
  VIP_GATE_VIEW_SLOT,
  vipGateArm,
  vipGateCopy,
  type VipGateArm,
} from "@/lib/vip-ab";
import { useVip, type VipPlan } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";
import { trackFunnel } from "@/lib/funnel";
import { cookie } from "@/lib/pixels";
import { MONTHLY_OFFER_CENTS, OFFER_CENTS, useVipOffer } from "@/lib/vip-offer";

/** Monthly no-ads pass — a low-friction entry point next to lifetime VIP. */
export const VIP_MONTHLY_CENTS = 499;

const PERKS = [
  "No interstitial gate on any export",
  "Ad-free tools, vault and share cards",
  "High-resolution PDF and PNG exports",
  "Priority AI roast queue",
  "All future tools included, forever",
];

export function VipModal() {
  const { vipModalOpen, closeVipModal, setVip, isVip, preferredPlan } = useVip();
  const saveLead = useServerFn(subscribeLead);
  const beginCheckout = useServerFn(startVipCheckout);
  const restoreVip = useServerFn(restoreVipAccess);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"card" | "crypto">("card");
  const [plan, setPlan] = useState<VipPlan>(preferredPlan);
  const { site } = useSiteConfig();
  const offerActive = useVipOffer();

  const lifetimeCents = offerActive ? OFFER_CENTS : site.vip_price_cents;
  const monthlyCents = offerActive ? MONTHLY_OFFER_CENTS : VIP_MONTHLY_CENTS;
  const lifetimePrice = `$${(lifetimeCents / 100).toFixed(0)}`;
  const monthlyPrice = `$${(monthlyCents / 100).toFixed(2)}`;
  const price = plan === "lifetime" ? lifetimePrice : monthlyPrice;

  useEffect(() => {
    if (vipModalOpen) {
      setPlan(preferredPlan);
      trackFunnel("vip_gate_shown");
    }
  }, [vipModalOpen, preferredPlan]);

  const persistEmail = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email address.");
      return false;
    }
    try {
      await saveLead({
        data: {
          email,
          source: "vip",
          toolSlug: plan,
          sessionId: sessionId(),
          utmSource: attribution().utm_source ?? null,
        },
      });
      setEmailSaved(true);
      toast.success("Email saved — your VIP access is tied to it.");
      return true;
    } catch {
      toast.error("Could not save your email — try again.");
      return false;
    }
  };

  /**
   * Opens the Whop card checkout for the selected plan.
   *
   * The email is optional on purpose: asking for it before payment was the
   * single biggest drop-off point. Whop collects the buyer email during
   * checkout and the webhook grants VIP on that address, so nothing is lost.
   */
  const startCheckout = async () => {
    if (busy) return;
    const hasEmail = email.includes("@");
    setBusy(true);
    try {
      if (hasEmail) await persistEmail();
      trackFunnel("checkout_start");
      const result = await beginCheckout({
        data: {
          plan,
          offer: offerActive,
          email: hasEmail ? email : null,
          sessionId: sessionId(),
          utmSource: attribution().utm_source ?? null,
          fbp: cookie("_fbp") ?? null,
          fbc: cookie("_fbc") ?? null,
        },
      });
      if (!result.ok || !result.checkoutId || !result.planId) {
        toast.error(result.reason ?? "Checkout is unavailable right now.");
        return;
      }
      if (result.orderId) rememberOrder(result.orderId, email || null);
      closeVipModal();
      const search = {
        s: result.checkoutId,
        p: result.planId,
        ...(result.orderId ? { order: result.orderId } : {}),
        ...(typeof result.amountCents === "number" ? { amount: String(result.amountCents) } : {}),
      };
      await navigate({
        to: "/vip/checkout",
        search,
      });
    } catch {
      toast.error("Could not open checkout — please try again.");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Restores an existing purchase on this device using just the purchase email.
   * `vip_members` is only written by the verified payment webhook or an admin,
   * so no code needs to be kept by the buyer.
   */
  const restore = async () => {
    if (!email.includes("@")) {
      toast.error("Enter the email you paid with.");
      return;
    }
    setBusy(true);
    try {
      const access = await restoreVip({ data: { email } });
      if (access.active) {
        rememberLicense(access.licenseKey ?? null);
        setVip(true, access.plan ?? "lifetime");
        toast.success("VIP restored on this device.");
        closeVipModal();
      } else {
        toast.error("No active VIP found for that email — check the address you paid with.");
      }
    } catch {
      toast.error("Could not check that email — try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!vipModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-title"
    >
      <div className="glass relative w-full max-w-md rounded-2xl p-7">
        <button
          type="button"
          onClick={() => {
            trackFunnel("vip_downgrade");
            closeVipModal();
          }}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <span className="label-mono">Ad-free access</span>
        <h2 id="vip-title" className="mt-2 font-display text-2xl font-bold">
          Senses of Void VIP
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a month to try it, or pay once and keep it forever.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            Launch offer
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg text-muted-foreground line-through decoration-muted-foreground/60">
              $49
            </span>
            <span className="font-display text-3xl font-bold text-primary">$19</span>
            <span className="text-xs font-semibold text-emerald-400">Save 61%</span>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {[
            {
              key: "monthly" as const,
              label: "1 month, no ads",
              amount: monthlyPrice,
              note: offerActive
                ? `one-visit offer — normally $${(VIP_MONTHLY_CENTS / 100).toFixed(2)}`
                : "cancel anytime — nothing auto-renews",
            },
            {
              key: "lifetime" as const,
              label: "Lifetime VIP",
              amount: lifetimePrice,
              note: offerActive
                ? `one-visit offer — normally $${(site.vip_price_cents / 100).toFixed(0)}`
                : "one payment, every future tool",
            },
          ].map((option) => {
            const active = plan === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setPlan(option.key)}
                aria-pressed={active}
                className={`rounded-xl border p-3.5 text-left transition-colors ${
                  active
                    ? "border-primary/60 bg-primary/10"
                    : "border-hairline bg-surface-2/50 hover:bg-surface-2"
                }`}
              >
                <span className="label-mono block">{option.label}</span>
                <span className="mt-1 block font-display text-2xl font-bold text-primary">
                  {option.amount}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{option.note}</span>
              </button>
            );
          })}
        </div>

        <ul className="mt-5 space-y-2">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {perk}
            </li>
          ))}
        </ul>

        <label htmlFor="vip-email" className="label-mono mt-6 mb-1.5 block">
          Email (optional) — for restore on other devices
        </label>
        <div className="flex gap-2">
          <input
            id="vip-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="min-h-11 w-full rounded-xl border border-hairline bg-surface-2/70 px-3 text-sm focus:border-primary/50"
          />
          <button
            type="button"
            onClick={() => void persistEmail()}
            className="min-h-11 shrink-0 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary"
          >
            {emailSaved ? "Saved" : "Save"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          You can skip this — checkout asks for your email anyway. We only store it to restore
          VIP on your other devices.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-hairline bg-surface-2/60 p-1">
          {(["card", "crypto"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {key === "card" ? (
                <CreditCard className="size-4" aria-hidden="true" />
              ) : (
                <Bitcoin className="size-4" aria-hidden="true" />
              )}
              {key === "card" ? "Card" : "Crypto"}
            </button>
          ))}
        </div>

        {tab === "card" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void startCheckout()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Continue to secure checkout — {price}
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Card, Apple&nbsp;Pay, Google&nbsp;Pay and local methods in 195 countries. Secured by
              Whop — we never see your card details.
            </p>
          </>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-border p-4">
            {site.vip_sol_address ? (
              <>
                <p className="text-sm text-foreground">
                  Send exactly {price} worth of SOL or USDC (Solana) to:
                </p>
                <code className="mt-2 block break-all rounded-md bg-surface-2 px-3 py-2 font-mono text-xs">
                  {site.vip_sol_address}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    if (email.includes("@")) void persistEmail();
                    void navigator.clipboard?.writeText(site.vip_sol_address);
                    toast.success("Address copied — email your tx signature to unlock VIP.");
                  }}
                  className="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Copy Solana address
                </button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  After paying, send the transaction signature and your email — VIP is activated
                  within minutes.
                </p>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Crypto checkout opens as soon as the receiving wallet is configured.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (isVip) {
              setVip(false, plan);
              toast.success("VIP turned off on this device.");
              return;
            }
            void restore();
          }}
          className="mt-4 w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-60"
        >
          {isVip ? "Turn off VIP on this device" : "Already purchased? Restore VIP"}
        </button>

        {!isVip ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Paid already? Enter the same email above and tap restore — access returns on any device,
            no code needed.
          </p>
        ) : null}
      </div>
    </div>
  );
}
