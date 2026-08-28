export type FormatCaps = { perHour: number; perSession: number };

export type AdCapSettings = {
  popunder: FormatCaps;
  vignette: FormatCaps;
  inpage_push: FormatCaps;
};

export type PrivacySettings = {
  consent_required: boolean;
  banner_text: string;
  block_until_consent: boolean;
};

export type AdsSettings = {
  enabled: boolean;
  /** Safety switch: only Free Vault + smartlink surfaces, no third-party scripts. */
  lean_mode: boolean;
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
  /** Adsterra Social Bar (third-party script, high RPM sticky bar). */
  adsterra_social_bar: boolean;
  adsterra_social_bar_src: string;
  slots: { result: boolean; gate: boolean; sticky_mobile: boolean; sticky_desktop: boolean; native_feed: boolean };
  caps: AdCapSettings;
  privacy: PrivacySettings;
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
  | "lean_mode"
  | "monetag_zone"
  | "monetag_popunder"
  | "monetag_popunder_zone"
  | "monetag_inpage_push"
  | "monetag_push_zone"
  | "monetag_vignette"
  | "monetag_vignette_zone"
  | "smartlink_url"
  | "adsterra_social_bar"
  | "adsterra_social_bar_src"
  | "slots"
  | "caps"
  | "privacy"
>;

/**
 * Advertising / analytics tracking configuration, editable from the admin
 * panel. Pixel ids are public by design; the CAPI tokens are secrets and are
 * never returned to the browser.
 */
export type TrackingSettings = {
  enabled: boolean;
  meta_pixel_id: string;
  meta_capi_token: string;
  meta_test_event_code: string;
  tiktok_pixel_id: string;
  tiktok_events_token: string;
  google_ads_id: string;
  google_ads_conversion_label: string;
  ga4_id: string;
  /** Send conversions server-side (Conversions API / Events API). */
  server_side: boolean;
  /** Fire pixels only after the visitor accepts advertising consent. */
  require_consent: boolean;
  /** Show the $2.99 monthly pass to returning non-buyers (retargeting). */
  retarget_monthly: boolean;
};

export type PublicTrackingConfig = Pick<
  TrackingSettings,
  | "enabled"
  | "meta_pixel_id"
  | "tiktok_pixel_id"
  | "google_ads_id"
  | "google_ads_conversion_label"
  | "ga4_id"
  | "server_side"
  | "require_consent"
  | "retarget_monthly"
>;

export const DEFAULT_TRACKING: TrackingSettings = {
  enabled: true,
  meta_pixel_id: "",
  meta_capi_token: "",
  meta_test_event_code: "",
  tiktok_pixel_id: "",
  tiktok_events_token: "",
  google_ads_id: "",
  google_ads_conversion_label: "",
  ga4_id: "",
  server_side: true,
  require_consent: true,
  retarget_monthly: true,
};

export const DEFAULT_PUBLIC_TRACKING: PublicTrackingConfig = {
  enabled: true,
  meta_pixel_id: "",
  tiktok_pixel_id: "",
  google_ads_id: "",
  google_ads_conversion_label: "",
  ga4_id: "",
  server_side: true,
  require_consent: true,
  retarget_monthly: true,
};

export type PublicConfig = {
  ads: PublicAdsConfig;
  site: Pick<SiteSettings, "announcement" | "vip_price_cents" | "vip_sol_address">;
  tracking: PublicTrackingConfig;
};

/** Live Monetag zones for sensesofvoid.app. */
export const MONETAG = {
  smartlink: "https://omg10.com/4/11624273",
  popunder: { zone: "11624275", src: "https://al5sm.com/tag.min.js" },
  vignette: { zone: "11624278", src: "https://n6wxm.com/vignette.min.js" },
  push: { zone: "11624286", src: "https://nap5k.com/tag.min.js" },
} as const;

/** Live Adsterra placements for sensesofvoid.app. */
export const ADSTERRA = {
  social_bar:
    "https://pl30960638.profitableratecpmnetwork.com/68/e2/ce/68e2ce9955813c71eea7a3705a5d4a1e.js",
} as const;

/**
 * Balanced caps: intrusive formats stay rare (so bounce rate stays low and
 * sessions run long), while the high-RPM first-party surfaces — smartlink
 * gate, sticky anchor, result native cards — carry the revenue.
 */
export const DEFAULT_CAPS: AdCapSettings = {
  popunder: { perHour: 1, perSession: 1 },
  vignette: { perHour: 1, perSession: 1 },
  inpage_push: { perHour: 1, perSession: 1 },
};

export const DEFAULT_PRIVACY: PrivacySettings = {
  consent_required: true,
  block_until_consent: true,
  banner_text:
    "We use essential storage to remember your preferences, and advertising cookies to keep the tools free.",
};

export const DEFAULT_PUBLIC_CONFIG: PublicConfig = {
  ads: {
    enabled: true,
    lean_mode: false,
    monetag_zone: "",
    monetag_popunder: true,
    monetag_popunder_zone: MONETAG.popunder.zone,
    monetag_inpage_push: true,
    monetag_push_zone: MONETAG.push.zone,
    monetag_vignette: true,
    monetag_vignette_zone: MONETAG.vignette.zone,
    smartlink_url: MONETAG.smartlink,
    adsterra_social_bar: false,
    adsterra_social_bar_src: ADSTERRA.social_bar,
    slots: { result: true, gate: true, sticky_mobile: true, sticky_desktop: true, native_feed: true },
    caps: DEFAULT_CAPS,
    privacy: DEFAULT_PRIVACY,
  },
  site: {
    announcement: "",
    vip_price_cents: 1900,
    vip_sol_address: "8y9Bo4hHAead7VnkbMEMBUgwxSUMBZzPDKodE1PFs9vP",
  },
  tracking: DEFAULT_PUBLIC_TRACKING,
};
