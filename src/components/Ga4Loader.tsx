import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useConsent, useConsentRequired } from "@/lib/consent";
import { configureGa4, ga4Enabled, gaPageView, loadGa4 } from "@/lib/ga4";
import { useSiteConfig } from "@/lib/site-config";

/**
 * Loads GA4 once analytics consent is granted and sends a page_view on every
 * client-side route change (gtag only auto-tracks the first load).
 */
export function Ga4Loader() {
  const consent = useConsent();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const tracking = useSiteConfig().tracking;
  const required = useConsentRequired(tracking?.require_consent !== false);
  const allowed = !required ? consent !== "essential" : consent === "all";

  useEffect(() => {
    configureGa4(tracking?.ga4_id);
  }, [tracking?.ga4_id]);

  useEffect(() => {
    if (!allowed || !ga4Enabled()) return;
    loadGa4();
  }, [allowed, tracking?.ga4_id]);

  useEffect(() => {
    if (!allowed || !ga4Enabled()) return;
    gaPageView(pathname);
  }, [allowed, pathname]);

  return null;
}
