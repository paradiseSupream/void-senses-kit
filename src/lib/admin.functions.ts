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
  .inputValidator((input: { token: string; channel?: string }) => ({
    token: String(input?.token ?? ""),
    channel: ["meta", "tiktok", "google", "all"].includes(String(input?.channel))
      ? (String(input?.channel) as "meta" | "tiktok" | "google" | "all")
      : ("all" as const),
  }))
  .handler(
    async ({
      data,
    }): Promise<Array<{ channel: string; ok: boolean; detail: string }>> => {
      const { requireAdmin, readSettings } = await import("@/lib/admin-core.server");
      await requireAdmin(data.token);
      const { tracking } = await readSettings();
      const results: Array<{ channel: string; ok: boolean; detail: string }> = [];
      const want = (c: string) => data.channel === "all" || data.channel === c;

      if (want("meta")) {
        results.push({
          channel: "Meta pixel",
          ok: Boolean(tracking.meta_pixel_id),
          detail: tracking.meta_pixel_id ? "Pixel id set" : "Pixel id missing",
        });
        if (tracking.meta_pixel_id && tracking.meta_capi_token) {
          // The Events Manager "Generate access token" grants only the
          // Conversions API event-sending permission, NOT pixel-metadata
          // reads — a GET on the pixel returns "(#100) Missing Permission"
          // even for a perfectly valid token. So we validate by sending a
          // real test event (to the Test Events queue when a test code is
          // set, otherwise a single harmless ViewContent) and checking the
          // response payload Meta returns.
          try {
            const testCode = tracking.meta_test_event_code?.trim();
            const eventId = `admintest-${Date.now()}`;
            const dummyEmail =
              "6e2b3a0f5c0a7e9b1d4f8c2a5e7b3d0f1a2c4e6b8d0a2f4c6e8b0a2d4f6c8e";
            const res = await fetch(
              `https://graph.facebook.com/v20.0/${tracking.meta_pixel_id}/events?access_token=${encodeURIComponent(tracking.meta_capi_token)}`,
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  ...(testCode ? { test_event_code: testCode } : {}),
                  data: [
                    {
                      event_name: "ViewContent",
                      event_time: Math.floor(Date.now() / 1000),
                      event_id: eventId,
                      event_source_url: "https://sensesofvoid.app/",
                      action_source: "website",
                      user_data: {
                        em: [dummyEmail],
                        client_ip_address: "127.0.0.1",
                        client_user_agent: "sensesofvoid-admin-test",
                      },
                    },
                  ],
                }),
              },
            );
            const body = (await res.json()) as {
              events_received?: number;
              messages?: Array<{ description?: string }>;
              error?: { message?: string };
            };
            const ok = res.ok && typeof body.events_received === "number";
            results.push({
              channel: "Meta Conversions API",
              ok,
              detail: ok
                ? `Token valid — ${body.events_received} test event received${testCode ? " (Test Events queue)" : ""}`
                : (body.error?.message ??
                  body.messages?.[0]?.description ??
                  `HTTP ${res.status}`),
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
      }

      if (want("tiktok")) {
        results.push({
          channel: "TikTok pixel",
          ok: Boolean(tracking.tiktok_pixel_id),
          detail: tracking.tiktok_pixel_id ? "Pixel id set" : "Pixel id missing",
        });
        if (tracking.tiktok_pixel_id && tracking.tiktok_events_token) {
          try {
            // A real Events API round-trip: TikTok answers code 0 when the
            // token + pixel pair is valid.
            const res = await fetch(
              "https://business-api.tiktok.com/open_api/v1.3/event/track/",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Access-Token": tracking.tiktok_events_token,
                },
                body: JSON.stringify({
                  event_source: "web",
                  event_source_id: tracking.tiktok_pixel_id,
                  data: [
                    {
                      event: "ViewContent",
                      event_time: Math.floor(Date.now() / 1000),
                      event_id: `admin-verify-${Date.now()}`,
                      user: {},
                      page: { url: "https://sensesofvoid.app/" },
                    },
                  ],
                }),
              },
            );
            const body = (await res.json()) as { code?: number; message?: string };
            results.push({
              channel: "TikTok Events API",
              ok: body.code === 0,
              detail:
                body.code === 0
                  ? "Token valid — test event accepted"
                  : (body.message ?? `HTTP ${res.status}`),
            });
          } catch (error) {
            results.push({
              channel: "TikTok Events API",
              ok: false,
              detail: (error as Error).message,
            });
          }
        } else {
          results.push({
            channel: "TikTok Events API",
            ok: false,
            detail: "Access token missing",
          });
        }
      }

      if (want("google")) {
        const gid = tracking.google_ads_id.trim();
        const ga4 = tracking.ga4_id.trim();
        results.push({
          channel: "Google Ads",
          ok: /^AW-\d{6,}$/.test(gid),
          detail: gid
            ? /^AW-\d{6,}$/.test(gid)
              ? "Conversion id format valid"
              : "Should look like AW-123456789"
            : "Conversion id missing",
        });
        for (const [label, id] of [
          ["Google Ads tag", gid],
          ["GA4 tag", ga4],
        ] as const) {
          if (!id) {
            results.push({
              channel: label,
              ok: false,
              detail: "Not configured",
            });
            continue;
          }
          try {
            const res = await fetch(
              `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`,
            );
            const text = await res.text();
            // Google always serves the gtag runtime; a *configured* container
            // also ships tag definitions, which an unknown id does not.
            const configured = /"tags":\s*\[\s*\{/.test(text);
            results.push({
              channel: label,
              ok: res.ok && configured,
              detail: !res.ok
                ? `Google returned HTTP ${res.status}`
                : configured
                  ? "Tag served by Google — container is live and configured"
                  : `Google served the runtime but no configuration for ${id} — check the id`,
            });

          } catch (error) {
            results.push({ channel: label, ok: false, detail: (error as Error).message });
          }
        }
        results.push({
          channel: "GA4",
          ok: /^G-[A-Z0-9]{6,}$/i.test(ga4),
          detail: ga4
            ? /^G-[A-Z0-9]{6,}$/i.test(ga4)
              ? "Measurement id format valid"
              : "Should look like G-XXXXXXX"
            : "Measurement id missing",
        });
      }

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
    tracking: PublicTrackingConfig;
  }> => {
    const { readSettings } = await import("@/lib/admin-core.server");
    const { ads, site, tracking } = await readSettings();
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
      // Only public pixel ids leave the server — CAPI tokens never do.
      tracking: {
        enabled: tracking.enabled,
        meta_pixel_id: tracking.meta_pixel_id,
        tiktok_pixel_id: tracking.tiktok_pixel_id,
        google_ads_id: tracking.google_ads_id,
        google_ads_conversion_label: tracking.google_ads_conversion_label,
        ga4_id: tracking.ga4_id,
        server_side: tracking.server_side,
        require_consent: tracking.require_consent,
        retarget_monthly: tracking.retarget_monthly !== false,
      },
    };
  },
);

