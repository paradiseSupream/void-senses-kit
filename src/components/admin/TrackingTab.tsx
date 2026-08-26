import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ExternalLink, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  adminGetSettings,
  adminSaveSettings,
  adminTestTracking,
} from "@/lib/admin.functions";
import { DEFAULT_TRACKING, type TrackingSettings } from "@/lib/admin-types";
import { EventReplaySandbox } from "@/components/admin/EventReplaySandbox";


type Channel = "meta" | "tiktok" | "google";
type Check = { channel: string; ok: boolean; detail: string };

const inputCls =
  "w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="label-mono">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        checked
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-hairline bg-surface-2 text-muted-foreground"
      }`}
    >
      {label}
      <span className={`size-2.5 rounded-full ${checked ? "bg-primary" : "bg-muted"}`} />
    </button>
  );
}

/** Step-by-step "where do I get this id" guide with the real console links. */
function Guide({ steps }: { steps: Array<{ text: string; href?: string; link?: string }> }) {
  return (
    <details className="rounded-lg border border-hairline bg-surface-2/50 p-3 text-sm">
      <summary className="cursor-pointer font-medium">Where do I get these? (guide)</summary>
      <ol className="mt-3 space-y-2 text-muted-foreground">
        {steps.map((step, i) => (
          <li key={step.text} className="flex gap-2">
            <span className="label-mono shrink-0">{i + 1}.</span>
            <span>
              {step.text}{" "}
              {step.href ? (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                >
                  {step.link ?? step.href}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

function Results({ checks }: { checks: Check[] }) {
  if (checks.length === 0) return null;
  return (
    <ul className="space-y-2 rounded-lg border border-hairline bg-surface-2/40 p-3 text-sm">
      {checks.map((check) => (
        <li key={check.channel} className="flex items-start gap-2">
          {check.ok ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          )}
          <span className="font-medium">{check.channel}</span>
          <span className="text-muted-foreground">— {check.detail}</span>
        </li>
      ))}
    </ul>
  );
}

/** Pixel + server-side conversion setup, one card per ad network. */
export function TrackingTab({ token }: { token: string }) {
  const get = useServerFn(adminGetSettings);
  const save = useServerFn(adminSaveSettings);
  const test = useServerFn(adminTestTracking);
  const [form, setForm] = useState<TrackingSettings>(DEFAULT_TRACKING);
  const [checks, setChecks] = useState<Partial<Record<Channel | "all", Check[]>>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useMutation({
    mutationFn: () => get({ data: { token } }),
    onSuccess: (data) => setForm({ ...DEFAULT_TRACKING, ...data.tracking }),
    onError: () => toast.error("Could not load tracking settings."),
  });

  useEffect(() => {
    load.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const set = <K extends keyof TrackingSettings>(key: K, value: TrackingSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const saveChannel = async (name: string) => {
    setBusy(`save:${name}`);
    try {
      const data = await save({ data: { token, tracking: form } });
      setForm({ ...DEFAULT_TRACKING, ...data.tracking });
      toast.success(`${name} settings saved — live immediately.`);
    } catch {
      toast.error("Save failed.");
    } finally {
      setBusy(null);
    }
  };

  const testChannel = async (channel: Channel | "all", name: string) => {
    setBusy(`test:${channel}`);
    try {
      const result = await test({ data: { token, channel } });
      setChecks((prev) => ({ ...prev, [channel]: result }));
      const ok = result.every((r) => r.ok);
      if (ok) toast.success(`${name} connected ✓`);
      else toast.error(`${name}: some checks failed — see details.`);
    } catch {
      toast.error("Verification failed.");
    } finally {
      setBusy(null);
    }
  };

  const Actions = ({ channel, name }: { channel: Channel; name: string }) => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => saveChannel(name)}
        disabled={busy !== null}
        className="btn-primary"
      >
        {busy === `save:${name}` ? "Saving…" : `Save ${name}`}
      </button>
      <button
        type="button"
        onClick={() => testChannel(channel, name)}
        disabled={busy !== null}
        className="btn-ghost inline-flex items-center gap-1.5 text-sm"
      >
        <ShieldCheck className="size-4" aria-hidden="true" />
        {busy === `test:${channel}` ? "Testing…" : `Test ${name} connection`}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Global tracking switches</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => testChannel("all", "All channels")}
              disabled={busy !== null}
              className="btn-ghost inline-flex items-center gap-1.5 text-sm"
            >
              <ShieldCheck className="size-4" aria-hidden="true" /> Test all
            </button>
            <button
              type="button"
              onClick={() => load.mutate()}
              className="btn-ghost inline-flex items-center gap-1.5 text-sm"
            >
              <RefreshCw className="size-4" aria-hidden="true" /> Reload
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Toggle
            label="Tracking enabled"
            checked={form.enabled}
            onChange={(v) => set("enabled", v)}
          />
          <Toggle
            label="Server-side conversions"
            checked={form.server_side}
            onChange={(v) => set("server_side", v)}
          />
          <Toggle
            label="Wait for cookie consent"
            checked={form.require_consent}
            onChange={(v) => set("require_consent", v)}
          />
        </div>
        <button
          type="button"
          onClick={() => saveChannel("Global")}
          disabled={busy !== null}
          className="btn-primary w-full sm:w-auto"
        >
          {busy === "save:Global" ? "Saving…" : "Save switches"}
        </button>
        <Results checks={checks.all ?? []} />
      </div>

      {/* ---------------------------------------------------------------- 1 */}
      <div className="panel space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">1 · Meta (Facebook & Instagram)</h2>
        <Guide
          steps={[
            {
              text: "Open Meta Events Manager:",
              href: "https://business.facebook.com/events_manager2",
              link: "business.facebook.com/events_manager2",
            },
            {
              text: "Data sources → pick (or Connect a new data source → Web) your pixel. The 15–16 digit number under its name is the Pixel ID.",
            },
            {
              text: "Same pixel → Settings tab → scroll to Conversions API → Generate access token. Copy the EAAG… string.",
            },
            {
              text: "Optional: Test events tab shows a TEST12345 code — paste it below to watch events land live.",
              href: "https://developers.facebook.com/docs/marketing-api/conversions-api/get-started",
              link: "CAPI docs",
            },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Meta pixel ID" hint="Events Manager → Data sources → your pixel.">
            <input
              className={inputCls}
              value={form.meta_pixel_id}
              onChange={(e) => set("meta_pixel_id", e.target.value)}
              placeholder="123456789012345"
            />
          </Field>
          <Field
            label="Meta Conversions API token"
            hint="Events Manager → Settings → Generate access token. Stored server-side only."
          >
            <input
              className={inputCls}
              type="password"
              value={form.meta_capi_token}
              onChange={(e) => set("meta_capi_token", e.target.value)}
              placeholder="EAAG..."
            />
          </Field>
          <Field label="Meta test event code" hint="Optional — for Test Events debugging.">
            <input
              className={inputCls}
              value={form.meta_test_event_code}
              onChange={(e) => set("meta_test_event_code", e.target.value)}
              placeholder="TEST12345"
            />
          </Field>
        </div>
        <Actions channel="meta" name="Meta" />
        <Results checks={checks.meta ?? []} />
      </div>

      {/* ---------------------------------------------------------------- 2 */}
      <div className="panel space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">2 · TikTok</h2>
        <Guide
          steps={[
            {
              text: "Open TikTok Events Manager:",
              href: "https://ads.tiktok.com/i18n/events_manager",
              link: "ads.tiktok.com/i18n/events_manager",
            },
            {
              text: "Connect data source → Web → Manual setup → TikTok Pixel. The ID looks like C7XXXXXXXXXXXXXXXXX.",
            },
            {
              text: "Inside the pixel → Settings → Events API → Generate access token, then copy it.",
              href: "https://business-api.tiktok.com/portal/docs?id=1771101027431425",
              link: "Events API docs",
            },
            { text: "Paste both below and press Test — a real ViewContent test event is sent." },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="TikTok pixel ID">
            <input
              className={inputCls}
              value={form.tiktok_pixel_id}
              onChange={(e) => set("tiktok_pixel_id", e.target.value)}
              placeholder="C7XXXXXXXXXXXXXXXXX"
            />
          </Field>
          <Field label="TikTok Events API token" hint="Events Manager → Events API → Generate.">
            <input
              className={inputCls}
              type="password"
              value={form.tiktok_events_token}
              onChange={(e) => set("tiktok_events_token", e.target.value)}
            />
          </Field>
        </div>
        <Actions channel="tiktok" name="TikTok" />
        <Results checks={checks.tiktok ?? []} />
      </div>

      {/* ---------------------------------------------------------------- 3 */}
      <div className="panel space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">3 · Google (Ads + GA4)</h2>
        <Guide
          steps={[
            {
              text: "Google Ads → Goals → Conversions → Summary → New conversion action → Website:",
              href: "https://ads.google.com/aw/conversions",
              link: "ads.google.com/aw/conversions",
            },
            {
              text: "Open the action → Tag setup → Use Google tag. The snippet shows AW-123456789 (conversion ID) and send_to: 'AW-…/AbCdEf' — the part after the slash is the label.",
            },
            {
              text: "GA4 measurement ID: Google Analytics → Admin → Data streams → your web stream → G-XXXXXXX.",
              href: "https://analytics.google.com/analytics/web/#/a/admin/streams",
              link: "analytics.google.com admin",
            },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Google Ads conversion ID" hint="Format AW-XXXXXXXXX.">
            <input
              className={inputCls}
              value={form.google_ads_id}
              onChange={(e) => set("google_ads_id", e.target.value)}
              placeholder="AW-123456789"
            />
          </Field>
          <Field label="Google Ads conversion label" hint="Optional, from the conversion action.">
            <input
              className={inputCls}
              value={form.google_ads_conversion_label}
              onChange={(e) => set("google_ads_conversion_label", e.target.value)}
            />
          </Field>
          <Field label="GA4 measurement ID" hint="Format G-XXXXXXX.">
            <input
              className={inputCls}
              value={form.ga4_id}
              onChange={(e) => set("ga4_id", e.target.value)}
              placeholder="G-XXXXXXX"
            />
          </Field>
        </div>
        <Actions channel="google" name="Google" />
        <Results checks={checks.google ?? []} />
      </div>

      <EventReplaySandbox token={token} />

      <div className="panel p-5 text-sm text-muted-foreground">

        <h3 className="font-display text-base font-semibold text-foreground">
          Which events are sent
        </h3>
        <p className="mt-2">
          PageView on every route, ViewContent when a test starts, Lead when a result is shown,
          AddToCart when the VIP gate appears, InitiateCheckout at checkout and Purchase on a paid
          order. Browser and server events share one event ID, so Meta and TikTok de-duplicate them
          automatically.
        </p>
      </div>
    </div>
  );
}
