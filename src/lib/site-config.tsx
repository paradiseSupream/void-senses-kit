import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getPublicConfig } from "@/lib/admin.functions";
import {
  DEFAULT_CAPS,
  DEFAULT_PRIVACY,
  ADSTERRA,
  DEFAULT_PUBLIC_CONFIG,
  MONETAG,
  type PublicConfig,
} from "@/lib/admin-types";
import { useVip } from "@/lib/vip";
import { claimFormat, setPartnerBase, setVipFlag, track } from "@/lib/monetization";
import { adsAllowed, useConsent } from "@/lib/consent";
import { Ga4Loader } from "@/components/Ga4Loader";
import { startWebVitals } from "@/lib/web-vitals";
import { plannedAdScripts, tierAdjust, tierCapScale, type Tier } from "@/lib/ad-policy";
import { startFunnel, stopFunnel } from "@/lib/funnel";
import { bumpPageView, whenEngaged, isQuizActive, QUIZ_PHASE_EVENT } from "@/lib/engagement";
import { isCampaignSession, markCampaignSession } from "@/lib/campaign-mode";
import { scheduleAdWork } from "@/lib/ad-safety";
import { AdErrorBoundary } from "@/components/monetization/AdErrorBoundary";

/**
 * Vignettes never fire on the landing view — an interstitial before the
 * visitor has seen any value is the single biggest bounce driver.
 */
const VIGNETTE_MIN_PAGEVIEWS = 3;

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
      <AdErrorBoundary>
        <MonetagLoader />
      </AdErrorBoundary>
      <Ga4Loader />
      <PixelLoader />
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
  scheduleAdWork(() => {
    if (injected.has(id)) return;
    injected.add(id);
    const started = performance.now();
    try {
      const script = document.createElement("script");
      script.id = id;
      script.dataset["zone"] = zone;
      script.dataset["cfasync"] = "false";
      script.setAttribute("data-cfasync", "false");
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
        script.remove();
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
    } catch (error) {
      injected.delete(id);
      track({ event_type: "script_error", slot: format, format, zone });
      console.warn(`[ads] ${format} script was isolated`, error);
    }
  }, 3_000);
}

const claimedThisPage = new Set<string>();
const injected = new Set<string>();

/** Claim a cap slot once per page load, and only if not already injected. */
function shouldLoad(id: string, format: "popunder" | "vignette" | "inpage_push" | "adsterra_social_bar", cap: { perHour: number; perSession: number }) {
  if (typeof document === "undefined") return false;
  if (claimedThisPage.has(format) || claimedThisPage.has(id)) return false;
  claimedThisPage.add(id);
  claimedThisPage.add(format);
  if (claimFormat(format, cap)) return true;
  return false;
}

/** Visitor market tier, resolved once from the edge (cached 10 min). */
function useTier(): Tier {
  const { data } = useQuery({
    queryKey: ["geo-tier"],
    queryFn: async () => {
      const res = await fetch("/api/public/geo");
      return (await res.json()) as { country: string | null; tier: Tier };
    },
    staleTime: 30 * 60_000,
    retry: false,
  });
  return data?.tier ?? "tier3";
}

function scaleCaps(caps: typeof DEFAULT_CAPS, scale: number): typeof DEFAULT_CAPS {
  const cap = (v: { perHour: number; perSession: number }) => ({
    perHour: Math.max(1, Math.round(v.perHour * scale)),
    perSession: Math.max(1, Math.round(v.perSession * scale)),
  });
  return {
    popunder: cap(caps.popunder),
    vignette: cap(caps.vignette),
    inpage_push: cap(caps.inpage_push),
  };
}

