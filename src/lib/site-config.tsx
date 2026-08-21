import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getPublicConfig } from "@/lib/admin.functions";
import { DEFAULT_PUBLIC_CONFIG, type PublicConfig } from "@/lib/admin-types";
import { useVip } from "@/lib/vip";

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
 * Injects the Monetag zone script (in-page push / pop-under) on the client only,
 * for non-VIP visitors, when a zone id is configured in the admin panel.
 */
function MonetagLoader() {
  const config = useContext(SiteConfigContext);
  const { isVip } = useVip();
  const zone = config.ads.monetag_zone;
  const wanted = config.ads.enabled && (config.ads.monetag_inpage_push || config.ads.monetag_popunder);

  useEffect(() => {
    if (isVip || !zone || !wanted) return;
    if (document.getElementById("monetag-zone-script")) return;
    const script = document.createElement("script");
    script.id = "monetag-zone-script";
    script.src = `https://vemtoutcheeg.com/400/${zone}`;
    script.async = true;
    script.dataset["zone"] = zone;
    document.body.appendChild(script);
  }, [isVip, wanted, zone]);

  return null;
}
