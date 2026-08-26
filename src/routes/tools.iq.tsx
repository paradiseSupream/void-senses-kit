import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { useAutoStart } from "@/lib/autostart";
import { markQuizInteraction } from "@/lib/engagement";
import { QuizVipNudge } from "@/components/monetization/QuizVipNudge";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import { LockedReport } from "@/components/monetization/LockedReport";
import { IQ_BANK, IQ_SESSION_SIZE } from "@/lib/banks/iq";
import { iqEstimate } from "@/lib/psychometrics";
import { QualityBadge } from "@/components/tools/QualityBadge";
import { newSeed, rngFrom, shuffleOptions, type IqItem } from "@/lib/quiz-engine";
import {
  buildAdaptivePool,
  drawItem,
  nextTier,
  reachedDifficulty,
  type AdaptivePool,
  type Tier,
} from "@/lib/adaptive-iq";

export const Route = createFileRoute("/tools/iq")({
  head: () => ({
    meta: [
      { title: "Quick IQ Test — 20 Randomised Timed Puzzles & HD Certificate" },
      {
        name: "description",
        content:
          "Twenty-five timed items drawn from a 67-question bank across number, logic, verbal, pattern and spatial reasoning, ending in a downloadable certificate with your percentile.",
      },
      { property: "og:title", content: "Quick IQ Test — Senses of Void" },
      {
        property: "og:description",
        content:
          "A different set of twenty-five timed puzzles every attempt, with a category breakdown and an HD certificate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://sensesofvoid.app/__l5e/assets-v1/ef330493-5525-426d-a192-99382f531ffd/cover-iq.jpg" },
      { name: "twitter:image", content: "https://sensesofvoid.app/__l5e/assets-v1/ef330493-5525-426d-a192-99382f531ffd/cover-iq.jpg" },
      { property: "og:url", content: "https://sensesofvoid.app/tools/iq" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/tools/iq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: "Quick IQ Test",
        url: "https://sensesofvoid.app/tools/iq",
        educationalLevel: "beginner",
        isAccessibleForFree: true,
        publisher: { "@type": "Organization", name: "Senses of Void", url: "https://sensesofvoid.app" },
      }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://sensesofvoid.app" },
            { "@type": "ListItem", position: 2, name: "Quick IQ Test", item: "https://sensesofvoid.app/tools/iq" },
          ],
        }),
      },
    ],
  }),
  component: IqTest,
});

const LIMIT = 20;

type Prepared = IqItem & { shuffled: string[]; correctIndex: number };

function prepare(item: IqItem, rand: () => number): Prepared {
  const { options, answer } = shuffleOptions(item, rand);
  return { ...item, shuffled: options, correctIndex: answer };
}

