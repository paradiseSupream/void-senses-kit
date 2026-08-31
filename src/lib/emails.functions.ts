import { createServerFn } from "@tanstack/react-start";

export type LeadRow = {
  id: string;
  email: string;
  source: string;
  tool_slug: string | null;
  country: string | null;
  utm_source: string | null;
  created_at: string;
  welcome_sent_at: string | null;
  welcome_status: string | null;
};

export type EmailLogRow = {
  timestamp: string;
  recipient: string;
  event_type: string;
  status: string | null;
};

export type EmailsReport = {
  totalLeads: number;
  welcomed: number;
  pending: number;
  failed: number;
  leads: LeadRow[];
  logs: EmailLogRow[];
  logsError: string | null;
};

/** Operator view: who signed up and whether their welcome email went out. */
export const adminEmailsReport = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; days?: number }) => ({
    token: String(input?.token ?? ""),
    days: Math.max(1, Math.min(90, Number(input?.days ?? 14))),
  }))
  .handler(async ({ data }): Promise<EmailsReport> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);

    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const db = admin();

    const { data: leads } = await db
      .from("email_leads")
      .select(
        "id, email, source, tool_slug, country, utm_source, created_at, welcome_sent_at, welcome_status",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(300);

    const rows = (leads ?? []) as LeadRow[];

    let logs: EmailLogRow[] = [];
    let logsError: string | null = null;
    try {
      const { listEmailLogs } = await import("@lovable.dev/email-js");
      const apiKey = process.env["LOVABLE_API_KEY"];
      if (!apiKey) throw new Error("Email API key is not configured");
      const result = await listEmailLogs({ since, limit: 100 }, { apiKey });
      logs = result.data.map((event) => ({
        timestamp: event.timestamp,
        recipient: event.recipient,
        event_type: event.event_type,
        status: event.status ?? null,
      }));
    } catch (error) {
      logsError = error instanceof Error ? error.message : "Could not load delivery logs";
    }

    return {
      totalLeads: rows.length,
      welcomed: rows.filter((row) => Boolean(row.welcome_sent_at)).length,
      pending: rows.filter((row) => !row.welcome_sent_at && !row.welcome_status).length,
      failed: rows.filter((row) => (row.welcome_status ?? "").startsWith("failed")).length,
      leads: rows,
      logs,
      logsError,
    };
  });

/** Retries the welcome email for leads whose first attempt failed. */
export const adminRetryWelcomeEmails = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: String(input?.token ?? "") }))
  .handler(async ({ data }): Promise<{ retried: number; sent: number }> => {
    const { requireAdmin, admin } = await import("@/lib/admin-core.server");
    await requireAdmin(data.token);
    const db = admin();

    const { data: leads } = await db
      .from("email_leads")
      .select("id, email, tool_slug")
      .is("welcome_sent_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    const rows = (leads ?? []) as Array<{ id: string; email: string; tool_slug: string | null }>;
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    let sent = 0;

    for (const row of rows) {
      let status = "sent";
      try {
        const result = await sendTemplateEmail("lead-welcome", row.email, {
          templateData: { toolSlug: row.tool_slug },
          idempotencyKey: `lead-welcome-${row.id}`,
        });
        if (result.sent) sent += 1;
        else status = result.reason;
      } catch (error) {
        status = `failed: ${error instanceof Error ? error.message : "unknown"}`.slice(0, 200);
      }
      await db
        .from("email_leads")
        .update({
          welcome_status: status,
          ...(status.startsWith("failed") ? {} : { welcome_sent_at: new Date().toISOString() }),
        })
        .eq("id", row.id);
    }

    return { retried: rows.length, sent };
  });