/* --------------------------------------------------------------- audience */

export type AudienceSession = {
  sessionId: string;
  country: string | null;
  device: string | null;
  source: string;
  utmCampaign: string | null;
  firstSeen: string;
  lastSeen: string;
  durationSec: number;
  pageviews: number;
  toolsStarted: string[];
  toolsCompleted: string[];
  resultViewed: boolean;
  isVip: boolean;
  purchasedCents: number;
  events: number;
};

export type AudienceReport = {
  totals: {
    sessions: number;
    visitors: number;
    completions: number;
    completionRate: number;
    avgDurationSec: number;
    purchases: number;
    revenueCents: number;
    conversionRate: number;
  };
  byCountry: Array<{
    country: string;
    sessions: number;
    completions: number;
    purchases: number;
    revenueCents: number;
    avgDurationSec: number;
  }>;
  bySource: Array<{ source: string; sessions: number; purchases: number; revenueCents: number }>;
  byTool: Array<{ tool: string; starts: number; completions: number; completionRate: number }>;
  buyers: Array<{
    email: string;
    plan: string;
    source: string;
    amountCents: number;
    country: string | null;
    createdAt: string;
    active: boolean;
  }>;
  sessions: AudienceSession[];
  /** Automatic data-quality audit for the capture pipeline. */
  audit: {
    rows: number;
    suspectRows: number;
    suspectRatePct: number;
    fields: Array<{
      field: string;
      covered: number;
      total: number;
      coveragePct: number;
      missing: number;
      missingRatePct: number;
      status: "good" | "warn" | "bad";
      note: string;
    }>;
  };
};

