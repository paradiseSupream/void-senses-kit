import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { ResultActions } from "@/components/tools/ResultActions";
import { useAutoStart } from "@/lib/autostart";
import { IQ_BANK } from "@/lib/banks/iq";
import { newSeed, percentileOf, rngFrom, shuffle, shuffleOptions } from "@/lib/quiz-engine";

const URL = "https://sensesofvoid.app/tools/logic";
const OG =
  "https://sensesofvoid.app/__l5e/assets-v1/053c4668-7074-4003-b960-9c801cb16d90/cover-iq.jpg";

const DURATION = 60;

export const Route = createFileRoute("/tools/logic")({
  head: () => ({
    meta: [
      { title: "60-Second Logic Sprint — Free Brain Speed Test" },
      {
        name: "description",
        content:
          "One minute, as many logic and pattern puzzles as you can solve. Scores speed and accuracy, then hands you a card to challenge friends with. Free, no signup.",
      },
      { property: "og:title", content: "Logic Sprint — Senses of Void" },
      {
        property: "og:description",
        content: "Sixty seconds of logic puzzles. How many can you clear before the clock does?",
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
          "@type": "Quiz",
          name: "Logic Sprint",
          url: URL,
          isAccessibleForFree: true,
          publisher: { "@type": "Organization", name: "Senses of Void", url: "https://sensesofvoid.app" },
        }),
      },
    ],
  }),
  component: LogicSprint,
});

function LogicSprint() {
  const [seed, setSeed] = useState(() => newSeed());
  const [phase, setPhase] = useState<"intro" | "run" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [left, setLeft] = useState(DURATION);

  useAutoStart(() => begin());

  const rand = useMemo(() => rngFrom(seed), [seed]);
  const items = useMemo(() => {
    const pool = IQ_BANK.filter((item) => item.cat === "Logic" || item.cat === "Pattern" || item.cat === "Number");
    return shuffle(pool, rngFrom(seed)).map((item) => ({ item, ...shuffleOptions(item, rand) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const begin = useCallback(() => {
    setSeed(newSeed());
    setIndex(0);
    setCorrect(0);
    setWrong(0);
    setLeft(DURATION);
    setPhase("run");
  }, []);

  useEffect(() => {
    if (phase !== "run") return;
    const id = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          setPhase("result");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const answer = (picked: number) => {
    const current = items[index];
    if (!current) return;
    if (picked === current.answer) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
    if (index + 1 >= items.length) setPhase("result");
    else setIndex(index + 1);
  };

  const attempted = correct + wrong;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const score = correct * 10 + Math.round(accuracy / 5);
  const percentile = percentileOf(Math.min(1, correct / 14));
  const band = correct >= 12 ? "Lightning" : correct >= 8 ? "Fast" : correct >= 5 ? "Steady" : "Warming up";

  const current = items[index];

  return (
    <ToolShell
      eyebrow="Tool 11 · Cognition"
      slug="logic"
      title="Logic Sprint"
      intro="Sixty seconds on the clock. Solve as many logic, pattern and number puzzles as you can — speed counts, but a wrong answer costs you accuracy."
    >
      {phase === "intro" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono inline-flex items-center gap-2">
            <Timer className="size-4" aria-hidden="true" /> 60 seconds
          </span>
          <p className="mt-3 text-sm text-muted-foreground">
            Fresh puzzle order every run, so a screenshot is worthless to whoever you challenge.
            Ends in a speed card with your count, accuracy and percentile.
          </p>
          <button
            type="button"
            onClick={begin}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground sm:w-auto"
          >
            Start the clock
          </button>
        </div>
      ) : null}

      {phase === "run" && current ? (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="label-mono">{current.item.cat}</span>
            <span className="label-mono">{left}s · {correct} solved</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
              style={{ width: `${(left / DURATION) * 100}%` }}
            />
          </div>

          <p className="mt-6 text-lg font-medium leading-snug">{current.item.prompt}</p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {current.options.map((option, i) => (
              <button
                key={option}
                type="button"
                onClick={() => answer(i)}
                className="min-h-12 rounded-xl border border-hairline px-4 text-left text-sm transition-colors hover:border-primary/50 hover:bg-surface-2"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "result" ? (
        <div className="reveal">
          <div className="glass rounded-2xl p-6 text-center sm:p-8">
            <span className="label-mono">Sprint score</span>
            <p className="mt-1 font-display text-6xl">{score}</p>
            <h2 className="mt-2 font-display text-2xl">{band}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {correct} solved in 60 seconds at {accuracy}% accuracy — around the {percentile}th
              percentile of runs on this test.
            </p>
          </div>

          <ResultActions
            toolSlug="logic"
            onRetake={begin}
            payload={{
              eyebrow: "Logic Sprint",
              title: "Logic Sprint",
              headline: `${score} · ${band}`,
              lines: [`Solved ${correct}`, `Accuracy ${accuracy}`, `Percentile ${percentile}`],
              fileName: "senses-of-void-logic-sprint.png",
              text: `I scored ${score} on the 60-second Logic Sprint. Beat it.`,
              toolName: "Logic Sprint",
              toolPath: "/tools/logic",
              accentSeed: band,
              badge: `${correct} in 60s`,
              metrics: [
                { label: "Solved", value: correct },
                { label: "Accuracy", value: accuracy },
                { label: "Percentile", value: percentile },
              ],
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