function MonetagLoader() {
  const config = useContext(SiteConfigContext);
  const { isVip } = useVip();
  const consent = useConsent();
  const tier = useTier();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [depth, setDepth] = useState(0);
  // Auto campaign-safe mode: paid-social / ad-landing sessions never get a
  // third-party script (no manual toggle needed to stay FB-policy safe).
  const [campaignSafe, setCampaignSafe] = useState(false);
  const [quizPhase, setQuizPhase] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const ads = config.ads;
  const privacy = ads.privacy ?? DEFAULT_PRIVACY;
  const caps = useMemo(
    () => scaleCaps(ads.caps ?? DEFAULT_CAPS, tierCapScale(tier)),
    [ads.caps, tier],
  );

  useEffect(() => {
    startFunnel();
    return stopFunnel;
  }, []);

  // Page-view depth per session (drives the vignette delay below).
  useEffect(() => {
    setDepth(bumpPageView());
  }, [pathname]);

  useEffect(() => {
    setCampaignSafe(markCampaignSession(window.location.search, document.referrer) || isCampaignSession());
  }, [pathname]);

  // Never fire an intrusive format while a quiz is open and unfinished.
  useEffect(() => {
    setQuizPhase(isQuizActive());
    const onPhase = (event: Event) => setQuizPhase((event as CustomEvent<boolean>).detail === true);
    window.addEventListener(QUIZ_PHASE_EVENT, onPhase);
    return () => window.removeEventListener(QUIZ_PHASE_EVENT, onPhase);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const syncDevice = () => setIsMobile(query.matches);
    syncDevice();
    query.addEventListener("change", syncDevice);
    return () => query.removeEventListener("change", syncDevice);
  }, []);

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

  const onAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (consent === undefined) return; // not hydrated yet
    if (typeof document === "undefined") return;
    if (onAdminRoute) return; // the operator panel stays ad-free
    if (!allowed && !isVip && ads.enabled) {
      track({ event_type: "script_blocked", slot: "consent", format: "consent" });
    }

    // Single source of truth for "which third-party script may run" (CI-checked).
    // Geo-tiered: Tier-1 gets the full Monetag + Adsterra stack, Tier-2 loses
    // the vignette, Tier-3 keeps only in-page push so cheap traffic is not
    // burned out for pennies.
    const planned = tierAdjust(
      plannedAdScripts(ads, {
        isVip,
        consentAllowsAds: allowed,
        campaignSafe,
        quizActive: quizPhase,
        isMobile,
      }),
      tier,
    );
    if (planned.length === 0) return;

    // In-page push: only for visitors who actually started a tool (or after a
    // long 25s dwell), so bouncers never see it and CTR stays high.
    const cancelPush = planned.includes("inpage_push")
      ? whenEngaged(() => {
          if (!shouldLoad("monetag-push", "inpage_push", caps.inpage_push)) return;
          loadZone(
            "monetag-push",
            "inpage_push",
            ads.monetag_push_zone || MONETAG.push.zone,
            MONETAG.push.src,
          );
        }, 25_000)
      : () => undefined;

    // Adsterra Social Bar: persistent sticky bar; waits for engagement (or 15s)
    // so it never competes with the first impression of the page.
    const cancelBar = planned.includes("adsterra_social_bar")
      ? whenEngaged(() => {
          if (!shouldLoad("adsterra-social-bar", "adsterra_social_bar", { perHour: 1, perSession: 1 })) return;
          loadZone(
            "adsterra-social-bar",
            "adsterra_social_bar",
            "social_bar",
            ads.adsterra_social_bar_src || ADSTERRA.social_bar,
          );
        }, 15_000)
      : () => undefined;

    // Vignette interstitial: deep in the session only, and never during the
    // first seconds of a page view.
    let vignetteTimer: number | undefined;
    if (
      planned.includes("vignette") &&
      depth >= VIGNETTE_MIN_PAGEVIEWS &&
      shouldLoad("monetag-vignette", "vignette", caps.vignette)
    ) {
      vignetteTimer = window.setTimeout(() => {
        loadZone(
          "monetag-vignette",
          "vignette",
          ads.monetag_vignette_zone || MONETAG.vignette.zone,
          MONETAG.vignette.src,
        );
      }, 4_000);
    }

    // Pop-under: the most intrusive format — only for returning-depth sessions
    // (2+ page views) and only after a real scroll or tap.
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
    if (planned.includes("popunder") && depth >= 2) {
      window.addEventListener("pointerdown", loadPop, { once: true });
      window.addEventListener("scroll", loadPop, { once: true, passive: true });
    }

    return () => {
      cancelPush();
      cancelBar();
      if (vignetteTimer) window.clearTimeout(vignetteTimer);
      window.removeEventListener("pointerdown", loadPop);
      window.removeEventListener("scroll", loadPop);
    };
  }, [
    onAdminRoute,
    campaignSafe,
    quizPhase,
    isMobile,
    depth,
    tier,
    isVip,
    consent,
    allowed,
    caps,
    ads,
    ads.enabled,
    ads.lean_mode,
    ads.monetag_inpage_push,
    ads.monetag_push_zone,
    ads.monetag_vignette,
    ads.monetag_vignette_zone,
    ads.monetag_popunder,
    ads.monetag_popunder_zone,
    ads.adsterra_social_bar,
    ads.adsterra_social_bar_src,
  ]);

  return null;
}