type EventRow = {
  event_type: string;
  slot: string;
  session_id: string;
  tool_slug: string | null;
  device: string | null;
  country: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  is_vip: boolean | null;
  duration_ms: number | null;
  revenue_cents: number | null;
  created_at: string;
  suspect: boolean | null;
};

/**
 * Rebuilds per-visitor sessions out of `ad_events`: where they came from,
 * which country, how long they stayed, which tools they finished and whether
 * they bought VIP.
 */
export const adminAudience = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      token: string;
      days?: number;
      country?: string;
      onlyVip?: boolean;
      full?: boolean;
    }) => ({
      token: String(input?.token ?? ""),
      days: Math.max(1, Math.min(90, Number(input?.days ?? 7))),
      country: String(input?.country ?? "").trim().toUpperCase().slice(0, 2) || undefined,
      onlyVip: Boolean(input?.onlyVip),
      full: input?.full === true,
    }),
  )
  .handler(async ({ data }): Promise<AudienceReport> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    const db = admin();
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();

    const [{ data: rows }, { data: vipRows }] = await Promise.all([
      db
        .from("ad_events")
        .select(
          "event_type,slot,session_id,tool_slug,device,country,utm_source,utm_campaign,referrer,is_vip,duration_ms,revenue_cents,created_at,suspect",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(50000),
      db
        .from("vip_members")
        .select("email,plan,source,amount_cents,active,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const hostOf = (referrer: string): string => {
      try {
        return new URL(referrer).hostname.replace(/^www\./, "");
      } catch {
        return "direct";
      }
    };

    const list = (rows ?? []) as EventRow[];
    const map = new Map<string, AudienceSession>();

    for (const row of list) {
      if (row.suspect) continue;
      const id = row.session_id;
      let s = map.get(id);
      if (!s) {
        s = {
          sessionId: id,
          country: row.country ?? null,
          device: row.device ?? null,
          source: row.utm_source ?? (row.referrer ? hostOf(row.referrer) : "direct"),
          utmCampaign: row.utm_campaign ?? null,
          firstSeen: row.created_at,
          lastSeen: row.created_at,
          durationSec: 0,
          pageviews: 0,
          toolsStarted: [],
          toolsCompleted: [],
          resultViewed: false,
          isVip: false,
          purchasedCents: 0,
          events: 0,
        };
        map.set(id, s);
      }
      s.events += 1;
      s.lastSeen = row.created_at;
      if (!s.country && row.country) s.country = row.country;
      if (!s.device && row.device) s.device = row.device;
      if (row.is_vip) s.isVip = true;
      if (row.event_type === "tool_start" && row.tool_slug && !s.toolsStarted.includes(row.tool_slug)) {
        s.toolsStarted.push(row.tool_slug);
      }
      if (
        row.event_type === "tool_complete" &&
        row.tool_slug &&
        !s.toolsCompleted.includes(row.tool_slug)
      ) {
        s.toolsCompleted.push(row.tool_slug);
      }
      if (row.event_type === "impression" || row.event_type === "heartbeat") s.pageviews += 1;
      if (row.event_type === "funnel" && row.slot === "result_view") s.resultViewed = true;
      if (row.event_type === "conversion" && (row.revenue_cents ?? 0) > 0) {
        s.purchasedCents += row.revenue_cents ?? 0;
      }
      if (row.duration_ms != null) {
        s.durationSec = Math.max(s.durationSec, Math.round(row.duration_ms / 1000));
      }
    }

    for (const s of map.values()) {
      const span = Math.round(
        (new Date(s.lastSeen).getTime() - new Date(s.firstSeen).getTime()) / 1000,
      );
      s.durationSec = Math.max(s.durationSec, Math.max(0, Math.min(7200, span)));
      s.pageviews = Math.max(1, s.pageviews);
    }

    let sessions = [...map.values()];
    if (data.country) sessions = sessions.filter((s) => s.country === data.country);
    if (data.onlyVip) sessions = sessions.filter((s) => s.isVip || s.purchasedCents > 0);
    sessions.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

    const completions = sessions.filter((s) => s.toolsCompleted.length > 0).length;
    const purchases = sessions.filter((s) => s.purchasedCents > 0).length;
    const revenueCents = sessions.reduce((sum, s) => sum + s.purchasedCents, 0);
    const totalDuration = sessions.reduce((sum, s) => sum + s.durationSec, 0);

    const group = <T>(
      key: (s: AudienceSession) => string,
      make: (k: string, list: AudienceSession[]) => T,
    ): T[] => {
      const buckets = new Map<string, AudienceSession[]>();
      for (const s of sessions) {
        const k = key(s);
        const arr = buckets.get(k) ?? [];
        arr.push(s);
        buckets.set(k, arr);
      }
      return [...buckets.entries()].map(([k, arr]) => make(k, arr));
    };


    const countries = group(
      (s) => s.country ?? "??",
      (country, arr) => ({
        country,
        sessions: arr.length,
        completions: arr.filter((s) => s.toolsCompleted.length > 0).length,
        purchases: arr.filter((s) => s.purchasedCents > 0).length,
        revenueCents: arr.reduce((sum, s) => sum + s.purchasedCents, 0),
        avgDurationSec: Math.round(arr.reduce((sum, s) => sum + s.durationSec, 0) / arr.length),
      }),
    ).sort((a, b) => b.sessions - a.sessions);

    const sources = group(
      (s) => s.source || "direct",
      (source, arr) => ({
        source,
        sessions: arr.length,
        purchases: arr.filter((s) => s.purchasedCents > 0).length,
        revenueCents: arr.reduce((sum, s) => sum + s.purchasedCents, 0),
      }),
    ).sort((a, b) => b.sessions - a.sessions);

    const toolStats = new Map<string, { starts: number; completions: number }>();
    for (const s of sessions) {
      for (const tool of s.toolsStarted) {
        const entry = toolStats.get(tool) ?? { starts: 0, completions: 0 };
        entry.starts += 1;
        toolStats.set(tool, entry);
      }
      for (const tool of s.toolsCompleted) {
        const entry = toolStats.get(tool) ?? { starts: 0, completions: 0 };
        entry.completions += 1;
        toolStats.set(tool, entry);
      }
    }

    // ---- Data accuracy audit -------------------------------------------
    const total = sessions.length;
    const suspectRows = list.filter((r) => r.suspect).length;
    const vipCount = (vipRows ?? []).length;
    const grade = (pct: number): "good" | "warn" | "bad" =>
      pct >= 95 ? "good" : pct >= 75 ? "warn" : "bad";
    const field = (
      name: string,
      covered: number,
      denom: number,
      note: string,
    ) => {
      const coveragePct = denom ? (covered / denom) * 100 : 0;
      return {
        field: name,
        covered,
        total: denom,
        coveragePct,
        missing: Math.max(0, denom - covered),
        missingRatePct: denom ? ((denom - covered) / denom) * 100 : 0,
        status: grade(denom ? coveragePct : 100),
        note,
      };
    };

    const audit = {
      rows: list.length,
      suspectRows,
      suspectRatePct: list.length ? (suspectRows / list.length) * 100 : 0,
      fields: [
        field(
          "country",
          sessions.filter((s) => s.country).length,
          total,
          "Edge header (cf-ipcountry)",
        ),
        field(
          "device",
          sessions.filter((s) => s.device).length,
          total,
          "Client device hint on each event",
        ),
        field(
          "source",
          sessions.filter((s) => s.source && s.source !== "direct").length,
          total,
          "UTM source or referrer host; 'direct' counts as unattributed",
        ),
        field(
          "dwell",
          sessions.filter((s) => s.durationSec > 0).length,
          total,
          "SessionPulse heartbeats + first/last event span",
        ),
        field(
          "purchase",
          Math.min(purchases, vipCount),
          vipCount,
          "VIP members matched by a conversion event in range",
        ),
      ],
    };

    return {
      audit,
      totals: {
        sessions: sessions.length,
        visitors: sessions.length,
        completions,
        completionRate: sessions.length ? (completions / sessions.length) * 100 : 0,
        avgDurationSec: sessions.length ? Math.round(totalDuration / sessions.length) : 0,
        purchases,
        revenueCents,
        conversionRate: sessions.length ? (purchases / sessions.length) * 100 : 0,
      },
      byCountry: countries.slice(0, 40),
      bySource: sources.slice(0, 30),
      byTool: [...toolStats.entries()]
        .map(([tool, v]) => ({
          tool,
          starts: v.starts,
          completions: v.completions,
          completionRate: v.starts ? (v.completions / v.starts) * 100 : 0,
        }))
        .sort((a, b) => b.starts - a.starts),
      buyers: ((vipRows ?? []) as Array<Record<string, unknown>>).map((row) => ({
        email: String(row["email"] ?? ""),
        plan: String(row["plan"] ?? "lifetime"),
        source: String(row["source"] ?? "manual"),
        amountCents: Number(row["amount_cents"] ?? 0),
        country: null,
        createdAt: String(row["created_at"] ?? ""),
        active: row["active"] !== false,
      })),
      sessions: sessions.slice(0, data.full ? 20000 : 300),
    };
  });

/**
 * Raw event export: streams the underlying `ad_events` rows as CSV so every
 * captured signal (country, device, source, dwell, revenue) can be analysed
 * outside the dashboard.
 */
export const adminExportEvents = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number; country?: string }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 7))),
    country: String(input?.country ?? "").trim().toUpperCase().slice(0, 2) || undefined,
  }))
  .handler(async ({ data }): Promise<{ csv: string; rows: number }> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    const { toCsv } = await import("@/lib/csv");
    await requireAdmin(data.token);

    const db = admin();
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const columns = [
      "created_at",
      "event_type",
      "slot",
      "format",
      "variant",
      "session_id",
      "tool_slug",
      "country",
      "device",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "referrer",
      "path",
      "click_id",
      "is_vip",
      "duration_ms",
      "metric_value",
      "revenue_cents",
      "suspect",
    ] as const;

    let query = db
      .from("ad_events")
      .select(columns.join(","))
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50000);
    if (data.country) query = query.eq("country", data.country);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const list = (rows ?? []) as unknown as Array<Record<string, unknown>>;
    return {
      csv: toCsv([...columns], list.map((row) => columns.map((c) => row[c]))),
      rows: list.length,
    };
  });

