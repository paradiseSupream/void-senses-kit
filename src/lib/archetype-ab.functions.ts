import { createServerFn } from "@tanstack/react-start";

import { ARCHETYPE_ARMS, pickArm, type ArchetypeArm, type ArmStat } from "@/lib/archetype-ab";

export type ArmStatsResult = { stats: ArmStat[]; refreshedAt: string };

let cache: { at: number; stats: ArmStat[] } | null = null;
const TTL_MS = 10 * 60 * 1000;

/** Reads hero view / CTA click counts per archetype page and arm. */
async function loadStats(): Promise<ArmStat[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.stats;
  try {
    const { admin } = await import("@/lib/admin-core.server");
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { data, error } = await admin()
      .from("ad_events")
      .select("slot,zone,format")
      .in("slot", ["arch_hero_view", "arch_cta_click"])
      .gte("created_at", since)
      .limit(50000);
    if (error) throw new Error(error.message);
    const map = new Map<string, ArmStat>();
    for (const row of (data ?? []) as Array<Record<string, string | null>>) {
      const slug = row["zone"] ?? "";
      const arm = (row["format"] ?? "") as ArchetypeArm;
      if (!slug || !(ARCHETYPE_ARMS as readonly string[]).includes(arm)) continue;
      const key = `${slug}:${arm}`;
      const entry = map.get(key) ?? { slug, arm, views: 0, clicks: 0 };
      if (row["slot"] === "arch_hero_view") entry.views += 1;
      else entry.clicks += 1;
      map.set(key, entry);
    }
    const stats = [...map.values()];
    cache = { at: Date.now(), stats };
    return stats;
  } catch {
    // Never let analytics break a public landing page.
    cache = { at: Date.now(), stats: [] };
    return [];
  }
}

/** Public: resolves the live arm for one archetype page (SSR-safe). */
export const getArchetypeArm = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input?.slug ?? "") }))
  .handler(async ({ data }): Promise<{ arm: ArchetypeArm; reason: "winner" | "rotation" }> => {
    const stats = await loadStats();
    return pickArm(data.slug, stats);
  });

/** Admin: full arm table for the dashboard. */
export const getArchetypeArmStats = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: String(input?.token ?? "") }))
  .handler(async ({ data }): Promise<ArmStatsResult> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    cache = null;
    return { stats: await loadStats(), refreshedAt: new Date().toISOString() };
  });
