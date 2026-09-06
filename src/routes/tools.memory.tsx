import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Grid3X3 } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import { LockedReport } from "@/components/monetization/LockedReport";
import { DailyChallengeEntry } from "@/components/tools/DailyChallengeEntry";
import { useAutoStart } from "@/lib/autostart";
import { percentileOf } from "@/lib/quiz-engine";

const URL = "https://sensesofvoid.app/tools/memory";
const OG = "https://sensesofvoid.app/og/memory.jpg";

const GRID = 9;

export const Route = createFileRoute("/tools/memory")({
  head: () => ({
    meta: [
      { title: "Memory Challenge — Test Your Short-Term Memory Free" },
      {
        name: "description",
        content:
          "How long a sequence can you hold? A 60-second visual memory test that grows one tile per round, scores your span and gives you a card to challenge friends with.",
      },
      { property: "og:title", content: "Memory Challenge — Senses of Void" },
      {
        property: "og:description",
        content: "Each round adds one tile. How far does your short-term memory stretch?",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Senses of Void" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: OG },
      { name: "twitter:image", content: OG },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Game",
          name: "Memory Challenge",
          url: URL,
          isAccessibleForFree: true,
          publisher: { "@type": "Organization", name: "Senses of Void", url: "https://sensesofvoid.app" },
        }),
      },
    ],
  }),
  component: MemoryTool,
});

type Phase = "intro" | "show" | "input" | "result";

/** Fixed reading for each working-memory sub-metric. */
const MEMORY_NOTES: Record<string, string> = {
  Span: "The longest sequence you repeated perfectly. Adult working memory typically holds 5–9 items; anything above that is trained, not innate.",
  Accuracy: "Share of taps that landed on the right tile. High accuracy with a short span means the ceiling is real; low accuracy means slips, and slowing down adds two tiles for free.",
  "Recall speed": "How quickly you reproduced the order. Fast recall suggests you chunked the sequence rather than replaying it one tile at a time.",
  Stamina: "How many rounds you cleared before the first error. This tracks attention endurance more than memory itself.",
};

