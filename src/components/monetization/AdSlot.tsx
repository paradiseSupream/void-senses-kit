import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { useVip } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";
import { claimImpression, partnerLink, track } from "@/lib/monetization";

function slotKind(slot: string): "result" | "gate" | "sticky_mobile" | "native_feed" {
  if (slot.startsWith("sticky")) return "sticky_mobile";
  if (slot.startsWith("gate")) return "gate";
  if (slot.startsWith("native")) return "native_feed";
  return "result";
}

/** First-party creatives so the surface never renders as an empty grey box. */
const CREATIVES = [
  {
    tag: "Recommended",
    title: "Unlock the premium creator bundle",
    body: "UI kits, 8K textures and AI prompt packs — claim today's free drop.",
    cta: "Claim now",
  },
  {
    tag: "Sponsored",
    title: "Ship your next app in a weekend",
    body: "Edge-native hosting with a generous free tier for indie builders.",
    cta: "Try free",
  },
  {
    tag: "Popular",
    title: "Level up your reasoning score",
    body: "Daily brain-training drills built by cognitive science researchers.",
    cta: "Start today",
  },
] as const;

/**
 * Inline sponsored placement (responsive card).
 * Loaded lazily on viewport intersection, frequency-capped per hour and per
 * session, and tracked (impression / click) for RPM + CTR reporting.
 * Hidden entirely for VIP users.
 */
export function AdSlot({
  id,
  toolSlug,
  className = "",
}: {
  id: string;
  toolSlug?: string;
  className?: string;
}) {
  const { isVip, openVipModal } = useVip();
  const config = useSiteConfig();
  const enabled = config.ads.enabled && config.ads.slots[slotKind(id)] !== false;
  const ref = useRef<HTMLDivElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [link, setLink] = useState<{ url: string; clickId: string } | null>(null);

  const creative = useMemo(() => {
    let hash = 0;
    for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return CREATIVES[hash % CREATIVES.length]!;
  }, [id]);

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
        if (!claimImpression(id)) return;
        const partner = partnerLink(id, toolSlug ?? null);
        setLink(partner);
        setAllowed(true);
        track({
          event_type: "impression",
          slot: id,
          tool_slug: toolSlug ?? null,
          revenue_cents: 0,
          click_id: partner.clickId,
        });
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, id, isVip, toolSlug]);

  if (isVip || !enabled) return null;

  return (
    <div ref={ref} className={allowed ? className : "min-h-px"} aria-hidden={!allowed}>
      {allowed && link ? (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() =>
            track({
              event_type: "click",
              slot: id,
              tool_slug: toolSlug ?? null,
              click_id: link.clickId,
            })
          }
          role="complementary"
          aria-label="Advertisement"
          className="panel lift group flex items-center gap-3 overflow-hidden p-4 sm:gap-4 sm:p-5"
        >
          <span className="accent-tile size-11 shrink-0 bg-surface-2/60 sm:size-12">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="label-mono block text-[0.6rem]">{creative.tag}</span>
            <span className="mt-0.5 block truncate font-display text-sm font-semibold sm:text-base">
              {creative.title}
            </span>
            <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {creative.body}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline bg-surface/70 px-3 py-1.5 text-xs font-semibold">
            {creative.cta}
            <ArrowUpRight
              className="size-3.5 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </a>
      ) : null}
      {allowed && link ? (
        <button
          type="button"
          onClick={() => {
            openVipModal();
            track({ event_type: "click", slot: `${id}-vip`, click_id: link.clickId });
          }}
          className="label-mono mt-1.5 ml-auto block text-[0.6rem] text-muted-foreground underline underline-offset-4 hover:text-primary"
        >
          Browse ad-free
        </button>
      ) : null}
    </div>
  );
}
