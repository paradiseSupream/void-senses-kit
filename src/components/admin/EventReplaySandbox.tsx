import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import { adminReplayEvent, type ReplayResult } from "@/lib/admin.functions";

const inputCls =
  "w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60";

const EVENTS = ["PageView", "ViewContent", "Lead", "AddToCart", "Purchase"] as const;
const CHANNELS = [
  { id: "both", label: "Meta + TikTok" },
  { id: "meta", label: "Meta only" },
  { id: "tiktok", label: "TikTok only" },
] as const;

/**
 * Sends a clearly-marked test conversion to the configured server-side
 * endpoints and shows the exact provider response, so an admin can confirm
 * ids/tokens work without waiting for real traffic.
 */
export function EventReplaySandbox({ token }: { token: string }) {
  const replay = useServerFn(adminReplayEvent);
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]["id"]>("both");
  const [event, setEvent] = useState<string>("Purchase");
  const [value, setValue] = useState("19");
  const [email, setEmail] = useState("");
  const [testCode, setTestCode] = useState("");
  const [results, setResults] = useState<ReplayResult[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const out = await replay({
        data: { token, channel, event, value: Number(value) || 0, email, testCode },
      });
      setResults(out);
      if (out.length > 0 && out.every((r) => r.ok)) toast.success("Test event accepted ✓");
      else toast.error("Some channels rejected the event — see details.");
    } catch {
      setResults([]);
      toast.error("Replay failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel space-y-4 p-5">
      <div>
        <h2 className="font-display text-lg font-semibold">Event replay sandbox</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fire a real test conversion through the saved tokens and read the provider&apos;s answer
          instantly. Add a Meta test event code to keep it out of live reporting.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="label-mono">Channel</span>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className={`${inputCls} mt-1`}
          >
            {CHANNELS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="label-mono">Event</span>
          <select
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className={`${inputCls} mt-1`}
          >
            {EVENTS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="label-mono">Value (USD)</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="block text-sm">
          <span className="label-mono">Test email (hashed, optional)</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="label-mono">Test event code (optional)</span>
          <input
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            placeholder="TEST12345 — from Events Manager → Test Events"
            className={`${inputCls} mt-1`}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="btn-primary inline-flex items-center gap-1.5"
      >
        <PlayCircle className="size-4" aria-hidden="true" />
        {busy ? "Sending…" : "Send test event"}
      </button>

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.channel} className="rounded-lg border border-hairline bg-surface-2/40 p-3">
              <div className="flex items-start gap-2 text-sm">
                {r.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                )}
                <span className="font-medium">{r.channel}</span>
                <span className="text-muted-foreground">— {r.detail}</span>
              </div>
              <p className="label-mono mt-1 text-xs text-muted-foreground">
                event_id: {r.eventId}
              </p>
              {r.request || r.response ? (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Request / response payload
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-surface-2 p-2">
                    {r.request}
                  </pre>
                  {r.response ? (
                    <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-surface-2 p-2">
                      {r.response}
                    </pre>
                  ) : null}
                </details>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
