import { useEffect, useState } from "react";
import { Bitcoin, Check, CreditCard, X } from "lucide-react";
import { toast } from "sonner";

import { useVip, type VipPlan } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";
import { trackFunnel } from "@/lib/funnel";

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
  const { vipModalOpen, closeVipModal, setVip, isVip } = useVip();
  const [tab, setTab] = useState<"card" | "crypto">("card");
  const [plan, setPlan] = useState<VipPlan>("lifetime");
  const { site } = useSiteConfig();
  const lifetimePrice = `$${(site.vip_price_cents / 100).toFixed(0)}`;
  const monthlyPrice = `$${(VIP_MONTHLY_CENTS / 100).toFixed(2)}`;
  const price = plan === "lifetime" ? lifetimePrice : monthlyPrice;

  useEffect(() => {
    if (vipModalOpen) trackFunnel("vip_gate_shown");
  }, [vipModalOpen]);

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

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                key: "monthly" as const,
                label: "1 month, no ads",
                amount: monthlyPrice,
                note: "cancel anytime — nothing auto-renews",
              },
              {
                key: "lifetime" as const,
                label: "Lifetime VIP",
                amount: lifetimePrice,
                note: "one payment, every future tool",
              },
            ]
          ).map((option) => {
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
          <button
            type="button"
            onClick={() => {
              trackFunnel("vip_purchase");
              toast.info("Checkout opens once payments are connected to this project.");
            }}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue to secure checkout — {price}
          </button>
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
          onClick={() => {
            setVip(!isVip, plan);
            toast.success(isVip ? "VIP preview disabled." : "VIP preview enabled on this device.");
          }}
          className="mt-4 w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {isVip ? "Turn off VIP preview" : "Already purchased? Restore VIP on this device"}
        </button>
      </div>
    </div>
  );
}
