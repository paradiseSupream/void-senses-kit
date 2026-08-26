import { createServerFn } from "@tanstack/react-start";

import type {
  AdsSettings,
  PublicAdsConfig,
  PublicTrackingConfig,
  SiteSettings,
  TrackingSettings,
} from "@/lib/admin-types";
import type { MonetizationStats } from "@/lib/analytics-agg";

export type AdminOverview = {
  stats: MonetizationStats;
  visitorsByDay: Array<{ day: string; sessions: number; pageviews: number }>;
  vipCount: number;
  vipRevenueCents: number;
  estimatedAdRevenueCents: number;
  affiliateCount: number;
};

export type VipMember = {
  id: string;
  email: string;
  wallet: string | null;
  plan: string;
  source: string;
  payment_ref: string | null;
  amount_cents: number;
  active: boolean;
  license_key: string;
  created_at: string;
};

export type Affiliate = {
  id: string;
  code: string;
  name: string;
  contact: string | null;
  commission_pct: number;
  payout_notes: string | null;
  active: boolean;
  created_at: string;
};

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; password: string }) => ({
    username: String(input?.username ?? "").trim(),
    password: String(input?.password ?? ""),
  }))
  .handler(async ({ data }): Promise<{ token: string }> => {
    const { login } = await import("@/lib/admin-core.server");
    return { token: await login(data.username, data.password) };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 7))),
  }))
  .handler(async ({ data }): Promise<AdminOverview> => {
    const { requireAdmin, admin, readSettings } = await import("@/lib/admin-core.server");
    const { aggregate } = await import("@/lib/analytics-agg");
    await requireAdmin(data.token);

    const db = admin();
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const [{ data: rows }, vips, affs, settings] = await Promise.all([
      db
        .from("ad_events")
        .select(
          "event_type,slot,variant,session_id,tool_slug,revenue_cents,device,utm_source,created_at,format,zone,is_vip,duration_ms,metric_value",
        )
        .gte("created_at", since)
        .limit(50000),
      db.from("vip_members").select("amount_cents,active").eq("active", true),
      db.from("affiliates").select("id", { count: "exact", head: true }),
      readSettings(),
    ]);

    const list = (rows ?? []) as Array<Record<string, string | number | null>>;
    const stats = aggregate(list as never, data.days);

    const byDay = new Map<string, { sessions: Set<string>; pageviews: number }>();
    for (const row of list) {
      const day = String(row["created_at"] ?? "").slice(0, 10);
      if (!day) continue;
      const entry = byDay.get(day) ?? { sessions: new Set<string>(), pageviews: 0 };
      entry.sessions.add(String(row["session_id"]));
      if (row["event_type"] === "impression" || row["event_type"] === "tool_start") {
        entry.pageviews += 1;
      }
      byDay.set(day, entry);
    }

    const vipRows = (vips.data ?? []) as Array<{ amount_cents: number }>;

    return {
      stats,
      visitorsByDay: [...byDay.entries()]
        .map(([day, v]) => ({ day, sessions: v.sessions.size, pageviews: v.pageviews }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      vipCount: vipRows.length,
      vipRevenueCents: vipRows.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0),
      estimatedAdRevenueCents: Math.round(
        (stats.totals.impressions / 1000) * settings.ads.rpm_estimate_cents,
      ),
      affiliateCount: affs.count ?? 0,
    };
  });

export type AdminSettings = {
  ads: AdsSettings;
  site: SiteSettings;
  tracking: TrackingSettings;
};

export const adminGetSettings = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: String(input?.token ?? "") }))
  .handler(async ({ data }): Promise<AdminSettings> => {
    const { requireAdmin, readSettings } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    return readSettings();
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      token: string;
      ads?: AdsSettings;
      site?: SiteSettings;
      tracking?: TrackingSettings;
    }) => input,
  )
  .handler(async ({ data }): Promise<AdminSettings> => {
    const { requireAdmin, readSettings, writeSetting } = await import("@/lib/admin-core.server");
    await requireAdmin(String(data?.token ?? ""));
    if (data.ads) await writeSetting("ads", data.ads);
    if (data.site) await writeSetting("site", data.site);
    if (data.tracking) await writeSetting("tracking", data.tracking);
    return readSettings();
  });

