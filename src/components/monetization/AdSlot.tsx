import { useEffect, useRef, useState } from "react";

import { useVip } from "@/lib/vip";

/**
 * Inline banner ad container (responsive: 320x100 on mobile, 728x90 up).
 * The placeholder script is attached lazily and asynchronously so it never
 * blocks first paint or hydration. Hidden entirely for VIP users.
 */
export function AdSlot({ id, className = "" }: { id: string; className?: string }) {
  const { isVip } = useVip();
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isVip) return;
    const node = ref.current;
    if (!node) return;
    let cancelled = false;
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 400);

    idle(() => {
      if (cancelled) return;
      // Ad network MultiTag placeholder: a real tag would be appended here.
      // Kept non-blocking and defer/async by construction.
      const tag = document.createElement("script");
      tag.async = true;
      tag.defer = true;
      tag.dataset["adSlot"] = id;
      node.appendChild(tag);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [id, isVip]);

  if (isVip) return null;

  return (
    <div
      ref={ref}
      role="complementary"
      aria-label="Advertisement"
      className={`mx-auto flex h-[100px] w-[320px] items-center justify-center rounded-md border border-dashed border-border/70 bg-surface/40 sm:h-[90px] sm:w-[728px] ${className}`}
    >
      <span className="label-mono">{loaded ? `ad · ${id}` : "ad slot"}</span>
    </div>
  );
}
