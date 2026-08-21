import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getPublicConfig } from "@/lib/admin.functions";
import {
  DEFAULT_CAPS,
  DEFAULT_PRIVACY,
  DEFAULT_PUBLIC_CONFIG,
  MONETAG,
  type PublicConfig,
} from "@/lib/admin-types";
import { useVip } from "@/lib/vip";
import { claimFormat, setPartnerBase, setVipFlag, track } from "@/lib/monetization";
import { adsAllowed, useConsent } from "@/lib/consent";
import { startWebVitals } from "@/lib/web-vitals";

const SiteConfigContext = createContext<PublicConfig>(DEFAULT_PUBLIC_CONFIG);

function normalize(config: PublicConfig | undefined): PublicConfig {
  if (!config) return DEFAULT_PUBLIC_CONFIG;
  return {
    ...config,
    ads: {
      ...config.ads,
      caps: { ...DEFAULT_CAPS, ...(config.ads.caps ?? {}) },
      privacy: { ...DEFAULT_PRIVACY, ...(config.ads.privacy ?? {}) },
    },
  };
}

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const fetchConfig = useServerFn(getPublicConfig);
  const { data } = useQuery({
    queryKey: ["public-config"],
    queryFn: () => fetchConfig({}),
    staleTime: 5 * 60_000,
  });

  const value = useMemo(() => normalize(data as PublicConfig | undefined), [data]);

  return (
    <SiteConfigContext.Provider value={value}>
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
 * Injects a third-party ad script and reports its load time / failures so the
 * admin dashboard can show the real performance impact of each format.
 */
function loadZone(id: string, format: string, zone: string, src: string) {
  if (!zone || injected.has(id)) return;
  injected.add(id);
  const started = performance.now();
  const script = document.createElement("script");
  script.id = id;
  script.dataset["zone"] = zone;
  script.src = src;
  script.async = true;
  script.addEventListener("load", () => {
    track({
      event_type: "script_load",
      slot: format,
      format,
      zone,
      duration_ms: Math.round(performance.now() - started),
    });
  });
  script.addEventListener("error", () => {
    track({
      event_type: "script_error",
      slot: format,
      format,
      zone,
      duration_ms: Math.round(performance.now() - started),
    });
    console.warn(`[ads] ${format} script failed to load (zone ${zone})`);
  });
  document.body.appendChild(script);
}

const claimedThisPage = new Set<string>();
const injected = new Set<string>();

/** Claim a cap slot once per page load, and only if not already injected. */
function shouldLoad(id: string, format: "popunder" | "vignette" | "inpage_push", cap: { perHour: number; perSession: number }) {
  if (typeof document === "undefined") return false;
  if (claimedThisPage.has(format) || claimedThisPage.has(id)) return false;
  claimedThisPage.add(id);
  claimedThisPage.add(format);
  if (claimFormat(format, cap)) return true;
  return false;
}

function MonetagLoader() {
  const config = useContext(SiteConfigContext);
  const { isVip } = useVip();
  const consent = useConsent();
  const ads = config.ads;
  const privacy = ads.privacy ?? DEFAULT_PRIVACY;
  const caps = ads.caps ?? DEFAULT_CAPS;

  useEffect(() => {
    if (ads.smartlink_url) setPartnerBase(ads.smartlink_url);
  }, [ads.smartlink_url]);

  useEffect(() => {
    setVipFlag(isVip);
  }, [isVip]);

  useEffect(() => {
    startWebVitals();
  }, []);

  const allowed = adsAllowed(consent, privacy.consent_required && privacy.block_until_consent);

  useEffect(() => {
    if (consent === undefined) return; // not hydrated yet
    if (isVip || !ads.enabled || typeof document === "undefined") return;
    if (!allowed) {
      track({ event_type: "script_blocked", slot: "consent", format: "consent" });
      return;
    }

    // In-page push: highest sustained RPM, loads immediately site-wide.
    if (ads.monetag_inpage_push && shouldLoad("monetag-push", "inpage_push", caps.inpage_push)) {
      loadZone(
        "monetag-push",
        "inpage_push",
        ads.monetag_push_zone || MONETAG.push.zone,
        MONETAG.push.src,
      );
    }

    // Vignette interstitial: delayed slightly to keep first paint fast.
    let vignetteTimer: number | undefined;
    if (ads.monetag_vignette && shouldLoad("monetag-vignette", "vignette", caps.vignette)) {
      vignetteTimer = window.setTimeout(() => {
        loadZone(
          "monetag-vignette",
          "vignette",
          ads.monetag_vignette_zone || MONETAG.vignette.zone,
          MONETAG.vignette.src,
        );
      }, 1500);
    }

    // Pop-under: only after real engagement (scroll or first tap).
    let popLoaded = false;
    const loadPop = () => {
      if (popLoaded) return;
      popLoaded = true;
      if (!shouldLoad("monetag-popunder", "popunder", caps.popunder)) return;
      loadZone(
        "monetag-popunder",
        "popunder",
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
    consent,
    allowed,
    caps,
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
