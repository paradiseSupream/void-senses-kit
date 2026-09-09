import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { ResultActions } from "@/components/tools/ResultActions";
import { ResultExperience } from "@/components/tools/ResultExperience";
import { TraitBars } from "@/components/tools/TraitBars";
import { LockedReport } from "@/components/monetization/LockedReport";
import { DailyChallengeEntry } from "@/components/tools/DailyChallengeEntry";
import { useAutoStart } from "@/lib/autostart";
import { IQ_BANK } from "@/lib/banks/iq";
import { newSeed, percentileOf, rngFrom, shuffle, shuffleOptions } from "@/lib/quiz-engine";

const URL = "https://sensesofvoid.app/tools/logic";
const OG = "https://sensesofvoid.app/og/logic.jpg";

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

/** Fixed reading for each reasoning category shown in the locked report. */
const LOGIC_NOTES: Record<string, string> = {
  Logic: "Deductive items: word problems and syllogisms where the trap is the obvious answer. Strength here predicts good judgement under time pressure.",
  Pattern: "Sequence items: letters, symbols and alternating rules. This is the closest thing on the test to raw fluid reasoning.",
  Number: "Numeric series and arithmetic relations. Weakness here is usually speed, not ability — the rule is normally spotted a second too late.",
};

function LogicSprint() {
  const [seed, setSeed] = useState(() => newSeed());
  const [phase, setPhase] = useState<"intro" | "run" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [left, setLeft] = useState(DURATION);
  // Per-category hits/attempts, so the report can separate "slow but accurate"
  // from "fast and wrong" instead of collapsing both into one number.
  const [byCat, setByCat] = useState<Record<string, { hit: number; seen: number }>>({});

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
    setByCat({});
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
    const hit = picked === current.answer;
    if (hit) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
    setByCat((prev) => {
      const cat = current.item.cat;
      const bucket = prev[cat] ?? { hit: 0, seen: 0 };
      return { ...prev, [cat]: { hit: bucket.hit + (hit ? 1 : 0), seen: bucket.seen + 1 } };
    });
    if (index + 1 >= items.length) setPhase("result");
    else setIndex(index + 1);
  };

  const attempted = correct + wrong;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const score = correct * 10 + Math.round(accuracy / 5);
  const percentile = percentileOf(Math.min(1, correct / 14));
  const band = correct >= 12 ? "Lightning" : correct >= 8 ? "Fast" : correct >= 5 ? "Steady" : "Warming up";

  const breakdown = useMemo(
    () =>
      ["Logic", "Pattern", "Number"].map((cat) => {
        const bucket = byCat[cat];
        return {
          dim: cat,
          value: bucket && bucket.seen ? Math.round((bucket.hit / bucket.seen) * 100) : 0,
        };
      }),
    [byCat],
  );

  const speed = attempted ? Math.round((DURATION / attempted) * 10) / 10 : 0;

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
          <ResultExperience variant="logic-trace" eyebrow="60-second reasoning trace" title={band} score={score} status={`${percentile}th percentile`} description={`${correct} solved at ${accuracy}% accuracy, averaging ${speed}s across ${attempted} attempts.`} metrics={breakdown.map((metric) => ({ label: metric.dim, value: metric.value, note: LOGIC_NOTES[metric.dim] }))} meta={[`${correct} solved`, `${accuracy}% accuracy`, `${speed}s/item`]}>
            <div>
              <LockedReport
                toolSlug="logic"
                title="Reasoning breakdown by category"
                share={{
                  t: "logic",
                  n: "Logic Sprint",
                  h: `${score} · ${band}`,
                  l: [`${correct} solved at ${accuracy}% accuracy`],
                  p: "/tools/logic",
                }}
              >
                <div className="mt-6">
                  <TraitBars data={breakdown} notes={LOGIC_NOTES} />
                </div>
              </LockedReport>
            </div>
          </ResultExperience>

          <DailyChallengeEntry toolSlug="logic" score={Math.round(score)} />

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
