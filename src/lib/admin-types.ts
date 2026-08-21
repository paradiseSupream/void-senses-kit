export type AdsSettings = {
  enabled: boolean;
  monetag_verify: string;
  monetag_zone: string;
  monetag_popunder: boolean;
  monetag_popunder_zone: string;
  monetag_inpage_push: boolean;
  monetag_push_zone: string;
  monetag_vignette: boolean;
  monetag_vignette_zone: string;
  smartlink_url: string;
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

export type PublicAdsConfig = Pick<
  AdsSettings,
  | "enabled"
  | "monetag_zone"
  | "monetag_popunder"
  | "monetag_popunder_zone"
  | "monetag_inpage_push"
  | "monetag_push_zone"
  | "monetag_vignette"
  | "monetag_vignette_zone"
  | "smartlink_url"
  | "slots"
>;

export type PublicConfig = {
  ads: PublicAdsConfig;
  site: Pick<SiteSettings, "announcement" | "vip_price_cents" | "vip_sol_address">;
};

/** Live Monetag zones for sensesofvoid.app. */
export const MONETAG = {
  smartlink: "https://omg10.com/4/11624273",
  popunder: { zone: "11624275", src: "https://al5sm.com/tag.min.js" },
  vignette: { zone: "11624278", src: "https://n6wxm.com/vignette.min.js" },
  push: { zone: "11624286", src: "https://nap5k.com/tag.min.js" },
} as const;

export const DEFAULT_PUBLIC_CONFIG: PublicConfig = {
  ads: {
    enabled: true,
    monetag_zone: "",
    monetag_popunder: true,
    monetag_popunder_zone: MONETAG.popunder.zone,
    monetag_inpage_push: true,
    monetag_push_zone: MONETAG.push.zone,
    monetag_vignette: true,
    monetag_vignette_zone: MONETAG.vignette.zone,
    smartlink_url: MONETAG.smartlink,
    slots: { result: true, gate: true, sticky_mobile: true, native_feed: true },
  },
  site: { announcement: "", vip_price_cents: 1900, vip_sol_address: "" },
};
