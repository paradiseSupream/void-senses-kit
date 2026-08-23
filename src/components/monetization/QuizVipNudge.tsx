import { Crown } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";

/**
 * Soft in-quiz upsell. Only appears once the user is already invested in the
 * flow (default: past the halfway point), never on landing or in the header,
 * so the site never reads as "paid" on first impression.
 */
export function QuizVipNudge({
  step,
  total,
  showFrom = 0.5,
}: {
  step: number;
  total: number;
  showFrom?: number;
}) {
  const { isVip, openVipModal } = useVip();
  const { site } = useSiteConfig();

  if (isVip || total < 3) return null;
  if ((step + 1) / total < showFrom) return null;

  const price = `$${(site.vip_price_cents / 100).toFixed(0)}`;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface/50 px-4 py-3 backdrop-blur-xl">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Crown className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        Almost done — want your result with no ads or export gate?
      </p>
      <button
        type="button"
        onClick={() => openVipModal()}
        className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
      >
        Remove ads · {price} once
      </button>
    </div>
  );
}
