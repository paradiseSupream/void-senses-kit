import { useEffect, useState } from "react";
import { Copy, Gift, Users } from "lucide-react";
import { toast } from "sonner";

import {
  REFERRAL_REWARD_TARGET,
  referralCredits,
  creditReferralCompletion,
} from "@/lib/referral";
import { trackShare } from "@/lib/share-link";

/**
 * Referral progress + one-tap invite link, shown on result pages.
 *
 * The reward is genuine and never forced: three friends finishing a test from
 * your link waives the export interstitial for the session. Nothing is shared
 * automatically and no personal data leaves the device.
 */
export function ReferralCard({
  toolSlug,
  inviteUrl,
  className = "",
}: {
  toolSlug: string;
  inviteUrl: string;
  className?: string;
}) {
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    // A visitor who arrived from a friend's link and just finished a test
    // credits that friend — deduplicated inside the referral module.
    creditReferralCompletion(toolSlug);
    setCredits(referralCredits());
  }, [toolSlug]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      trackShare({ source: "referral_copy", campaign: toolSlug, content: "referral_card", toolSlug });
      toast.success("Invite link copied — every friend who finishes counts.");
    } catch {
      toast.error("Clipboard blocked by your browser.");
    }
  };

  const done = Math.min(credits, REFERRAL_REWARD_TARGET);
  const earned = credits >= REFERRAL_REWARD_TARGET;

  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <span className="label-mono inline-flex items-center gap-2">
        <Users className="size-4" aria-hidden="true" /> Invite loop
      </span>
      <h3 className="mt-1.5 font-display text-lg">
        {earned ? "Reward unlocked — exports skip the wait" : "Three friends, ad-free exports"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {earned
          ? "Your downloads open straight away for this session. Thanks for spreading it."
          : `Share your link. When ${REFERRAL_REWARD_TARGET} friends finish a test, your exports skip the interstitial.`}
      </p>

      <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: REFERRAL_REWARD_TARGET }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < done ? "bg-primary" : "bg-surface-2"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {done}/{REFERRAL_REWARD_TARGET} friends finished
      </p>

      <button
        type="button"
        onClick={copy}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-hairline px-4 text-sm font-medium transition-colors hover:bg-surface-2"
      >
        {earned ? <Gift className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        Copy my invite link
      </button>
    </div>
  );
}
