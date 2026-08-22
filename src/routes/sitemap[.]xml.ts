import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { buildSitemapXml } from "@/lib/sitemap-routes";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = buildSitemapXml();

        // Fire-and-forget: resubmits to Google Search Console only when the
        // sitemap content actually changed (route added / removed / deployed).
        try {
          const { syncSitemapWithSearchConsole } = await import("@/lib/gsc.server");
          void syncSitemapWithSearchConsole(xml).catch(() => undefined);
        } catch {
          /* Search Console not configured — serving the sitemap still works. */
        }

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
