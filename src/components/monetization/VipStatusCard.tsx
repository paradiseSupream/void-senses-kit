import { Check, Crown, Infinity as InfinityIcon, Loader2 } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useDirectCheckout } from "@/lib/use-direct-checkout";
import { VIP_LIFETIME_CENTS, usd } from "@/lib/vip-pricing";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const PERKS = [
  "Full report and Shadow Matrix unlocked",
  "No ads, no export gate",
  "High-resolution PDF and PNG exports",
  "Unlimited access to every current and future tool",
];

/**
 * Post-purchase plan panel — the same component the result page and the VIP
 * modal use, so a paying visitor always sees one professional plan summary:
 * plan name, status badge, billing line with days remaining, entitlements and
 * exactly one action (upgrade to lifetime, for monthly members only).
 *
 * No discount, anchor or countdown may ever appear here: seeing a cheaper
 * price after paying is the fastest way to trigger a refund request.
 */
export function VipStatusCard({ className = "" }: { className?: string }) {
  const { isVip, plan, expiresAt, closeVipModal } = useVip();
  const { busy, error, go } = useDirectCheckout();
  if (!isVip) return null;

  const monthly = plan === "monthly";
  const renewsOn = monthly && expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const daysLeft = monthly && expiresAt
    ? Math.max(0, Math.ceil((expiresAt - Date.now()) / DAY_MS))
    : null;
  // How much of the current 30-day cycle is still unused.
  const remainingPct = monthly && expiresAt
    ? Math.min(100, Math.max(0, ((expiresAt - Date.now()) / MONTH_MS) * 100))
    : 100;

  return (
    <section className={`panel p-4 sm:p-5 ${className}`} aria-label="Your VIP plan">
      <div className="flex items-start gap-3">
        <span className="accent-tile size-11 shrink-0 bg-primary/10">
          {monthly ? (
            <Crown className="size-5 text-primary" aria-hidden="true" />
          ) : (
            <InfinityIcon className="size-5 text-primary" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-semibold">
              {monthly ? "Monthly VIP" : "Lifetime VIP"}
            </p>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Active
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {monthly
              ? renewsOn
                ? `Renews ${renewsOn}${daysLeft !== null ? ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : ""} · cancel anytime`
                : "Renews monthly · cancel anytime"
              : "One payment · never renews · every current and future tool included"}
          </p>
        </div>
      </div>

      {monthly ? (
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(remainingPct)}
          aria-label="Days remaining in this billing cycle"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${remainingPct}%` }} />
        </div>
      ) : null}

      <ul className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        {PERKS.map((line) => (
          <li key={line} className="flex items-start gap-1.5">
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>

      {monthly ? (
        <div className="mt-4 rounded-xl border border-hairline bg-surface-2/50 p-3">
          <p className="text-sm font-medium">Stop the monthly renewal</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upgrade to Lifetime VIP — {usd(VIP_LIFETIME_CENTS)} one payment, never renews. Wallet
            and crypto payment are available on this plan.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              // This card also renders inside the VIP modal. Close that overlay
              // before starting checkout so it cannot remain above the new route.
              closeVipModal();
              void go("lifetime");
            }}
            className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Upgrade to Lifetime · {usd(VIP_LIFETIME_CENTS)}
          </button>
          {error ? (
            <p role="alert" className="mt-2 text-center text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
