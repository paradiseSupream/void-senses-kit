import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useConsent } from "@/lib/consent";
import { ga4Enabled, gaPageView, loadGa4 } from "@/lib/ga4";

/**
 * Loads GA4 once analytics consent is granted and sends a page_view on every
 * client-side route change (gtag only auto-tracks the first load).
 */
export function Ga4Loader() {
  const consent = useConsent();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const allowed = consent === "all";

  useEffect(() => {
    if (!allowed || !ga4Enabled()) return;
    loadGa4();
  }, [allowed]);

  useEffect(() => {
    if (!allowed || !ga4Enabled()) return;
    gaPageView(pathname);
  }, [allowed, pathname]);

  return null;
}
