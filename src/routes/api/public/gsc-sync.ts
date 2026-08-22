import { createFileRoute } from "@tanstack/react-router";

/**
 * Deploy / cron hook: regenerates the sitemap and resubmits it to Google
 * Search Console when its contents changed. Protected by a shared token.
 */
async function run(request: Request) {
  const expected =
    process.env["REPORT_CRON_TOKEN"] ?? process.env["ANALYTICS_ADMIN_TOKEN"] ?? "";
  const url = new URL(request.url);
  const provided =
    request.headers.get("x-report-token") ?? url.searchParams.get("token") ?? "";
  if (!expected || provided.length !== expected.length || provided !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { buildSitemapXml } = await import("@/lib/sitemap-routes");
  const { syncSitemapWithSearchConsole } = await import("@/lib/gsc.server");

  try {
    const result = await syncSitemapWithSearchConsole(buildSitemapXml(), {
      force: url.searchParams.get("force") === "1",
    });
    return new Response(JSON.stringify(result), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

export const Route = createFileRoute("/api/public/gsc-sync")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