function MemoryTool() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sequence, setSequence] = useState<number[]>([]);
  const [flash, setFlash] = useState<number | null>(null);
  const [entered, setEntered] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [best, setBest] = useState(0);
  const timers = useRef<number[]>([]);
  // Tap-level stats power the breakdown: raw span alone hides whether a run
  // ended from a slip or from genuinely hitting the ceiling.
  const [taps, setTaps] = useState(0);
  const [misses, setMisses] = useState(0);
  const tapClock = useRef<number>(0);
  const [tapMs, setTapMs] = useState<number[]>([]);

  useAutoStart(() => start());

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const playSequence = useCallback((seq: number[]) => {
    clearTimers();
    setPhase("show");
    seq.forEach((tile, i) => {
      timers.current.push(window.setTimeout(() => setFlash(tile), i * 700 + 300));
      timers.current.push(window.setTimeout(() => setFlash(null), i * 700 + 850));
    });
    timers.current.push(
      window.setTimeout(() => {
        setEntered([]);
        setPhase("input");
      }, seq.length * 700 + 400),
    );
  }, []);

  const start = useCallback(() => {
    const first = [Math.floor(Math.random() * GRID), Math.floor(Math.random() * GRID)];
    setRound(1);
    setTaps(0);
    setMisses(0);
    setTapMs([]);
    setSequence(first);
    playSequence(first);
  }, [playSequence]);

  const tap = (tile: number) => {
    if (phase !== "input") return;
    const next = [...entered, tile];
    const now = Date.now();
    if (tapClock.current) setTapMs((prev) => [...prev, now - tapClock.current]);
    tapClock.current = now;
    setTaps((t) => t + 1);
    const correct = sequence[next.length - 1] === tile;
    if (!correct) {
      setMisses((m) => m + 1);
      setBest(sequence.length - 1);
      setPhase("result");
      return;
    }
    if (next.length === sequence.length) {
      const grown = [...sequence, Math.floor(Math.random() * GRID)];
      setRound((r) => r + 1);
      setSequence(grown);
      setBest(sequence.length);
      window.setTimeout(() => playSequence(grown), 500);
      return;
    }
    setEntered(next);
  };

  const percentile = useMemo(() => percentileOf(Math.min(1, best / 12)), [best]);
  const breakdown = useMemo(() => {
    const attempts = taps || 1;
    const accuracy = Math.round(((taps - misses) / attempts) * 100);
    const spanScore = Math.round(Math.min(1, best / 12) * 100);
    const avgMs = tapMs.length ? tapMs.reduce((a, b) => a + b, 0) / tapMs.length : 0;
    // 1.5s per tap is a comfortable pace; faster than that scores higher.
    const pace = avgMs ? Math.round(Math.max(0, Math.min(100, (1500 / avgMs) * 60))) : 0;
    const stamina = Math.round(Math.min(100, ((round - 1) / 10) * 100));
    return [
      { dim: "Span", value: spanScore },
      { dim: "Accuracy", value: accuracy },
      { dim: "Recall speed", value: pace },
      { dim: "Stamina", value: stamina },
    ];
  }, [best, taps, misses, tapMs, round]);

  const band = best >= 9 ? "Elite recall" : best >= 7 ? "Sharp" : best >= 5 ? "Average" : "Warming up";

  return (
    <ToolShell
      eyebrow="Tool 10 · Cognition"
      slug="memory"
      title="Memory Challenge"
      intro="Watch the tiles light up, then repeat the order. Every round adds one more tile — your span is the longest sequence you repeat perfectly."
    >
      {phase === "intro" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono inline-flex items-center gap-2">
            <Grid3X3 className="size-4" aria-hidden="true" /> Visual span
          </span>
          <p className="mt-3 text-sm text-muted-foreground">
            Most people top out between five and seven tiles. Beat that and you get a card worth
            sending to the friend who claims a photographic memory.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground sm:w-auto"
          >
            Start round 1
          </button>
        </div>
      ) : null}

      {phase === "show" || phase === "input" ? (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="label-mono">Round {round}</span>
            <span className="label-mono">
              {phase === "show" ? "Watch" : `Repeat · ${entered.length}/${sequence.length}`}
            </span>
          </div>
          <div className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3">
            {Array.from({ length: GRID }, (_, tile) => (
              <button
                key={tile}
                type="button"
                aria-label={`Tile ${tile + 1}`}
                disabled={phase !== "input"}
                onClick={() => tap(tile)}
                className={`aspect-square rounded-2xl border border-hairline transition-colors duration-150 ${
                  flash === tile ? "bg-primary" : "bg-surface-2 hover:bg-surface-3"
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {phase === "result" ? (
        <div className="reveal">
          <div className="glass rounded-2xl p-6 sm:p-8 text-center">
            <span className="label-mono">Memory span</span>
            <p className="mt-1 font-display text-6xl">{best}</p>
            <h2 className="mt-2 font-display text-2xl">{band}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You repeated {best} tiles in order — roughly the {percentile}th percentile of players
              on this test.
            </p>

            <div className="mt-8 text-left">
              <LockedReport
                toolSlug="memory"
                title="Working-memory breakdown"
                share={{
                  t: "memory",
                  n: "Memory Challenge",
                  h: `${best} tiles · ${band}`,
                  l: [`Span ${best}, ${percentile}th percentile`],
                  p: "/tools/memory",
                }}
              >
                <div className="mt-6">
                  <TraitBars data={breakdown} notes={MEMORY_NOTES} />
                </div>
              </LockedReport>
            </div>
          </div>

          <DailyChallengeEntry toolSlug="memory" score={Math.round(best)} />

          <ResultActions
            toolSlug="memory"
            onRetake={start}
            payload={{
              eyebrow: "Memory Challenge",
              title: "Memory Challenge",
              headline: `${best} tiles · ${band}`,
              lines: [`Span ${best}`, `Percentile ${percentile}`],
              fileName: "senses-of-void-memory.png",
              text: `My memory span is ${best} tiles. Beat it.`,
              toolName: "Memory Challenge",
              toolPath: "/tools/memory",
              accentSeed: band,
              badge: `${best} tiles`,
              metrics: [
                { label: "Span", value: best },
                { label: "Percentile", value: percentile },
              ],
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
