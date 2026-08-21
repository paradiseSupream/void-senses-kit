import { useState } from "react";
import { Bitcoin, Check, CreditCard, X } from "lucide-react";
import { toast } from "sonner";

import { useVip } from "@/lib/vip";

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
          onClick={closeVipModal}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <span className="label-mono">Lifetime access</span>
        <h2 id="vip-title" className="mt-2 font-display text-2xl font-bold">
          Senses of Void VIP
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One payment. Every tool, forever, with nothing in the way.
        </p>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold text-primary">$19</span>
          <span className="text-sm text-muted-foreground">once — no subscription</span>
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
              toast.info("Checkout opens once payments are connected to this project.");
            }}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue to secure checkout
          </button>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Crypto checkout (USDC / BTC / ETH) is coming soon.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-lg border border-hairline px-4 py-2.5 text-sm font-medium text-muted-foreground"
            >
              Pay with Crypto — placeholder
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setVip(!isVip);
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