function IqTest() {
  const [seed, setSeed] = useState(() => newSeed());
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");

  // Chained sessions: /tools/x?auto=1 skips the intro and starts immediately.
  useAutoStart(() => setPhase("quiz"));
  const [index, setIndex] = useState(0);
  const [hits, setHits] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(LIMIT);
  const lockRef = useRef(false);
  // Per-item solve time + which items actually got an answer (vs timed out) —
  // both feed the difficulty-weighted estimate and its confidence grade.
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const shownAtRef = useRef(Date.now());

  // Adaptive delivery: items are drawn one at a time by a 2-up / 2-down
  // staircase, so difficulty converges on the point where the next answer is
  // genuinely uncertain — that is where a short test gains its precision.
  const [items, setItems] = useState<Prepared[]>([]);
  const randRef = useRef<() => number>(rngFrom(seed));
  const poolRef = useRef<AdaptivePool | null>(null);
  const usedCatRef = useRef<Record<string, number>>({});
  const tierRef = useRef<Tier>(1);
  const historyRef = useRef<boolean[]>([]);

  const startSession = useCallback((s: number) => {
    const rand = rngFrom(s);
    randRef.current = rand;
    const pool = buildAdaptivePool(IQ_BANK, rand);
    poolRef.current = pool;
    usedCatRef.current = {};
    tierRef.current = 1;
    historyRef.current = [];
    const first = drawItem(pool, 1, usedCatRef.current);
    usedCatRef.current[first!.cat] = 1;
    setItems(first ? [prepare(first, rand)] : []);
    setIndex(0);
    setHits({});
    setTimings({});
    setAnsweredIds([]);
    setLeft(LIMIT);
    shownAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    startSession(seed);
    // First mount only; every retake goes through `restart`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const restart = useCallback(() => {
    const s = newSeed();
    setSeed(s);
    startSession(s);
    setPhase("quiz");
  }, [startSession]);

  const advance = useCallback(
    (choice: number | null) => {
      if (lockRef.current) return;
      lockRef.current = true;
      markQuizInteraction();
      const item = items[index]!;
      const correct = choice !== null && choice === item.correctIndex;
      setHits((h) => ({ ...h, [item.id]: correct }));
      const elapsed = Math.min(Date.now() - shownAtRef.current, LIMIT * 1000);
      setTimings((t) => ({ ...t, [item.id]: elapsed }));
      if (choice !== null) setAnsweredIds((ids) => (ids.includes(item.id) ? ids : [...ids, item.id]));

      // Staircase: the answer just given moves the difficulty of the next item.
      historyRef.current = [...historyRef.current, correct];
      const tier = nextTier(tierRef.current, historyRef.current);
      tierRef.current = tier;

      window.setTimeout(() => {
        lockRef.current = false;
        if (index >= IQ_SESSION_SIZE - 1) {
          setPhase("result");
          return;
        }
        const pool = poolRef.current;
        const next = pool ? drawItem(pool, tier, usedCatRef.current) : null;
        if (!next) {
          setPhase("result");
          return;
        }
        usedCatRef.current[next.cat] = (usedCatRef.current[next.cat] ?? 0) + 1;
        setItems((list) => [...list, prepare(next, randRef.current)]);
        setIndex((i) => i + 1);
        setLeft(LIMIT);
        shownAtRef.current = Date.now();
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
    const est = iqEstimate(items, hits, {
      timingsMs: timings,
      answeredIds,
      difficulty: reachedDifficulty(items),
      adaptive: true,
    });
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
    return {
      correct: est.correct,
      estimate: est.iq,
      percentile: est.percentile,
      low: est.low,
      high: est.high,
      sem: est.sem,
      weighted: est.weighted,
      tiers: est.tiers,
      quality: est.quality,
      answered: est.answered,
      breakdown,
      strongest,
    };
  }, [hits, items, timings, answeredIds]);

  if (phase === "intro") {
    return (
      <ToolShell
        eyebrow="Tool 02 · Cognition"
        slug="iq"
        title="Quick IQ Test"
        intro="Twenty-five items drawn from a 67-question bank across five reasoning categories, twenty seconds each. Options are reshuffled too, so a screenshot helps nobody."
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
        intro="A difficulty-weighted estimate from twenty-five timed items across five reasoning categories, reported with its margin of error."
      >
        <div className="glass reveal rounded-2xl p-6 text-center sm:p-8">
          <span className="label-mono">Verified performance estimate</span>
          <p className="mt-4 font-display text-6xl font-bold text-primary">{result.estimate}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            68% band {result.low}–{result.high} (±{result.sem}) · approx. {result.percentile}th
            percentile
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.correct} of {items.length} correct · difficulty-weighted accuracy{" "}
            {result.weighted}%
          </p>
          <p className="mt-2 font-mono text-[0.7rem] tracking-wide text-muted-foreground uppercase">
            {result.tiers
              .filter((t) => t.value !== null)
              .map((t) => `T${t.tier} ${t.value}%`)
              .join(" · ")}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {name.trim() || "Anonymous Participant"} · strongest area: {result.strongest}
          </p>

          <QualityBadge
            className="mt-6 text-left"
            score={result.quality.score}
            label={result.quality.label}
            flags={result.quality.flags}
            notes={result.quality.notes}
            answered={result.answered}
            total={items.length}
          />

          <div className="mt-8">
            <LockedReport
              toolSlug="iq"
              title="Category-by-category score breakdown"
              share={{
                t: "iq",
                n: "Quick IQ Test",
                h: `${result.estimate}`,
                l: [`${result.percentile}th percentile`, `Strongest: ${result.strongest}`],
                p: "/tools/iq",
              }}
            >
          <div className="mt-8 text-left">
              <TraitBars data={result.breakdown} />
            </div>
            </LockedReport>
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
              accentSeed: `iq-${result.estimate}`,
              badge: `${result.percentile}th pct`,
              subject: name.trim() || undefined,
              metrics: [
                { label: "Score", value: Math.max(0, Math.min(100, (result.estimate - 60) / 0.9)) },
                { label: "Percentile", value: result.percentile },
                { label: "Solved", value: Math.round((result.correct / Math.max(1, items.length)) * 100) },
              ],
              text: `I scored ${result.estimate} (${result.percentile}th percentile) on the Senses of Void IQ test.`,
            }}
          />
        </div>
      </ToolShell>
    );
  }

  const item = items[index];
  if (!item) return null;

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
            Item {index + 1} / {IQ_SESSION_SIZE} · {item.cat} · T{item.tier}
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
      <QuizVipNudge step={index} total={IQ_SESSION_SIZE} />
    </ToolShell>
  );
}
