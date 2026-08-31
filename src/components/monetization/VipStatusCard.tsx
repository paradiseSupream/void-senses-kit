import { Check, Crown } from "lucide-react";

import { useVip } from "@/lib/vip";

/**
 * Post-purchase state for every surface that used to sell VIP.
 *
 * Once a visitor is VIP no discount, anchor or countdown may appear again —
 * seeing a cheaper price after paying is the single fastest way to trigger a
 * refund request. This card replaces the offer with a calm confirmation of
 * which plan is active.
 */
export function VipStatusCard({ className = "" }: { className?: string }) {
  const { isVip, plan, expiresAt } = useVip();
  if (!isVip) return null;

  const monthly = plan === "monthly";
  const renews = monthly && expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className={`panel flex items-start gap-3 p-4 sm:p-5 ${className}`}>
      <span className="accent-tile size-11 shrink-0 bg-primary/10">
        <Crown className="size-5 text-primary" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <span className="label-mono block text-[0.6rem] text-primary">VIP active</span>
        <p className="mt-0.5 font-display text-base font-semibold">
          {monthly ? "Monthly VIP — no ads" : "Lifetime VIP — no ads, forever"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {monthly
            ? renews
              ? `Renews ${renews} · cancel anytime`
              : "Renews monthly · cancel anytime"
            : "One payment · every current and future tool included"}
        </p>
        <ul className="mt-2 grid gap-1 text-xs text-muted-foreground">
          {[
            "Full report and Shadow Matrix unlocked",
            "No ads, no export gate",
            "High-resolution PDF and PNG exports",
          ].map((line) => (
            <li key={line} className="flex items-start gap-1.5">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
