import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useConsent } from "@/lib/consent";
import { useSiteConfig } from "@/lib/site-config";
import { configurePixels, loadPixels, pixelPageView, pixelsEnabled } from "@/lib/pixels";

/**
 * Loads Meta / TikTok / Google Ads pixels using the ids saved in the admin
 * panel (env values act as a fallback) and sends a page view on every
 * client-side route change. Consent gating is admin-controlled.
 */
export function PixelLoader() {
  const consent = useConsent();
  const tracking = useSiteConfig().tracking;
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const requireConsent = tracking?.require_consent !== false;
  const allowed = tracking?.enabled !== false && (!requireConsent || consent === "all");

  useEffect(() => {
    configurePixels({
      meta: tracking?.meta_pixel_id,
      tiktok: tracking?.tiktok_pixel_id,
      googleAds: tracking?.google_ads_id,
      googleLabel: tracking?.google_ads_conversion_label,
    });
  }, [
    tracking?.meta_pixel_id,
    tracking?.tiktok_pixel_id,
    tracking?.google_ads_id,
    tracking?.google_ads_conversion_label,
  ]);

  useEffect(() => {
    if (!allowed || !pixelsEnabled()) return;
    loadPixels();
  }, [allowed]);

  useEffect(() => {
    if (!allowed || !pixelsEnabled()) return;
    pixelPageView(pathname);
  }, [allowed, pathname]);

  return null;
}
