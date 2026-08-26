import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useConsent } from "@/lib/consent";
import { loadPixels, pixelPageView, pixelsEnabled } from "@/lib/pixels";

/**
 * Loads Meta / TikTok / Google Ads pixels once advertising consent is granted
 * and sends a page view on every client-side route change.
 */
export function PixelLoader() {
  const consent = useConsent();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const allowed = consent === "all";

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
