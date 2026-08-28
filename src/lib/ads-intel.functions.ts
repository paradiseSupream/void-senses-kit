import { createServerFn } from "@tanstack/react-start";

import type {
  AttributionReport,
  CreativeReport,
  PixelDebugReport,
  RetargetReport,
  RetargetSegment,
} from "@/lib/ads-intel.types";

/** Creative-level A/B report: VIP conversion per FB ad creative. */
export const adminCreativeTests = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number; minSample?: number }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 14))),
    minSample: Math.max(10, Math.min(5000, Number(input?.minSample ?? 50))),
  }))
  .handler(async ({ data }): Promise<CreativeReport> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    const { loadSessions, buildCreativeReport } = await import("@/lib/ads-intel.server");
    await requireAdmin(data.token);
    return buildCreativeReport(await loadSessions(data.days), data.days, data.minSample);
  });

/** Live Meta Pixel / CAPI debug feed with de-duplication status. */
export const adminPixelDebug = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; limit?: number; onlyPurchase?: boolean }) => ({
    token: String(input?.token ?? ""),
    limit: Math.max(10, Math.min(200, Number(input?.limit ?? 60))),
    onlyPurchase: input?.onlyPurchase === true,
  }))
  .handler(async ({ data }): Promise<PixelDebugReport> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    const { buildPixelDebug } = await import("@/lib/ads-intel.server");
    await requireAdmin(data.token);
    return buildPixelDebug(data.limit, data.onlyPurchase);
  });

/** Retargeting audiences built from quiz completion and checkout intent. */
export const adminRetargetAudiences = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 30))),
  }))
  .handler(async ({ data }): Promise<RetargetReport> => {
    const { requireAdmin, readSettings } = await import("@/lib/admin-core.server");
    const { loadSessions, buildRetargetReport } = await import("@/lib/ads-intel.server");
    await requireAdmin(data.token);
    const settings = await readSettings();
    return buildRetargetReport(
      await loadSessions(data.days),
      data.days,
      settings.tracking.retarget_monthly === true,
    );
  });

/** CSV export of one retargeting segment for a custom-audience upload. */
export const adminRetargetCsv = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number; segment: string }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 30))),
    segment: String(input?.segment ?? "quiz_completers") as RetargetSegment["key"],
  }))
  .handler(async ({ data }): Promise<{ csv: string; rows: number }> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    const { loadSessions, segmentCsv } = await import("@/lib/ads-intel.server");
    await requireAdmin(data.token);
    return segmentCsv(await loadSessions(data.days), data.segment);
  });

/** Revenue by UTM / click id plus landing-to-Purchase drop-off. */
export const adminAttribution = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 30))),
  }))
  .handler(async ({ data }): Promise<AttributionReport> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    const { loadSessions, buildAttributionReport } = await import("@/lib/ads-intel.server");
    await requireAdmin(data.token);
    return buildAttributionReport(await loadSessions(data.days), data.days);
  });
