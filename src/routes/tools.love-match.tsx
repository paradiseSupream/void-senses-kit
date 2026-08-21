import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, HeartPulse } from "lucide-react";
import { toast } from "sonner";

import { ToolShell } from "@/components/layout/ToolShell";

export const Route = createFileRoute("/tools/love-match")({
  head: () => ({
    meta: [
      { title: "Love & Vibe Matcher — Deterministic Compatibility Score" },
      {
        name: "description",
        content:
          "Enter two names and optional birthdates for a stable, repeatable vibe score with a witty synergy breakdown you can copy straight to stories.",
      },
      { property: "og:title", content: "Love & Vibe Matcher — Senses of Void" },
      {
        property: "og:description",
        content: "A deterministic chemistry read: same names in, same score out. For fun only.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoveMatch,
});

/** Stable 32-bit string hash — identical inputs always yield identical output. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const TRAITS = ["Banter", "Trust", "Adventure", "Calm", "Spark"] as const;

const LINES: Record<string, string[]> = {
  high: [
    "You two finish each other's chaos.",
    "Suspiciously synced. Check your playlists.",
    "The kind of pairing group chats gossip about.",
  ],
  mid: [
    "Solid signal, occasional static.",
    "Great on paper, better after coffee.",
    "You balance each other — mostly on purpose.",
  ],
  low: [
    "Different frequencies, same city.",
    "Friction now, folklore later.",
    "Opposites, and neither is backing down.",
  ],
};

function LoveMatch() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [da, setDa] = useState("");
  const [db, setDb] = useState("");

  const result = useMemo(() => {
    const nameA = a.trim().toLowerCase();
    const nameB = b.trim().toLowerCase();
    if (!nameA || !nameB) return null;
    const seed = hash([nameA, nameB].sort().join("|") + "::" + [da, db].sort().join("|"));
    const score = 42 + (seed % 59);
    const traits = TRAITS.map((t, i) => ({
      name: t,
      value: 35 + (hash(`${seed}-${t}-${i}`) % 66),
    }));
    const band = score >= 80 ? "high" : score >= 62 ? "mid" : "low";
    const line = LINES[band]![seed % 3]!;
    return { score, traits, line, band };
  }, [a, b, da, db]);

  const copy = async () => {
    if (!result) return;
    const text = `${a.trim()} × ${b.trim()} = ${result.score}% vibe match ⚡\n${result.line}\n— sensesofvoid.app`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Vibe score copied — paste it into your story.");
    } catch {
      toast.error("Clipboard blocked — copy the text manually.");
    }
  };

  return (
    <ToolShell
      eyebrow="Tool 04 · Social"
      title="Love & Vibe Matcher"
      intro="A deterministic read: the same two names always return the same score, so you can share it and it stays true."
    >
      <div className="glass grid gap-4 rounded-xl p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name-a" className="label-mono mb-1.5 block">
            First name
          </label>
          <input
            id="name-a"
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-surface-2/70 px-3 py-2.5 text-sm focus:border-primary/50"
          />
          <label htmlFor="dob-a" className="label-mono mt-3 mb-1.5 block">
            Birthdate (optional)
          </label>
          <input
            id="dob-a"
            type="date"
            value={da}
            onChange={(e) => setDa(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-surface-2/70 px-3 py-2.5 text-sm focus:border-primary/50"
          />
        </div>
        <div>
          <label htmlFor="name-b" className="label-mono mb-1.5 block">
            Second name
          </label>
          <input
            id="name-b"
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-surface-2/70 px-3 py-2.5 text-sm focus:border-primary/50"
          />
          <label htmlFor="dob-b" className="label-mono mt-3 mb-1.5 block">
            Birthdate (optional)
          </label>
          <input
            id="dob-b"
            type="date"
            value={db}
            onChange={(e) => setDb(e.target.value)}
            className="w-full rounded-lg border border-hairline bg-surface-2/70 px-3 py-2.5 text-sm focus:border-primary/50"
          />
        </div>
      </div>

      {result ? (
        <div className="glass mt-6 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="label-mono flex items-center gap-2">
                <HeartPulse className="size-3.5 text-primary" aria-hidden="true" /> synergy score
              </span>
              <p className="mt-2 font-display text-5xl font-bold text-primary">{result.score}%</p>
              <p className="mt-1 text-sm text-foreground">{result.line}</p>
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Copy className="size-4" aria-hidden="true" /> Copy Vibe Score
            </button>
          </div>

          <svg
            viewBox="0 0 400 80"
            className="mt-6 h-20 w-full"
            role="img"
            aria-label={`Pulse wave visual for a ${result.score} percent match`}
          >
            <path
              d={buildWave(result.score)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              className="[stroke-dasharray:1200] [stroke-dashoffset:1200] animate-[dash_2.2s_ease-out_forwards]"
            />
            <style>{`@keyframes dash { to { stroke-dashoffset: 0 } }`}</style>
          </svg>

          <ul className="mt-6 space-y-3">
            {result.traits.map((t) => (
              <li key={t.name}>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{t.name}</span>
                  <span className="font-mono text-muted-foreground">{t.value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    style={{ width: `${t.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Enter both names to see the reading.</p>
      )}
    </ToolShell>
  );
}

function buildWave(score: number): string {
  const amp = 8 + (score / 100) * 26;
  let d = "M0 40";
  for (let x = 0; x <= 400; x += 20) {
    const beat = x % 80 === 0 ? amp * 1.6 : amp;
    const y = 40 - Math.sin((x / 400) * Math.PI * 6) * beat;
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d;
}