/** One channel's outcome from the event replay sandbox. */
export type ReplayResult = {
  channel: string;
  ok: boolean;
  detail: string;
  eventId: string;
  request: string;
  response: string;
};

/**
 * Event replay sandbox: sends a real, clearly-marked test conversion to the
 * configured Meta / TikTok server-side endpoints so an admin can confirm the
 * id + token pair works and inspect the exact provider response.
 */
export const adminReplayEvent = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      token: string;
      channel?: string;
      event?: string;
      value?: number;
      email?: string;
      testCode?: string;
    }) => ({
      token: String(input?.token ?? ""),
      channel: ["meta", "tiktok", "both"].includes(String(input?.channel))
        ? (String(input?.channel) as "meta" | "tiktok" | "both")
        : ("both" as const),
      event: ["PageView", "ViewContent", "Lead", "AddToCart", "Purchase"].includes(
        String(input?.event),
      )
        ? String(input?.event)
        : "Purchase",
      value: Math.max(0, Math.min(10_000, Number(input?.value ?? 19))),
      email: String(input?.email ?? "").trim().toLowerCase().slice(0, 120),
      testCode: String(input?.testCode ?? "").trim().slice(0, 40),
    }),
  )
  .handler(async ({ data }): Promise<ReplayResult[]> => {
    const { requireAdmin, readSettings } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    const { tracking } = await readSettings();

    const sha256 = async (value: string) => {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
      return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    const eventId = `admin-replay-${Date.now()}`;
    const now = Math.floor(Date.now() / 1000);
    const emailHash = data.email ? await sha256(data.email) : null;
    const out: ReplayResult[] = [];

    // TikTok names a couple of events differently.
    const tiktokEvent =
      data.event === "Purchase"
        ? "CompletePayment"
        : data.event === "Lead"
          ? "SubmitForm"
          : data.event === "PageView"
            ? "Pageview"
            : data.event;

    if (data.channel !== "tiktok") {
      if (!tracking.meta_pixel_id || !tracking.meta_capi_token) {
        out.push({
          channel: "Meta Conversions API",
          ok: false,
          detail: "Pixel id or access token missing",
          eventId,
          request: "",
          response: "",
        });
      } else {
        const testCode = data.testCode || tracking.meta_test_event_code;
        const payload = {
          data: [
            {
              event_name: data.event,
              event_time: now,
              event_id: eventId,
              action_source: "website",
              event_source_url: "https://sensesofvoid.app/",
              user_data: emailHash ? { em: [emailHash] } : { client_user_agent: "admin-sandbox" },
              custom_data:
                data.event === "Purchase" || data.event === "AddToCart"
                  ? { currency: "USD", value: data.value }
                  : {},
            },
          ],
          ...(testCode ? { test_event_code: testCode } : {}),
        };
        try {
          const res = await fetch(
            `https://graph.facebook.com/v20.0/${tracking.meta_pixel_id}/events?access_token=${encodeURIComponent(tracking.meta_capi_token)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );
          const body = (await res.json()) as {
            events_received?: number;
            error?: { message?: string };
          };
          out.push({
            channel: "Meta Conversions API",
            ok: res.ok && (body.events_received ?? 0) > 0,
            detail: res.ok
              ? `Accepted ${body.events_received ?? 0} event(s)${testCode ? ` — check Test Events (${testCode})` : ""}`
              : (body.error?.message ?? `HTTP ${res.status}`),
            eventId,
            request: JSON.stringify(payload, null, 2),
            response: JSON.stringify(body, null, 2),
          });
        } catch (error) {
          out.push({
            channel: "Meta Conversions API",
            ok: false,
            detail: (error as Error).message,
            eventId,
            request: JSON.stringify(payload, null, 2),
            response: "",
          });
        }
      }
    }

    if (data.channel !== "meta") {
      if (!tracking.tiktok_pixel_id || !tracking.tiktok_events_token) {
        out.push({
          channel: "TikTok Events API",
          ok: false,
          detail: "Pixel id or access token missing",
          eventId,
          request: "",
          response: "",
        });
      } else {
        const payload = {
          event_source: "web",
          event_source_id: tracking.tiktok_pixel_id,
          test_event_code: data.testCode || undefined,
          data: [
            {
              event: tiktokEvent,
              event_time: now,
              event_id: eventId,
              user: emailHash ? { email: emailHash } : {},
              page: { url: "https://sensesofvoid.app/" },
              properties:
                tiktokEvent === "CompletePayment"
                  ? { currency: "USD", value: data.value }
                  : {},
            },
          ],
        };
        try {
          const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Access-Token": tracking.tiktok_events_token,
            },
            body: JSON.stringify(payload),
          });
          const body = (await res.json()) as { code?: number; message?: string };
          out.push({
            channel: "TikTok Events API",
            ok: body.code === 0,
            detail:
              body.code === 0
                ? `"${tiktokEvent}" accepted by TikTok`
                : (body.message ?? `HTTP ${res.status}`),
            eventId,
            request: JSON.stringify(payload, null, 2),
            response: JSON.stringify(body, null, 2),
          });
        } catch (error) {
          out.push({
            channel: "TikTok Events API",
            ok: false,
            detail: (error as Error).message,
            eventId,
            request: JSON.stringify(payload, null, 2),
            response: "",
          });
        }
      }
    }

    const { logTrackingEvents } = await import("@/lib/tracking-log.server");
    await logTrackingEvents(
      out.map((row) => ({
        channel: row.channel.startsWith("Meta") ? ("meta" as const) : ("tiktok" as const),
        source: "sandbox" as const,
        event: data.event,
        ok: row.ok,
        detail: row.detail,
        eventId: row.eventId,
      })),
    );

    return out;
  });

/** Real-time tracking delivery health for the admin monitor. */
export type TrackingMonitor = {
  windowHours: number;
  totals: Array<{ channel: string; sent: number; failed: number; successRate: number }>;
  series: Array<{ bucket: string; meta: number; tiktok: number; ga4: number; google_ads: number }>;
  latest: Array<{
    at: string;
    channel: string;
    source: string;
    event: string;
    ok: boolean;
    status: number | null;
    detail: string | null;
    eventId: string | null;
    country: string | null;
  }>;
  failures: Array<{ at: string; channel: string; event: string; status: number | null; detail: string | null; country: string | null }>;
  /** Delivery split by visitor country, best first. */
  countries: Array<{ country: string; sent: number; failed: number; successRate: number }>;
};

export const adminTrackingMonitor = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; hours?: number }) => ({
    token: String(input?.token ?? ""),
    hours: [1, 6, 24, 72].includes(Number(input?.hours)) ? Number(input?.hours) : 24,
  }))
  .handler(async ({ data }): Promise<TrackingMonitor> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    const since = new Date(Date.now() - data.hours * 3600_000).toISOString();

    const { data: rows, error } = await admin()
      .from("tracking_events")
      .select("created_at, channel, source, event, ok, status, detail, event_id, country")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);

    type Row = {
      created_at: string;
      channel: string;
      source: string;
      event: string;
      ok: boolean;
      status: number | null;
      detail: string | null;
      event_id: string | null;
      country: string | null;
    };
    const list = (rows ?? []) as Row[];

    const channels = ["meta", "tiktok", "ga4", "google_ads"] as const;
    const totals = channels.map((channel) => {
      const scoped = list.filter((row) => row.channel === channel);
      const failed = scoped.filter((row) => !row.ok).length;
      return {
        channel,
        sent: scoped.length,
        failed,
        successRate: scoped.length > 0 ? ((scoped.length - failed) / scoped.length) * 100 : 0,
      };
    });

    // Bucket by hour (or by 10 minutes for the 1-hour window).
    const bucketMs = data.hours <= 1 ? 10 * 60_000 : 3600_000;
    const buckets = new Map<
      number,
      { meta: number; tiktok: number; ga4: number; google_ads: number }
    >();
    const start = Math.floor((Date.now() - data.hours * 3600_000) / bucketMs) * bucketMs;
    for (let t = start; t <= Date.now(); t += bucketMs) {
      buckets.set(t, { meta: 0, tiktok: 0, ga4: 0, google_ads: 0 });
    }
    for (const row of list) {
      const key = Math.floor(new Date(row.created_at).getTime() / bucketMs) * bucketMs;
      const slot = buckets.get(key);
      if (!slot) continue;
      if (row.channel in slot) slot[row.channel as keyof typeof slot] += 1;
    }

    const series = [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([time, counts]) => ({ bucket: new Date(time).toISOString(), ...counts }));

    return {
      windowHours: data.hours,
      totals,
      series,
      latest: list.slice(0, 40).map((row) => ({
        at: row.created_at,
        channel: row.channel,
        source: row.source,
        event: row.event,
        ok: row.ok,
        status: row.status,
        detail: row.detail,
        eventId: row.event_id,
        country: row.country,
      })),
      failures: list
        .filter((row) => !row.ok)
        .slice(0, 25)
        .map((row) => ({
          at: row.created_at,
          channel: row.channel,
          event: row.event,
          status: row.status,
          detail: row.detail,
          country: row.country,
      })),
      countries: (() => {
        const map = new Map<string, { sent: number; failed: number }>();
        for (const row of list) {
          const key = row.country ?? "??";
          const stat = map.get(key) ?? { sent: 0, failed: 0 };
          stat.sent += 1;
          if (!row.ok) stat.failed += 1;
          map.set(key, stat);
        }
        return [...map.entries()]
          .map(([country, stat]) => ({
            country,
            sent: stat.sent,
            failed: stat.failed,
            successRate: stat.sent > 0 ? ((stat.sent - stat.failed) / stat.sent) * 100 : 0,
          }))
          .sort((a, b) => b.sent - a.sent)
          .slice(0, 12);
      })(),
    };
  });

/* ----------------------------------------------------------------- apple pay */

export type ApplePayDomainResult = {
  url: string;
  status: number;
  ok: boolean;
  contentType: string;
  bodyPreview: string;
  hasPspId: boolean;
};

export type ApplePayCheckResult = {
  checkedAt: string;
  results: ApplePayDomainResult[];
  allOk: boolean;
};

const APPLE_PAY_PATH = "/.well-known/apple-developer-merchantid-domain-association";

export const adminCheckApplePay = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({
    token: String(input?.token ?? ""),
  }))
  .handler(async ({ data }): Promise<ApplePayCheckResult> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);

    const urls = [
      "https://sensesofvoid.app",
      "https://www.sensesofvoid.app",
      `http://localhost:8080`,
    ];

    const results: ApplePayDomainResult[] = [];
    for (const base of urls) {
      const url = base + APPLE_PAY_PATH;
      try {
        const res = await fetch(url, { redirect: "follow" });
        const text = await res.text();
        results.push({
          url,
          status: res.status,
          ok: res.status === 200,
          contentType: res.headers.get("content-type") ?? "",
          bodyPreview: text.slice(0, 300),
          hasPspId: text.includes("pspId"),
        });
      } catch (err) {
        results.push({
          url,
          status: 0,
          ok: false,
          contentType: "",
          bodyPreview: String(err instanceof Error ? err.message : err),
          hasPspId: false,
        });
      }
    }

    return {
      checkedAt: new Date().toISOString(),
      results,
      allOk: results.every((r) => r.ok && r.hasPspId),
    };
  });
