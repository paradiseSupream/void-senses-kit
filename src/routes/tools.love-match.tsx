import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { useAutoStart } from "@/lib/autostart";
import { QuizRunner } from "@/components/tools/QuizRunner";
import { RadarChart } from "@/components/tools/RadarChart";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import { LockedReport } from "@/components/monetization/LockedReport";
import { LOVE_BANK, LOVE_PER_DIM, LOVE_SESSION_SIZE, loveVerdict } from "@/lib/banks/love";
import { newSeed, pickBalanced, rngFrom, scoreDimensions, type Likert } from "@/lib/quiz-engine";

export const Route = createFileRoute("/tools/love-match")({
  head: () => ({
    meta: [
      { title: "Love & Vibe Matcher — 15-Question Compatibility Read" },
      {
        name: "description",
        content:
          "Fifteen randomised questions score banter, trust, adventure, calm and spark between two people, ending in a verdict card built for stories.",
      },
      { property: "og:title", content: "Love & Vibe Matcher — Senses of Void" },
      {
        property: "og:description",
        content: "Five chemistry dimensions, a resonance score and a share card. For fun only.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://sensesofvoid.app/tools/love-match" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/tools/love-match" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: "Love & Vibe Matcher",
        url: "https://sensesofvoid.app/tools/love-match",
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
            { "@type": "ListItem", position: 2, name: "Love & Vibe Matcher", item: "https://sensesofvoid.app/tools/love-match" },
          ],
        }),
      },
    ],
  }),
  component: LoveMatch,
});

function LoveMatch() {
  const [seed, setSeed] = useState(() => newSeed());
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");

  // Chained sessions: /tools/x?auto=1 skips the intro and starts immediately.
  useAutoStart(() => setPhase("quiz"));
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const items: Likert[] = useMemo(
    () => pickBalanced(LOVE_BANK, (i) => i.dim, LOVE_PER_DIM, rngFrom(seed)),
    [seed],
  );

  const reshuffle = useCallback(() => {
    setSeed(newSeed());
    setAnswers({});
    setPhase("quiz");
  }, []);

  const pair = `${a.trim() || "You"} + ${b.trim() || "Them"}`;

  const result = useMemo(() => {
    const scores = scoreDimensions(items, answers);
    const score = scores.length
      ? Math.round(scores.reduce((acc, s) => acc + s.value, 0) / scores.length)
      : 0;
    const sorted = [...scores].sort((x, y) => y.value - x.value);
    return {
      scores,
      score,
      strongest: sorted[0]?.dim ?? "Trust",
      weakest: sorted[sorted.length - 1]?.dim ?? "Calm",
      verdict: loveVerdict(score),
    };
  }, [items, answers]);

  return (
    <ToolShell
      eyebrow="Tool 04 · Social"
      slug="love-match"
      title="Love & Vibe Matcher"
      intro="Fifteen questions about how the two of you actually operate — banter, trust, adventure, calm and spark. Drawn fresh from a 45-item bank each time, so retaking gives a real second opinion."
    >
      {phase === "intro" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono">Who is this about?</span>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              className="min-h-11 rounded-xl border border-hairline bg-surface-2/70 px-3 text-sm focus:border-primary/50"
            />
            <input
              value={b}
              onChange={(e) => setB(e.target.value)}
              placeholder="Their name"
              aria-label="Their name"
              className="min-h-11 rounded-xl border border-hairline bg-surface-2/70 px-3 text-sm focus:border-primary/50"
            />
          </div>
          <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
            <li>A resonance score across five relationship dimensions.</li>
            <li>Your strongest bond and the one that needs maintenance.</li>
            <li>A verdict card built to be screenshotted.</li>
          </ul>
          <button
            type="button"
            onClick={() => setPhase("quiz")}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Begin · {LOVE_SESSION_SIZE} questions
          </button>
        </div>
      ) : null}

      {phase === "quiz" ? (
        <QuizRunner
          items={items}
          intro={`About ${pair}`}
          onReshuffle={reshuffle}
          onComplete={(all) => {
            setAnswers(all);
            setPhase("result");
          }}
        />
      ) : null}

      {phase === "result" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono flex items-center gap-2">
            <HeartPulse className="size-3.5 text-secondary" aria-hidden="true" /> {pair}
          </span>
          <p className="mt-4 font-display text-6xl font-bold text-primary">{result.score}%</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">{result.verdict.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{result.verdict.line}</p>
          <p className="mt-2 text-sm text-foreground/80">
            Strongest together in <strong>{result.strongest}</strong>; the one to protect is{" "}
            <strong>{result.weakest}</strong>.
          </p>

          <div className="mt-7 rounded-2xl border border-hairline bg-surface-2/30 p-4">
            <RadarChart data={result.scores} />
          </div>

          <div className="mt-8">
            <LockedReport
              toolSlug="love-match"
              title="Full compatibility breakdown"
              share={{
                t: "love-match",
                n: "Love & Vibe Matcher",
                h: `${result.score}% resonance`,
                l: [result.verdict.title, `Strongest: ${result.strongest}`],
                p: "/tools/love-match",
              }}
            >
          <div className="mt-8">
              <TraitBars data={result.scores} />
            </div>
            </LockedReport>
          </div>

          <ResultActions
            toolSlug="love-match"
            onRetake={reshuffle}
            payload={{
              eyebrow: "Love & Vibe Matcher",
              title: pair,
              headline: `${result.score}% resonance`,
              lines: [
                `${result.verdict.title} — ${result.verdict.line}`,
                `Strongest: ${result.strongest} · protect: ${result.weakest}`,
              ],
              footer: "sensesofvoid.app · for fun, not fate",
              fileName: "senses-of-void-vibe-match.png",
              toolName: "Love & Vibe Matcher",
              toolPath: "/tools/love-match",
              text: `${pair} scored ${result.score}% — ${result.verdict.title} on Senses of Void.`,
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
