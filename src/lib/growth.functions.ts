import { createServerFn } from "@tanstack/react-start";

/**
 * Growth / virality reporting. Reads the existing `ad_events` funnel rows only
 * (referral stages, share actions, vault loop, badges) — no new tables, no new
 * tracking. Purely additive on top of the current admin analytics.
 */

export type GrowthCount = { key: string; count: number };

export type GrowthReport = {
  days: number;
  referral: { visits: number; starts: number; completes: number; shares: number };
  /** Completed referred tests / referred visits. */
  referralConversion: number;
  shares: number;
  vault: { views: number; unlockStarts: number; unlocks: number; nexts: number };
  vaultUnlockRate: number;
  topReferrers: GrowthCount[];
  topVaultPacks: GrowthCount[];
  badges: GrowthCount[];
  generatedAt: string;
};

type Row = {
  slot: string | null;
  format: string | null;
  zone: string | null;
  click_id: string | null;
};

function normalize(input: { token?: string; days?: number }) {
  return {
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 14))),
  };
}

function tally(rows: Row[], predicate: (row: Row) => boolean, keyOf: (row: Row) => string | null) {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!predicate(row)) continue;
    const key = keyOf(row);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export const adminGrowthReport = createServerFn({ method: "POST" })
  .inputValidator(normalize)
  .handler(async ({ data }): Promise<GrowthReport> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");

    const legacy = process.env["ANALYTICS_ADMIN_TOKEN"];
    if (!legacy || data.token !== legacy) await requireAdmin(data.token);

    const db = admin();
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const { data: raw, error } = await db
      .from("ad_events")
      .select("slot,format,zone,click_id")
      .eq("event_type", "funnel")
      .gte("created_at", since)
      .limit(50000);
    if (error) throw new Error(error.message);

    const rows = (raw ?? []) as Row[];
    const count = (slot: string) => rows.filter((row) => row.slot === slot).length;

    const visits = count("ref_visit");
    const completes = count("ref_complete");
    const views = count("vault_view");
    const unlocks = count("vault_unlock");

    return {
      days: data.days,
      referral: {
        visits,
        starts: count("ref_start"),
        completes,
        shares: count("ref_share"),
      },
      referralConversion: visits > 0 ? (completes / visits) * 100 : 0,
      shares: rows.filter((row) => (row.slot ?? "").startsWith("share")).length,
      vault: {
        views,
        unlockStarts: count("vault_unlock_start"),
        unlocks,
        nexts: count("vault_next"),
      },
      vaultUnlockRate: views > 0 ? (unlocks / views) * 100 : 0,
      topReferrers: tally(rows, (row) => row.zone === "referral", (row) => row.click_id ?? row.format),
      topVaultPacks: tally(rows, (row) => row.slot === "vault_unlock", (row) => row.format),
      badges: tally(rows, (row) => row.slot === "badge_earned", (row) => row.format),
      generatedAt: new Date().toISOString(),
    };
  });