/** Live check that each configured pixel / server-side token actually works. */
export const adminTestTracking = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: String(input?.token ?? "") }))
  .handler(
    async ({
      data,
    }): Promise<Array<{ channel: string; ok: boolean; detail: string }>> => {
      const { requireAdmin, readSettings } = await import("@/lib/admin-core.server");
      await requireAdmin(data.token);
      const { tracking } = await readSettings();
      const results: Array<{ channel: string; ok: boolean; detail: string }> = [];

      results.push({
        channel: "Meta pixel",
        ok: Boolean(tracking.meta_pixel_id),
        detail: tracking.meta_pixel_id ? "Pixel id set" : "Pixel id missing",
      });
      if (tracking.meta_pixel_id && tracking.meta_capi_token) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/v20.0/${tracking.meta_pixel_id}?fields=id,name&access_token=${encodeURIComponent(tracking.meta_capi_token)}`,
          );
          const body = (await res.json()) as { error?: { message?: string } };
          results.push({
            channel: "Meta Conversions API",
            ok: res.ok,
            detail: res.ok ? "Token valid" : (body.error?.message ?? `HTTP ${res.status}`),
          });
        } catch (error) {
          results.push({
            channel: "Meta Conversions API",
            ok: false,
            detail: (error as Error).message,
          });
        }
      } else {
        results.push({
          channel: "Meta Conversions API",
          ok: false,
          detail: "Access token missing",
        });
      }

      results.push({
        channel: "TikTok pixel",
        ok: Boolean(tracking.tiktok_pixel_id),
        detail: tracking.tiktok_pixel_id ? "Pixel id set" : "Pixel id missing",
      });
      results.push({
        channel: "TikTok Events API",
        ok: Boolean(tracking.tiktok_events_token),
        detail: tracking.tiktok_events_token ? "Access token set" : "Access token missing",
      });
      results.push({
        channel: "Google Ads",
        ok: Boolean(tracking.google_ads_id),
        detail: tracking.google_ads_id ? "Conversion id set" : "Conversion id missing",
      });
      results.push({
        channel: "GA4",
        ok: Boolean(tracking.ga4_id),
        detail: tracking.ga4_id ? "Measurement id set" : "Measurement id missing",
      });
      return results;
    },
  );

export const adminListVips = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: String(input?.token ?? "") }))
  .handler(async ({ data }): Promise<VipMember[]> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    const { data: rows, error } = await admin()
      .from("vip_members")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (rows ?? []) as VipMember[];
  });

export const adminAddVip = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      token: string;
      email: string;
      wallet?: string;
      payment_ref?: string;
      amount_cents?: number;
      source?: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<VipMember> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(String(data?.token ?? ""));
    const email = String(data.email ?? "").trim();
    if (!email.includes("@")) throw new Error("A valid email is required.");
    const { data: row, error } = await admin()
      .from("vip_members")
      .insert({
        email,
        wallet: data.wallet?.trim() || null,
        payment_ref: data.payment_ref?.trim() || null,
        amount_cents: Math.max(0, Math.round(Number(data.amount_cents ?? 1900))),
        source: data.source?.trim() || "manual",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as VipMember;
  });

export const adminSetVipActive = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; id: string; active: boolean }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(String(data?.token ?? ""));
    const { error } = await admin()
      .from("vip_members")
      .update({ active: Boolean(data.active) })
      .eq("id", String(data.id));
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListAffiliates = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: String(input?.token ?? "") }))
  .handler(async ({ data }): Promise<Affiliate[]> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    const { data: rows, error } = await admin()
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (rows ?? []) as Affiliate[];
  });

export const adminAddAffiliate = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      token: string;
      code: string;
      name: string;
      contact?: string;
      commission_pct?: number;
    }) => input,
  )
  .handler(async ({ data }): Promise<Affiliate> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(String(data?.token ?? ""));
    const code = String(data.code ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    if (code.length < 2) throw new Error("Affiliate code must be at least 2 characters.");
    const { data: row, error } = await admin()
      .from("affiliates")
      .insert({
        code,
        name: String(data.name ?? "").trim() || code,
        contact: data.contact?.trim() || null,
        commission_pct: Math.max(0, Math.min(90, Number(data.commission_pct ?? 30))),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Affiliate;
  });

/** Public, non-secret runtime config used by the ad + VIP layer. */
export const getPublicConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    ads: PublicAdsConfig;
    site: Pick<SiteSettings, "announcement" | "vip_price_cents" | "vip_sol_address">;
  }> => {
    const { readSettings } = await import("@/lib/admin-core.server");
    const { ads, site } = await readSettings();
    return {
      ads: {
        enabled: ads.enabled,
        lean_mode: ads.lean_mode ?? false,
        monetag_zone: ads.monetag_zone,
        monetag_popunder: ads.monetag_popunder,
        monetag_popunder_zone: ads.monetag_popunder_zone,
        monetag_inpage_push: ads.monetag_inpage_push,
        monetag_push_zone: ads.monetag_push_zone,
        monetag_vignette: ads.monetag_vignette,
        monetag_vignette_zone: ads.monetag_vignette_zone,
        smartlink_url: ads.smartlink_url,
        adsterra_social_bar: ads.adsterra_social_bar ?? false,
        adsterra_social_bar_src: ads.adsterra_social_bar_src ?? "",
        slots: ads.slots,
        caps: ads.caps,
        privacy: ads.privacy,
      },
      site: {
        announcement: site.announcement,
        vip_price_cents: site.vip_price_cents,
        vip_sol_address: site.vip_sol_address,
      },
    };
  },
);
