import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  adminGetSettings,
  adminSaveSettings,
  adminTestTracking,
} from "@/lib/admin.functions";
import { DEFAULT_TRACKING, type TrackingSettings } from "@/lib/admin-types";

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

/** Pixel + server-side conversion setup, fully editable from the panel. */
export function TrackingTab({ token }: { token: string }) {
  const get = useServerFn(adminGetSettings);
  const save = useServerFn(adminSaveSettings);
  const test = useServerFn(adminTestTracking);
  const [form, setForm] = useState<TrackingSettings>(DEFAULT_TRACKING);
  const [checks, setChecks] = useState<Array<{ channel: string; ok: boolean; detail: string }>>([]);

  const load = useMutation({
    mutationFn: () => get({ data: { token } }),
    onSuccess: (data) => setForm({ ...DEFAULT_TRACKING, ...data.tracking }),
    onError: () => toast.error("Could not load tracking settings."),
  });

  const saveMutation = useMutation({
    mutationFn: () => save({ data: { token, tracking: form } }),
    onSuccess: (data) => {
      setForm({ ...DEFAULT_TRACKING, ...data.tracking });
      toast.success("Tracking settings saved — live on the site immediately.");
    },
    onError: () => toast.error("Save failed."),
  });

  const testMutation = useMutation({
    mutationFn: () => test({ data: { token } }),
    onSuccess: (data) => setChecks(data),
    onError: () => toast.error("Verification failed."),
  });

  useEffect(() => {
    load.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const set = <K extends keyof TrackingSettings>(key: K, value: TrackingSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Pixels & server-side tracking</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => testMutation.mutate()}
              className="btn-ghost inline-flex items-center gap-1.5 text-sm"
            >
              <ShieldCheck className="size-4" aria-hidden="true" /> Verify
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

        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="btn-primary w-full sm:w-auto"
        >
          {saveMutation.isPending ? "Saving…" : "Save tracking settings"}
        </button>
      </div>

      {checks.length > 0 ? (
        <div className="panel p-5">
          <h3 className="font-display text-base font-semibold">Verification</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {checks.map((check) => (
              <li key={check.channel} className="flex items-center gap-2">
                {check.ok ? (
                  <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <XCircle className="size-4 text-destructive" aria-hidden="true" />
                )}
                <span className="font-medium">{check.channel}</span>
                <span className="text-muted-foreground">— {check.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
