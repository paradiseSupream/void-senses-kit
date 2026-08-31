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
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const country = getRequestHeader("cf-ipcountry") ?? null;

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
    if (error) return { ok: false };

    // Confirmation email for this signup. Sent once per address — the row is
    // only marked after a successful send, so a failure can be retried later
    // from the admin panel.
    const { data: row } = await supabaseAdmin
      .from("email_leads")
      .select("id, welcome_sent_at")
      .eq("email", data.email)
      .maybeSingle();

    if (row && !row.welcome_sent_at) {
      let status = "sent";
      try {
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const result = await sendTemplateEmail("lead-welcome", data.email, {
          templateData: { toolSlug: data.toolSlug },
          idempotencyKey: `lead-welcome-${row.id}`,
        });
        if (!result.sent) status = result.reason;
      } catch (sendError) {
        status = `failed: ${sendError instanceof Error ? sendError.message : "unknown"}`.slice(
          0,
          200,
        );
      }
      await supabaseAdmin
        .from("email_leads")
        .update({
          welcome_status: status,
          ...(status.startsWith("failed") ? {} : { welcome_sent_at: new Date().toISOString() }),
        })
        .eq("id", row.id);
    }

    return { ok: true };
  });
