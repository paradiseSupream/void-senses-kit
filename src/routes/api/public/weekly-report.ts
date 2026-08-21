import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron endpoint: generates and stores the weekly ad-performance report.
 * Protected by a shared token — callers must send `x-report-token`.
 */
function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

async function run(request: Request) {
  const expected =
    process.env["REPORT_CRON_TOKEN"] ?? process.env["ANALYTICS_ADMIN_TOKEN"] ?? "";
  const provided =
    request.headers.get("x-report-token") ??
    new URL(request.url).searchParams.get("token") ??
    "";
  if (!expected || provided.length !== expected.length || provided !== expected) {
    return unauthorized();
  }

  const { generateWeeklyReport } = await import("@/lib/weekly-report.server");
  const { readSettings } = await import("@/lib/admin-core.server");
  const { ads } = await readSettings();
  const report = await generateWeeklyReport(ads.rpm_estimate_cents);

  return new Response(JSON.stringify(report), {
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/weekly-report")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
