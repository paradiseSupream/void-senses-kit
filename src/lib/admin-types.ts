export type AdsSettings = {
  enabled: boolean;
  monetag_verify: string;
  monetag_zone: string;
  monetag_popunder: boolean;
  monetag_inpage_push: boolean;
  adsterra_banner_key: string;
  adsterra_native_key: string;
  slots: { result: boolean; gate: boolean; sticky_mobile: boolean; native_feed: boolean };
  rpm_estimate_cents: number;
};

export type SiteSettings = {
  maintenance: boolean;
  announcement: string;
  vip_price_cents: number;
  vip_sol_address: string;
  stripe_enabled: boolean;
};

export type PublicConfig = {
  ads: Pick<
    AdsSettings,
    "enabled" | "monetag_zone" | "monetag_popunder" | "monetag_inpage_push" | "slots"
  >;
  site: Pick<SiteSettings, "announcement" | "vip_price_cents" | "vip_sol_address">;
};

export const DEFAULT_PUBLIC_CONFIG: PublicConfig = {
  ads: {
    enabled: true,
    monetag_zone: "",
    monetag_popunder: false,
    monetag_inpage_push: false,
    slots: { result: true, gate: true, sticky_mobile: true, native_feed: true },
  },
  site: { announcement: "", vip_price_cents: 1900, vip_sol_address: "" },
};
