import { createServerFn } from "@tanstack/react-start";

import { DEFAULT_ATTRIBUTION_RULES } from "@/lib/ads-intel.types";
import type {
  AttributionModel,
  AttributionReport,
  AttributionRules,
  CohortReport,
  CreativeReport,
  PixelDebugReport,
  RetargetReport,
  RetargetSegment,
  RoiDefaults,
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
  .inputValidator((input: { token: string; limit?: number; onlyPurchase?: boolean; eventId?: string }) => ({
    token: String(input?.token ?? ""),
    limit: Math.max(10, Math.min(200, Number(input?.limit ?? 60))),
    onlyPurchase: input?.onlyPurchase === true,
    eventId: String(input?.eventId ?? "").trim().slice(0, 120),
  }))
  .handler(async ({ data }): Promise<PixelDebugReport> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    const { buildPixelDebug } = await import("@/lib/ads-intel.server");
    await requireAdmin(data.token);
    return buildPixelDebug(data.limit, data.onlyPurchase, data.eventId || null);
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
  .inputValidator((input: { token: string; days?: number; rules?: Partial<AttributionRules> }) => {
    const raw = input?.rules ?? {};
    const days = Math.max(1, Math.min(90, Number(input?.days ?? 30)));
    const model = (["session", "last_touch", "first_touch"] as const).includes(
      raw.model as AttributionModel,
    )
      ? (raw.model as AttributionModel)
      : DEFAULT_ATTRIBUTION_RULES.model;
    return {
      token: String(input?.token ?? ""),
      days,
      rules: {
        days,
        model,
        lookbackDays: Math.max(1, Math.min(90, Number(raw.lookbackDays ?? 7))),
        includeOrganic: raw.includeOrganic !== false,
        requireClickId: raw.requireClickId === true,
        normalize: raw.normalize !== false,
        minSessions: Math.max(0, Math.min(10_000, Number(raw.minSessions ?? 0))),
      } satisfies AttributionRules,
    };
  })
  .handler(async ({ data }): Promise<AttributionReport> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    const { loadSessions, buildAttributionReport } = await import("@/lib/ads-intel.server");
    await requireAdmin(data.token);
    return buildAttributionReport(await loadSessions(data.days), data.days, data.rules);
  });

/** Live ROI benchmarks measured from real sessions (calculator defaults). */
export const adminRoiDefaults = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 30))),
  }))
  .handler(async ({ data }): Promise<RoiDefaults> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    const { loadSessions, buildRoiDefaults } = await import("@/lib/ads-intel.server");
    await requireAdmin(data.token);
    return buildRoiDefaults(await loadSessions(data.days), data.days);
  });

/** UTM/paid vs returning-visitor cohort revenue and funnel analytics. */
export const adminCohorts = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 30))),
  }))
  .handler(async ({ data }): Promise<CohortReport> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    const { loadSessions, buildCohortReport } = await import("@/lib/ads-intel.server");
    await requireAdmin(data.token);
    return buildCohortReport(await loadSessions(data.days), data.days);
  });
