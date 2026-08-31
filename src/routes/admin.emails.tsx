import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  adminEmailsReport,
  adminRetryWelcomeEmails,
  type EmailsReport,
} from "@/lib/emails.functions";

export const Route = createFileRoute("/admin/emails")({
  head: () => ({
    meta: [
      { title: "Lead Emails & Delivery — Senses of Void" },
      {
        name: "description",
        content:
          "Private operator dashboard: captured leads, automatic welcome email status and delivery events.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Lead Emails & Delivery" },
      { property: "og:description", content: "Private operator email dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmailsPage,
});

const TOKEN_KEY = "sov.adminToken";
const WINDOWS = [1, 7, 14, 30, 90] as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="label-mono">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function EmailsPage() {
  const load = useServerFn(adminEmailsReport);
  const retry = useServerFn(adminRetryWelcomeEmails);
  const [token, setToken] = useState<string | null>(null);
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(14);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(window.sessionStorage.getItem(TOKEN_KEY) ?? window.localStorage.getItem(TOKEN_KEY));
  }, []);

  const query = useQuery<EmailsReport>({
    queryKey: ["admin-emails", token, days],
    queryFn: async () => (await load({ data: { token: token!, days } })) as EmailsReport,
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });

  const data = query.data;

  if (!token) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-2xl font-bold">Lead emails</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in from the{" "}
          <Link to="/admin" className="text-primary underline">
            admin panel
          </Link>{" "}
          first.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to admin
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Mail className="size-5 text-primary" aria-hidden="true" /> Lead emails
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {WINDOWS.map((window) => (
            <button
              key={window}
              type="button"
              onClick={() => setDays(window)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                days === window ? "border-primary/60 bg-primary/10 text-primary" : "border-hairline"
              }`}
            >
              {window}d
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await retry({ data: { token } });
                toast.success(`Retried ${result.retried} — sent ${result.sent}`);
                await query.refetch();
              } catch {
                toast.error("Retry failed.");
              } finally {
                setBusy(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-60"
          >
            <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
            Retry unsent
          </button>
          <button
            type="button"
            disabled={!data?.leads?.length}
            onClick={() => {
              if (!data) return;
              // Lovable email only sends one action-triggered message per lead,
              // so a multi-day discount sequence has to run in a dedicated
              // marketing tool — this export is the hand-off for it.
              downloadCsv(
                `sov-leads-${days}d.csv`,
                toCsv(
                  ["email", "source", "tool", "country", "utm_source", "captured_at", "welcome_status"],
                  data.leads.map((lead) => [
                    lead.email,
                    lead.source,
                    lead.tool_slug ?? "",
                    lead.country ?? "",
                    lead.utm_source ?? "",
                    lead.created_at,
                    lead.welcome_status ?? "pending",
                  ]),
                ),
              );
            }}
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            <Download className="size-3.5" aria-hidden="true" /> Export CSV
          </button>
        </div>
      </header>




      <section className="mt-5 grid gap-3 sm:grid-cols-4">
        <Stat label="Leads" value={String(data?.totalLeads ?? 0)} />
        <Stat label="Welcomed" value={String(data?.welcomed ?? 0)} />
        <Stat label="Pending" value={String(data?.pending ?? 0)} />
        <Stat label="Failed" value={String(data?.failed ?? 0)} />
      </section>

      <section className="glass mt-6 overflow-x-auto rounded-2xl p-4">
        <h2 className="font-display text-lg font-semibold">Captured leads</h2>
        <table className="mt-3 w-full min-w-[640px] text-left text-sm">
          <thead className="label-mono">
            <tr>
              <th className="py-2">Email</th>
              <th>Source</th>
              <th>Country</th>
              <th>Welcome</th>
              <th>Captured</th>
            </tr>
          </thead>
          <tbody>
            {(data?.leads ?? []).map((lead) => (
              <tr key={lead.id} className="border-t border-hairline/60">
                <td className="py-2">{lead.email}</td>
                <td className="text-muted-foreground">{lead.tool_slug ?? lead.source}</td>
                <td className="text-muted-foreground">{lead.country ?? "—"}</td>
                <td
                  className={
                    lead.welcome_sent_at
                      ? "text-primary"
                      : lead.welcome_status
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }
                >
                  {lead.welcome_sent_at ? "sent" : (lead.welcome_status ?? "pending")}
                </td>
                <td className="text-muted-foreground">
                  {new Date(lead.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.leads.length ? (
          <p className="mt-3 text-sm text-muted-foreground">No leads in this window yet.</p>
        ) : null}
      </section>

      <section className="glass mt-6 overflow-x-auto rounded-2xl p-4">
        <h2 className="font-display text-lg font-semibold">Delivery events</h2>
        {data?.logsError ? (
          <p className="mt-2 text-sm text-muted-foreground">{data.logsError}</p>
        ) : null}
        <table className="mt-3 w-full min-w-[560px] text-left text-sm">
          <thead className="label-mono">
            <tr>
              <th className="py-2">Recipient</th>
              <th>Event</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {(data?.logs ?? []).map((log, index) => (
              <tr key={`${log.timestamp}-${index}`} className="border-t border-hairline/60">
                <td className="py-2">{log.recipient}</td>
                <td className="text-muted-foreground">{log.event_type}</td>
                <td className="text-muted-foreground">{log.status ?? "—"}</td>
                <td className="text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.logs.length && !data?.logsError ? (
          <p className="mt-3 text-sm text-muted-foreground">No delivery events yet.</p>
        ) : null}
      </section>
    </main>
  );
}
