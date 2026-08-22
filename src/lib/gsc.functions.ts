import { createServerFn } from "@tanstack/react-start";

import type { SearchConsoleSnapshot } from "@/lib/gsc.server";

export type GscResult =
  | { status: "ok"; snapshot: SearchConsoleSnapshot }
  | { status: "selection_required"; candidates: string[] }
  | { status: "error"; message: string };

export const gscSnapshot = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; siteUrl?: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    siteUrl: input?.siteUrl ? String(input.siteUrl) : undefined,
    days: Math.max(7, Math.min(90, Number(input?.days ?? 28))),
  }))
  .handler(async ({ data }): Promise<GscResult> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    try {
      const { getSearchConsoleSnapshot } = await import("@/lib/gsc.server");
      const result = await getSearchConsoleSnapshot(data.siteUrl, data.days);
      if ("status" in result && result.status === "selection_required") {
        return { status: "selection_required", candidates: result.candidates };
      }
      return { status: "ok", snapshot: result as SearchConsoleSnapshot };
    } catch (error) {
      return { status: "error", message: (error as Error).message };
    }
  });

export const gscResubmitSitemap = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; force?: boolean }) => ({
    token: String(input?.token ?? ""),
    force: Boolean(input?.force ?? true),
  }))
  .handler(async ({ data }): Promise<{ submitted: boolean; reason: string; message: string }> => {
    const { requireAdmin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    try {
      const { buildSitemapXml } = await import("@/lib/sitemap-routes");
      const { syncSitemapWithSearchConsole } = await import("@/lib/gsc.server");
      const result = await syncSitemapWithSearchConsole(buildSitemapXml(), { force: data.force });
      return {
        submitted: result.submitted,
        reason: result.reason,
        message: result.submitted
          ? "Sitemap resubmitted to Google Search Console."
          : result.reason === "unchanged"
            ? "Sitemap unchanged since the last submission."
            : "Search Console is not connected.",
      };
    } catch (error) {
      return { submitted: false, reason: "error", message: (error as Error).message };
    }
  });
