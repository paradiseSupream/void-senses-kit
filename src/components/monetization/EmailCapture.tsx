import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Check } from "lucide-react";

import { subscribeLead } from "@/lib/leads.functions";
import { attribution, sessionId, track } from "@/lib/monetization";
import { useVip } from "@/lib/vip";

const KEY = "sov.lead";

/** Only one capture form may render per screen — several hosts now include it. */
let mounted = 0;


/**
 * Return-visit loop. A visitor who leaves an email can be pulled back for the
 * next test for free, which is the single cheapest way to raise revenue per
 * acquired visitor (the same person monetises 2–4 times instead of once).
 */
export function EmailCapture({
  toolSlug,
  source = "result",
  className = "",
}: {
  toolSlug?: string | null;
  source?: string;
  className?: string;
}) {
  const { isVip } = useVip();
  const submit = useServerFn(subscribeLead);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [primary, setPrimary] = useState(false);

  useEffect(() => {
    mounted += 1;
    setPrimary(mounted === 1);
    return () => {
      mounted -= 1;
    };
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY)) setState("done");
    } catch {
      /* storage unavailable */
    }
  }, []);

  if (isVip || !primary) return null;


  if (state === "done") {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border border-hairline bg-surface/50 px-4 py-3 text-sm text-muted-foreground ${className}`}
      >
        <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
        You&apos;re on the list — new tests land in your inbox first.
      </div>
    );
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state === "busy" || !email.includes("@")) return;
    setState("busy");
    try {
      await submit({
        data: {
          email,
          source,
          toolSlug: toolSlug ?? null,
          sessionId: sessionId(),
          utmSource: attribution().utm_source ?? null,
        },
      });
      try {
        window.localStorage.setItem(KEY, "1");
      } catch {
        /* storage unavailable */
      }
      track({ event_type: "conversion", slot: "email_capture", tool_slug: toolSlug ?? null });
      setState("done");
    } catch {
      setState("idle");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-xl border border-hairline bg-surface/50 p-4 backdrop-blur-xl ${className}`}
    >
      <p className="flex items-center gap-2 font-display text-sm font-semibold">
        <Mail className="size-4 text-primary" aria-hidden="true" />
        Get the next test before anyone else
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        One email a week — a new test, plus your saved results. No spam, unsubscribe anytime.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="min-h-11 flex-1 rounded-full border border-hairline bg-surface-2/60 px-4 text-sm outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="min-h-11 shrink-0 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {state === "busy" ? "…" : "Notify me"}
        </button>
      </div>
    </form>
  );
}
