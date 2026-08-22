import { createServerFn } from "@tanstack/react-start";

/**
 * Email capture for the return-visit loop. Anonymous, single field, no auth —
 * the cheapest way to turn a one-shot quiz visitor into repeat traffic we do
 * not have to buy twice.
 */
export const subscribeLead = createServerFn({ method: "POST" })
  .inputValidator((input: {
    email: string;
    source?: string;
    toolSlug?: string | null;
    sessionId?: string | null;
    utmSource?: string | null;
  }) => ({
    email: String(input?.email ?? "").trim().toLowerCase().slice(0, 200),
    source: String(input?.source ?? "result").slice(0, 40),
    toolSlug: input?.toolSlug ? String(input.toolSlug).slice(0, 60) : null,
    sessionId: input?.sessionId ? String(input.sessionId).slice(0, 80) : null,
    utmSource: input?.utmSource ? String(input.utmSource).slice(0, 80) : null,
  }))
  .handler(async ({ data, request }): Promise<{ ok: boolean }> => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const country =
      request?.headers.get("cf-ipcountry") ?? request?.headers.get("x-vercel-ip-country") ?? null;

    const { error } = await supabaseAdmin.from("email_leads").upsert(
      {
        email: data.email,
        source: data.source,
        tool_slug: data.toolSlug,
        session_id: data.sessionId,
        utm_source: data.utmSource,
        country,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
    return { ok: !error };
  });
