import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { QuizVipNudge } from "@/components/monetization/QuizVipNudge";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import { IQ_BANK, IQ_PER_CATEGORY, IQ_SESSION_SIZE } from "@/lib/banks/iq";
import {
  newSeed,
  percentileOf,
  pickIqItems,
  rngFrom,
  shuffleOptions,
  type IqItem,
} from "@/lib/quiz-engine";

export const Route = createFileRoute("/tools/iq")({
  head: () => ({
    meta: [
      { title: "Quick IQ Test — 20 Randomised Timed Puzzles & HD Certificate" },
      {
        name: "description",
        content:
          "Twenty timed items drawn from a 64-question bank across number, logic, verbal, pattern and spatial reasoning, ending in a downloadable certificate with your percentile.",
      },
      { property: "og:title", content: "Quick IQ Test — Senses of Void" },
      {
        property: "og:description",
        content:
          "A different set of twenty timed puzzles every attempt, with a category breakdown and an HD certificate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IqTest,
});

const LIMIT = 20;

type Prepared = IqItem & { shuffled: string[]; correctIndex: number };

function IqTest() {
  const [seed, setSeed] = useState(() => newSeed());
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [hits, setHits] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(LIMIT);
  const lockRef = useRef(false);

  const items: Prepared[] = useMemo(() => {
    const rand = rngFrom(seed);
    return pickIqItems(IQ_BANK, IQ_PER_CATEGORY, rand).map((item) => {
      const { options, answer } = shuffleOptions(item, rand);
      return { ...item, shuffled: options, correctIndex: answer };
    });
  }, [seed]);

  const restart = useCallback(() => {
    setSeed(newSeed());
    setIndex(0);
    setHits({});
    setLeft(LIMIT);
    setPhase("quiz");
  }, []);

  const advance = useCallback(
    (choice: number | null) => {
      if (lockRef.current) return;
      lockRef.current = true;
      const item = items[index]!;
      const correct = choice !== null && choice === item.correctIndex;
      setHits((h) => ({ ...h, [item.id]: correct }));
      window.setTimeout(() => {
        lockRef.current = false;
        if (index === items.length - 1) setPhase("result");
        else {
          setIndex((i) => i + 1);
          setLeft(LIMIT);
        }
      }, 140);
    },
    [index, items],
  );

  useEffect(() => {
    if (phase !== "quiz") return;
    setLeft(LIMIT);
    const id = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          advance(null);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, index, advance]);

  const result = useMemo(() => {
    const correct = items.filter((i) => hits[i.id]).length;
    const ratio = correct / items.length;
    const estimate = Math.round(78 + ratio * 62);
    const percentile = percentileOf(ratio);
    const byCat = new Map<string, { hit: number; total: number }>();
    for (const item of items) {
      const entry = byCat.get(item.cat) ?? { hit: 0, total: 0 };
      entry.total += 1;
      if (hits[item.id]) entry.hit += 1;
      byCat.set(item.cat, entry);
    }
    const breakdown = [...byCat.entries()].map(([dim, v]) => ({
      dim,
      value: Math.round((v.hit / v.total) * 100),
    }));
    const strongest = [...breakdown].sort((a, b) => b.value - a.value)[0]?.dim ?? "Logic";
    return { correct, estimate, percentile, breakdown, strongest };
  }, [hits, items]);

  if (phase === "intro") {
    return (
      <ToolShell
        eyebrow="Tool 02 · Cognition"
        slug="iq"
        title="Quick IQ Test"
        intro="Twenty items drawn from a 64-question bank across five reasoning categories, twenty seconds each. Options are reshuffled too, so a screenshot helps nobody."
      >
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono">What you'll get</span>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>A score estimate with an approximate percentile band.</li>
            <li>A per-category breakdown: number, logic, verbal, pattern and spatial.</li>
            <li>A named HD certificate you can download and share.</li>
          </ul>
          <p className="mt-5 rounded-xl border border-hairline bg-surface-2/40 p-3.5 text-sm italic">
            “2, 6, 12, 20, 30, … what comes next?”
          </p>

          <label htmlFor="participant" className="label-mono mt-6 mb-1.5 block">
            Name on certificate (optional)
          </label>
          <input
            id="participant"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="min-h-11 w-full rounded-xl border border-hairline bg-surface-2/70 px-3 text-sm focus:border-primary/50"
          />
          <button
            type="button"
            onClick={() => setPhase("quiz")}
            className="mt-5 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start the timed test · {IQ_SESSION_SIZE} items
          </button>
        </div>
      </ToolShell>
    );
  }

  if (phase === "result") {
    return (
      <ToolShell
        eyebrow="Tool 02 · Cognition"
        slug="iq"
        title="Cognitive performance certificate"
        intro="An estimate from speed and accuracy across twenty timed items in five categories."
      >
        <div className="glass reveal rounded-2xl p-6 text-center sm:p-8">
          <span className="label-mono">Verified performance estimate</span>
          <p className="mt-4 font-display text-6xl font-bold text-primary">{result.estimate}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.correct} of {items.length} correct · approx. {result.percentile}th percentile
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {name.trim() || "Anonymous Participant"} · strongest area: {result.strongest}
          </p>

          <div className="mt-8 text-left">
            <TraitBars data={result.breakdown} />
          </div>

          <ResultActions
            toolSlug="iq"
            onRetake={restart}
            payload={{
              eyebrow: "Verified Cognitive Performance Certificate",
              title: name.trim() || "Anonymous Participant",
              headline: `${result.estimate} est. score`,
              lines: [
                `${result.correct} of ${items.length} items solved within the 20-second limit.`,
                `Approx. ${result.percentile}th percentile · strongest area: ${result.strongest}`,
              ],
              footer: "sensesofvoid.app · entertainment estimate, not a standardized IQ assessment",
              fileName: "senses-of-void-cognitive-certificate.png",
              toolName: "Quick IQ Test",
              toolPath: "/tools/iq",
              text: `I scored ${result.estimate} (${result.percentile}th percentile) on the Senses of Void IQ test.`,
            }}
          />
        </div>
      </ToolShell>
    );
  }

  const item = items[index]!;

  return (
    <ToolShell
      eyebrow="Tool 02 · Cognition"
      slug="iq"
      title="Quick IQ Test"
      intro="Answer before the timer empties — unanswered items auto-advance and count as missed."
    >
      <div className="glass rounded-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <span className="label-mono">
            Item {index + 1} / {items.length} · {item.cat}
          </span>
          <span
            className={`flex items-center gap-1.5 font-mono text-sm ${left <= 5 ? "text-destructive" : "text-primary"}`}
            aria-live="polite"
          >
            <Timer className="size-4" aria-hidden="true" /> {left}s
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${left <= 5 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${(left / LIMIT) * 100}%` }}
          />
        </div>

        <h2 className="mt-7 text-center font-display text-xl leading-snug font-semibold text-balance sm:text-2xl">
          {item.prompt}
        </h2>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {item.shuffled.map((option, i) => (
            <button
              key={option}
              type="button"
              onClick={() => advance(i)}
              className="min-h-12 rounded-xl border border-hairline bg-surface-2/50 px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <QuizVipNudge step={index} total={items.length} />
    </ToolShell>
  );
}
