import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Flame, Square } from "lucide-react";
import { toast } from "sonner";

import { ToolShell } from "@/components/layout/ToolShell";

export const Route = createFileRoute("/tools/roast")({
  head: () => ({
    meta: [
      { title: "AI Roast Me — Mild, Savage or Brutal AI Roasts" },
      {
        name: "description",
        content:
          "Paste a bio, GitHub handle or text snippet, pick an intensity, and get a live streamed AI roast rendered in a terminal. Free, ten per hour.",
      },
      { property: "og:title", content: "AI Roast Me — Senses of Void" },
      {
        property: "og:description",
        content: "Streamed AI roasts at three intensities. Comedy only — nothing personal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoastMe,
});

const LEVELS = ["mild", "savage", "brutal"] as const;

function RoastMe() {
  const [target, setTarget] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("savage");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  };

  const run = async () => {
    if (target.trim().length < 3) {
      toast.error("Give the AI a few words to work with.");
      return;
    }
    setOutput("");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/public/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, level }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(payload.error ?? "The roast engine is unavailable right now.");
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) setOutput((prev) => prev + delta);
          } catch {
            /* partial chunk, ignore */
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Connection interrupted.");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  return (
    <ToolShell
      eyebrow="Tool 05 · AI"
      title="AI Roast Me"
      intro="Paste a bio, a GitHub handle or any snippet about yourself, choose your pain tolerance, and watch it come in live."
    >
      <div className="glass rounded-xl p-5">
        <label htmlFor="roast-target" className="label-mono mb-1.5 block">
          Bio, handle or snippet
        </label>
        <textarea
          id="roast-target"
          rows={4}
          value={target}
          maxLength={800}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Full-stack dev, 4 side projects, 0 shipped, drinks cold brew at 11pm…"
          className="w-full resize-y rounded-lg border border-hairline bg-surface-2/70 px-3 py-2.5 text-sm focus:border-primary/50"
        />

        <fieldset className="mt-5">
          <legend className="label-mono mb-2">Roast level</legend>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-hairline bg-surface-2/60 p-1">
            {LEVELS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={level === option}
                onClick={() => setLevel(option)}
                className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  level === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Flame className="size-4" aria-hidden="true" /> {busy ? "Roasting…" : "Roast me"}
          </button>
          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
            >
              <Square className="size-3.5" aria-hidden="true" /> Stop
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Ten roasts per hour per visitor. Comedy only — no personal attacks on identity.
        </p>
      </div>

      <div className="glass mt-6 overflow-hidden rounded-xl">
        <div className="flex items-center gap-2 border-b border-hairline bg-surface-2/60 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-chart-3/70" />
          <span className="size-2.5 rounded-full bg-primary/70" />
          <span className="label-mono ml-2">roast.stream</span>
        </div>
        <pre
          aria-live="polite"
          className="min-h-48 overflow-auto p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-foreground"
        >
          {output || (
            <span className="text-muted-foreground">
              $ awaiting input<span className="animate-pulse">▌</span>
            </span>
          )}
          {busy && output ? <span className="animate-pulse">▌</span> : null}
        </pre>
      </div>
    </ToolShell>
  );
}
