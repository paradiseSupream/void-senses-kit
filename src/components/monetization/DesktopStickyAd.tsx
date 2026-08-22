import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useAdSlotEnabled } from "@/lib/site-config";
import { claimImpression, partnerLink, track } from "@/lib/monetization";

const SLOT = "sticky-desktop";
const DISMISS_KEY = "sov.desktopStickyDismissed";

/**
 * Desktop-only bottom-left sticky card. Hidden for VIP users and when the
 * sticky_desktop slot is disabled in /admin; links to the partner smartlink.
 */
export function DesktopStickyAd() {
  const { isVip, openVipModal } = useVip();
  const enabled = useAdSlotEnabled("sticky_desktop");
  const [visible, setVisible] = useState(false);
  const [link, setLink] = useState<{ url: string; clickId: string } | null>(null);

  useEffect(() => {
    if (isVip || !enabled) return;
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* storage unavailable */
    }
    if (dismissed) return;
    if (window.matchMedia("(max-width: 640px)").matches) return;

    const timer = window.setTimeout(() => {
      if (!claimImpression(SLOT)) return;
      const partner = partnerLink(SLOT, null);
      setLink(partner);
      setVisible(true);
      track({ event_type: "impression", slot: SLOT, click_id: partner.clickId });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [enabled, isVip]);

  if (isVip || !enabled || !visible || !link) return null;

  return (
    <div
      role="complementary"
      aria-label="Advertisement"
      className="fixed bottom-4 left-4 z-30 hidden max-w-xs sm:block"
    >
      <div className="glass relative flex items-center gap-3 rounded-xl p-3">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => track({ event_type: "click", slot: SLOT, click_id: link.clickId })}
          className="flex min-w-0 flex-1 flex-col justify-center"
        >
          <span className="label-mono text-[10px] text-muted-foreground">Sponsored</span>
          <span className="truncate text-sm font-medium text-foreground">Unlock premium creative assets</span>
          <span className="truncate text-xs text-muted-foreground">8K textures, UI kits, prompt packs.</span>
        </a>
        <button
          type="button"
          onClick={() => openVipModal()}
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
              window.localStorage.setItem(DISMISS_KEY, "1");
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
