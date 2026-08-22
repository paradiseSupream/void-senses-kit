import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useAdSlotEnabled } from "@/lib/site-config";
import { claimImpression, partnerLink, track } from "@/lib/monetization";

const SLOT = "sticky-bottom-mobile";
const DISMISS_KEY = "sov.stickyDismissed";

/**
 * Mobile-only sticky anchor ad. Sits directly above the bottom tab bar,
 * appears after a short delay (so it never competes with first paint),
 * is dismissible for the session and hidden for VIP users.
 */
export function StickyBottomAd() {
  const { isVip, openVipModal } = useVip();
  const enabled = useAdSlotEnabled("sticky_mobile");
  const [visible, setVisible] = useState(false);
  const [link, setLink] = useState<{ url: string; clickId: string } | null>(null);

  useEffect(() => {
    if (isVip || !enabled) return;
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* storage unavailable */
    }
    if (dismissed) return;
    if (!window.matchMedia("(max-width: 640px)").matches) return;

    // Wait until the visitor has settled into the page — the anchor is
    // persistent, so showing it instantly only raises the bounce rate.
    const timer = window.setTimeout(() => {
      if (!claimImpression(SLOT)) return;
      const partner = partnerLink(SLOT, null);
      setLink(partner);
      setVisible(true);
      track({ event_type: "impression", slot: SLOT, click_id: partner.clickId });
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [enabled, isVip]);

  if (isVip || !enabled || !visible || !link) return null;

  return (
    <div
      role="complementary"
      aria-label="Advertisement"
      className="fixed inset-x-0 bottom-16 z-30 px-2 pb-1 sm:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) * 0.25 + 0.25rem)" }}
    >
      <div className="glass relative mx-auto flex h-[62px] max-w-[420px] items-center gap-3 rounded-xl px-3">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => track({ event_type: "click", slot: SLOT, click_id: link.clickId })}
          className="flex min-w-0 flex-1 flex-col justify-center"
        >
          <span className="label-mono text-[10px] text-muted-foreground">Sponsored</span>
          <span className="truncate text-sm font-medium text-foreground">
            Ship your next idea on edge-native hosting
          </span>
        </a>
        <button
          type="button"
          onClick={() => {
            openVipModal();
            track({ event_type: "click", slot: `${SLOT}-vip`, click_id: link.clickId });
          }}
          className="label-mono shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] text-primary"
        >
          Remove ads
        </button>
        <button
          type="button"
          aria-label="Dismiss advertisement"
          onClick={() => {
            setVisible(false);
            try {
              window.sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* storage unavailable */
            }
          }}
          className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border border-hairline bg-surface-2 text-muted-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
