import { useEffect, useRef, useState } from "react";

import { useVip } from "@/lib/vip";
import { useSiteConfig } from "@/lib/site-config";
import { claimImpression, partnerLink, track } from "@/lib/monetization";

function slotKind(slot: string): "result" | "gate" | "sticky_mobile" | "native_feed" {
  if (slot.startsWith("sticky")) return "sticky_mobile";
  if (slot.startsWith("gate")) return "gate";
  if (slot.startsWith("native")) return "native_feed";
  return "result";
}


/**
 * Inline banner ad container (responsive: 320x100 on mobile, 728x90 up).
 * Loaded lazily on idle + viewport intersection, frequency-capped per hour and
 * per session, and tracked (impression / click) for RPM + CTR reporting.
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
  const { isVip } = useVip();
  const config = useSiteConfig();
  const enabled = config.ads.enabled && config.ads.slots[slotKind(id)] !== false;
  const ref = useRef<HTMLDivElement>(null);
  const [allowed, setAllowed] = useState(false);
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
          className="mx-auto flex h-[100px] w-[320px] items-center justify-center rounded-md border border-dashed border-border/70 bg-surface/40 transition-colors hover:border-primary/50 sm:h-[90px] sm:w-[728px]"
        >
          <span className="label-mono">sponsored · {id}</span>
        </a>
      ) : null}
    </div>
  );
}
