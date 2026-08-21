import { createServerFn } from "@tanstack/react-start";

import type { MonetizationStats } from "@/lib/analytics-agg";

export const getMonetizationStats = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 7))),
  }))
  .handler(async ({ data }): Promise<MonetizationStats> => {
    const { aggregate } = await import("@/lib/analytics-agg");
    const { createClient } = await import("@supabase/supabase-js");

    const expected = process.env["ANALYTICS_ADMIN_TOKEN"];
    if (!expected || data.token !== expected) throw new Error("Unauthorized");

    const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("Analytics storage is not configured.");

    const admin = createClient(url, key, { auth: { persistSession: false } });
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const { data: rows, error } = await admin
      .from("ad_events")
      .select("event_type,slot,variant,session_id,tool_slug,revenue_cents,device,utm_source,format,zone,is_vip,duration_ms,metric_value")
      .gte("created_at", since)
      .limit(50000);
    if (error) throw new Error(error.message);

    return aggregate((rows ?? []) as never, data.days);
  });
