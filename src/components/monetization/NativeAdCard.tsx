import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useAdSlotEnabled } from "@/lib/site-config";
import { claimImpression, partnerLink, track } from "@/lib/monetization";

const SPONSORED = [
  {
    title: "Ship faster with edge-native hosting",
    body: "Deploy globally in seconds. Free tier for indie builders.",
  },
  {
    title: "Unlimited stock renders",
    body: "Royalty-free 8K textures and cinematic HDRIs for your scenes.",
  },
  {
    title: "Learn systems design in 30 days",
    body: "A daily email course written by senior infra engineers.",
  },
];

/**
 * In-feed sponsored card. Hidden for VIP users and when the native_feed slot is
 * disabled in /admin; links to the partner smartlink with full attribution and
 * reports impression/click like every other slot.
 */
export function NativeAdCard({ index = 0, toolSlug }: { index?: number; toolSlug?: string }) {
  const ad = SPONSORED[index % SPONSORED.length]!;
  const { isVip } = useVip();
  const enabled = useAdSlotEnabled("native_feed");
  const slot = `native-${index}`;
  const ref = useRef<HTMLAnchorElement>(null);
  const [link, setLink] = useState<{ url: string; clickId: string } | null>(null);

  useEffect(() => {
    if (isVip || !enabled) return;
    const node = ref.current;
    if (!node) return;
    let done = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (done || !entries.some((e) => e.isIntersecting)) return;
        done = true;
        observer.disconnect();
        if (!claimImpression(slot)) return;
        const partner = partnerLink(slot, toolSlug ?? null);
        setLink(partner);
        track({
          event_type: "impression",
          slot,
          tool_slug: toolSlug ?? null,
          format: "native_feed",
          click_id: partner.clickId,
        });
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, isVip, slot, toolSlug]);

  if (isVip || !enabled) return null;

  return (
    <a
      ref={ref}
      href={link?.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={(e) => {
        if (!link) {
          e.preventDefault();
          return;
        }
        track({
          event_type: "click",
          slot,
          tool_slug: toolSlug ?? null,
          format: "native_feed",
          click_id: link.clickId,
        });
      }}
      className="glass lift group flex flex-col justify-between rounded-xl p-5"
    >
      <div>
        <span className="label-mono rounded-full border border-secondary/40 bg-secondary/15 px-2 py-0.5 text-secondary-foreground">
          Sponsored
        </span>
        <h3 className="mt-4 text-base font-semibold text-foreground">{ad.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{ad.body}</p>
      </div>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        Learn more <ExternalLink className="size-3.5" aria-hidden="true" />
      </span>
    </a>
  );
}

/** Injects a sponsored card after every 4th item of a grid. */
export function withNativeAds<T>(items: T[], every = 4): Array<{ item: T } | { ad: number }> {
  const out: Array<{ item: T } | { ad: number }> = [];
  let adCount = 0;
  items.forEach((item, i) => {
    out.push({ item });
    if ((i + 1) % every === 0 && i + 1 < items.length) {
      out.push({ ad: adCount++ });
    }
  });
  return out;
}
