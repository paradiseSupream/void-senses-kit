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
  slots: { result: boolean; gate: boolean; sticky_mobile: boolean; native_feed: boolean };
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

/** Live Adsterra placements for sensesofvoid.app. */
export const ADSTERRA = {
  social_bar:
    "https://pl30960638.profitableratecpmnetwork.com/68/e2/ce/68e2ce9955813c71eea7a3705a5d4a1e.js",
} as const;

export const DEFAULT_CAPS: AdCapSettings = {
  popunder: { perHour: 4, perSession: 3 },
  vignette: { perHour: 8, perSession: 6 },
  inpage_push: { perHour: 12, perSession: 10 },
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
    adsterra_social_bar: true,
    adsterra_social_bar_src: ADSTERRA.social_bar,
    slots: { result: true, gate: true, sticky_mobile: true, native_feed: true },
    caps: DEFAULT_CAPS,
    privacy: DEFAULT_PRIVACY,
  },
  site: {
    announcement: "",
    vip_price_cents: 1900,
    vip_sol_address: "8y9Bo4hHAead7VnkbMEMBUgwxSUMBZzPDKodE1PFs9vP",
  },
};
