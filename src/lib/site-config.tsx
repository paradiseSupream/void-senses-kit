import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getPublicConfig } from "@/lib/admin.functions";
import { DEFAULT_PUBLIC_CONFIG, MONETAG, type PublicConfig } from "@/lib/admin-types";
import { useVip } from "@/lib/vip";
import { setPartnerBase } from "@/lib/monetization";

const SiteConfigContext = createContext<PublicConfig>(DEFAULT_PUBLIC_CONFIG);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const fetchConfig = useServerFn(getPublicConfig);
  const { data } = useQuery({
    queryKey: ["public-config"],
    queryFn: () => fetchConfig({}),
    staleTime: 5 * 60_000,
  });

  return (
    <SiteConfigContext.Provider value={data ?? DEFAULT_PUBLIC_CONFIG}>
      <MonetagLoader />
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): PublicConfig {
  return useContext(SiteConfigContext);
}

/** True when the given ad placement is enabled in the admin panel. */
export function useAdSlotEnabled(kind: keyof PublicConfig["ads"]["slots"]): boolean {
  const config = useSiteConfig();
  return config.ads.enabled && config.ads.slots[kind] !== false;
}

/**
 * Injects the Monetag site-wide scripts (in-page push, vignette, pop-under) on
 * the client only, for non-VIP visitors, when the placement is enabled.
 */
function loadZone(id: string, zone: string, src: string) {
  if (!zone || document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.dataset["zone"] = zone;
  script.src = src;
  script.async = true;
  document.body.appendChild(script);
}

function MonetagLoader() {
  const config = useContext(SiteConfigContext);
  const { isVip } = useVip();
  const ads = config.ads;

  useEffect(() => {
    if (ads.smartlink_url) setPartnerBase(ads.smartlink_url);
  }, [ads.smartlink_url]);

  useEffect(() => {
    if (isVip || !ads.enabled || typeof document === "undefined") return;

    // In-page push: highest sustained RPM, loads immediately site-wide.
    if (ads.monetag_inpage_push) {
      loadZone(
        "monetag-push",
        ads.monetag_push_zone || MONETAG.push.zone,
        MONETAG.push.src,
      );
    }

    // Vignette interstitial: fires on navigation, so it is delayed slightly to
    // keep first paint fast.
    let vignetteTimer: number | undefined;
    if (ads.monetag_vignette) {
      vignetteTimer = window.setTimeout(() => {
        loadZone(
          "monetag-vignette",
          ads.monetag_vignette_zone || MONETAG.vignette.zone,
          MONETAG.vignette.src,
        );
      }, 1500);
    }

    // Pop-under: only after real engagement (scroll or first tap) so bounce
    // rate is not hurt on landing.
    let popLoaded = false;
    const loadPop = () => {
      if (popLoaded) return;
      popLoaded = true;
      loadZone(
        "monetag-popunder",
        ads.monetag_popunder_zone || MONETAG.popunder.zone,
        MONETAG.popunder.src,
      );
    };
    if (ads.monetag_popunder) {
      window.addEventListener("pointerdown", loadPop, { once: true });
      window.addEventListener("scroll", loadPop, { once: true, passive: true });
    }

    return () => {
      if (vignetteTimer) window.clearTimeout(vignetteTimer);
      window.removeEventListener("pointerdown", loadPop);
      window.removeEventListener("scroll", loadPop);
    };
  }, [
    isVip,
    ads.enabled,
    ads.monetag_inpage_push,
    ads.monetag_push_zone,
    ads.monetag_vignette,
    ads.monetag_vignette_zone,
    ads.monetag_popunder,
    ads.monetag_popunder_zone,
  ]);

  return null;
}
