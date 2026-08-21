import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";
import { claimImpression, partnerLink, track } from "@/lib/monetization";

const KEY = "sov.socialbar.dismissed";
const SLOT = "social-bar";

export function SocialBar() {
  const { isVip } = useVip();
  const config = useSiteConfig();
  const enabled = config.ads.enabled;
  const [link, setLink] = useState<{ url: string; clickId: string } | null>(null);

  useEffect(() => {
    if (isVip || !enabled) return;
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(KEY) === "1";
    } catch {
      /* storage unavailable */
    }
    if (dismissed) return;
    const t = window.setTimeout(() => {
      if (!claimImpression(SLOT)) return;
      const partner = partnerLink(SLOT, null);
      setLink(partner);
      track({
        event_type: "impression",
        slot: SLOT,
        format: "social_bar",
        click_id: partner.clickId,
      });
    }, 2500);
    return () => window.clearTimeout(t);
  }, [enabled, isVip]);

  if (isVip || !enabled || !link) return null;

  const dismiss = () => {
    setLink(null);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <aside
      aria-label="Sponsored offer"
      className="glass fixed right-4 bottom-20 z-40 sm:bottom-4 flex max-w-[min(20rem,calc(100vw-2rem))] items-center gap-3 rounded-full py-2 pr-2 pl-4 duration-500 animate-in slide-in-from-bottom-4"
    >
      <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() =>
          track({ event_type: "click", slot: SLOT, format: "social_bar", click_id: link.clickId })
        }
        className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-primary"
      >
        <span className="label-mono mr-2">Sponsored</span>
        Free 8K asset drop this week
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss sponsored offer"
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
