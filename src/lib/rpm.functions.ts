import { createServerFn } from "@tanstack/react-start";

/**
 * Monetag-style RPM dashboard: ad impressions and smartlink unlocks split by
 * page type, priced with admin-editable RPM / unlock rates so estimated
 * revenue can be read per surface instead of only site-wide.
 */

export type RpmRow = {
  pageType: string;
  sessions: number;
  impressions: number;
  clicks: number;
  unlocks: number;
  /** Unlocks per 100 impressions. */
  unlockRate: number;
  estRevenueCents: number;
};

export type RpmReport = {
  days: number;
  rpmEstimateCents: number;
  unlockValueCents: number;
  rows: RpmRow[];
  totals: RpmRow;
  byDay: Array<{ day: string; impressions: number; unlocks: number; estRevenueCents: number }>;
  generatedAt: string;
};

/** Buckets a path into a reportable page type. */
export function pageTypeOf(path: string): string {
  if (!path || path === "/") return "home";
  if (path.startsWith("/tools")) return "tools";
  if (path.startsWith("/vault")) return "vault";
  if (path.startsWith("/guides")) return "guides";
  if (path.startsWith("/archetypes")) return "archetypes";
  if (path.startsWith("/challenge")) return "challenge";
  if (path.startsWith("/r/")) return "shared";
  if (path.startsWith("/vip")) return "vip";
  return "other";
}

export const adminRpmReport = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 7))),
  }))
  .handler(async ({ data }): Promise<RpmReport> => {
    const { requireAdmin, admin, readSettings } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);

    const db = admin();
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const [{ data: rows }, settings] = await Promise.all([
      db
        .from("ad_events")
        .select("event_type,path,session_id,created_at")
        .gte("created_at", since)
        .limit(50000),
      readSettings(),
    ]);

    const rpm = Math.max(0, settings.ads.rpm_estimate_cents ?? 0);
    const unlockValue = Math.max(0, settings.ads.unlock_value_cents ?? 4);
    const list = (rows ?? []) as Array<Record<string, string | null>>;

    type Bucket = { sessions: Set<string>; impressions: number; clicks: number; unlocks: number };
    const buckets = new Map<string, Bucket>();
    const days = new Map<string, { impressions: number; unlocks: number }>();

    for (const row of list) {
      const type = pageTypeOf(String(row["path"] ?? ""));
      const bucket = buckets.get(type) ?? {
        sessions: new Set<string>(),
        impressions: 0,
        clicks: 0,
        unlocks: 0,
      };
      bucket.sessions.add(String(row["session_id"] ?? ""));

      const day = String(row["created_at"] ?? "").slice(0, 10);
      const dayEntry = days.get(day) ?? { impressions: 0, unlocks: 0 };

      const event = row["event_type"];
      if (event === "impression") {
        bucket.impressions += 1;
        dayEntry.impressions += 1;
      } else if (event === "click") {
        bucket.clicks += 1;
      } else if (event === "gate_completed") {
        bucket.unlocks += 1;
        dayEntry.unlocks += 1;
      }

      buckets.set(type, bucket);
      if (day) days.set(day, dayEntry);
    }

    const price = (impressions: number, unlocks: number) =>
      Math.round((impressions / 1000) * rpm + unlocks * unlockValue);

    const reportRows: RpmRow[] = [...buckets.entries()]
      .map(([pageType, bucket]) => ({
        pageType,
        sessions: bucket.sessions.size,
        impressions: bucket.impressions,
        clicks: bucket.clicks,
        unlocks: bucket.unlocks,
        unlockRate: bucket.impressions ? (bucket.unlocks / bucket.impressions) * 100 : 0,
        estRevenueCents: price(bucket.impressions, bucket.unlocks),
      }))
      .sort((a, b) => b.estRevenueCents - a.estRevenueCents);

    const sum = (key: "sessions" | "impressions" | "clicks" | "unlocks") =>
      reportRows.reduce((total, row) => total + row[key], 0);

    const totalImpressions = sum("impressions");
    const totalUnlocks = sum("unlocks");

    return {
      days: data.days,
      rpmEstimateCents: rpm,
      unlockValueCents: unlockValue,
      rows: reportRows,
      totals: {
        pageType: "all",
        sessions: sum("sessions"),
        impressions: totalImpressions,
        clicks: sum("clicks"),
        unlocks: totalUnlocks,
        unlockRate: totalImpressions ? (totalUnlocks / totalImpressions) * 100 : 0,
        estRevenueCents: price(totalImpressions, totalUnlocks),
      },
      byDay: [...days.entries()]
        .map(([day, value]) => ({
          day,
          impressions: value.impressions,
          unlocks: value.unlocks,
          estRevenueCents: price(value.impressions, value.unlocks),
        }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      generatedAt: new Date().toISOString(),
    };
  });
