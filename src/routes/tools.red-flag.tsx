import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { QuizRunner } from "@/components/tools/QuizRunner";
import { QualityBadge } from "@/components/tools/QualityBadge";
import { RadarChart } from "@/components/tools/RadarChart";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import { LockedReport } from "@/components/monetization/LockedReport";
import { useAutoStart } from "@/lib/autostart";
import { bandOf, newSeed, pickBalanced, rngFrom, scoreDimensions, type Likert } from "@/lib/quiz-engine";
import { responseQuality } from "@/lib/psychometrics";
import { evaluateAttention, scorableItems, withAttentionChecks } from "@/lib/attention";
import { useNorms } from "@/hooks/use-norms";
import { RF_ACTIONS, RF_BANK, RF_NOTES, RF_PER_AXIS, RF_SESSION_SIZE, rfProfile } from "@/lib/banks/red-flag";


const URL = "https://sensesofvoid.app/tools/red-flag";
const OG = "https://sensesofvoid.app/og/red-flag.jpg";

export const Route = createFileRoute("/tools/red-flag")({
  head: () => ({
    meta: [
      { title: "Red Flag Test — Are You the Red Flag? (Free)" },
      {
        name: "description",
        content:
          "Twenty honest statements score control, jealousy, avoidance, volatility and honesty, then tell you whether you're green, amber or red in relationships. Free, no signup.",
      },
      { property: "og:title", content: "Red Flag Radar — Senses of Void" },
      {
        property: "og:description",
        content: "Green, amber or red? Twenty statements and an honest read on your relationship patterns.",
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
          name: "Red Flag Radar",
          url: URL,
          isAccessibleForFree: true,
          publisher: { "@type": "Organization", name: "Senses of Void", url: "https://sensesofvoid.app" },
        }),
      },
    ],
  }),
  component: RedFlag,
});

function RedFlag() {
  const [seed, setSeed] = useState(() => newSeed());
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});

  useAutoStart(() => setPhase("quiz"));

  // Drawn set plus two instructed-response traps, which never score an axis.
  const items: Likert[] = useMemo(
    () =>
      withAttentionChecks(
        pickBalanced(RF_BANK, (i) => i.dim, RF_PER_AXIS, rngFrom(seed)),
        rngFrom(seed + 1),
      ),
    [seed],
  );
  const scored = useMemo(() => scorableItems(items), [items]);

  const restart = useCallback(() => {
    setSeed(newSeed());
    setAnswers({});
    setTimings({});
    setPhase("quiz");
  }, []);

  const scores = useMemo(() => scoreDimensions(scored, answers), [scored, answers]);
  const profile = useMemo(() => rfProfile(scores), [scores]);
  const overall = useMemo(
    () =>
      scores.length ? Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length) : 0,
    [scores],
  );

  const quality = useMemo(
    () => responseQuality(scored, answers, timings, evaluateAttention(items, answers)),
    [items, scored, answers, timings],
  );

  const norms = useNorms("red-flag", scores, phase === "result");

  const notes = useMemo(
    () =>
      Object.fromEntries(scores.map((s) => [s.dim, RF_NOTES[s.dim]?.[bandOf(s.value)] ?? ""])),
    [scores],
  );

  const action = useMemo(() => {
    const top = [...scores].sort((a, b) => b.value - a.value)[0];
    return top ? (RF_ACTIONS[top.dim] ?? "") : "";
  }, [scores]);


  return (
    <ToolShell
      eyebrow="Tool 09 · Social"
      slug="red-flag"
      title="Red Flag Radar"
      intro={`${RF_SESSION_SIZE} statements about how you actually behave when things get tense — control, jealousy, avoidance, volatility and honesty. Answer honestly; it's about you, not them.`}
    >
      {phase === "intro" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono inline-flex items-center gap-2">
            <AlertTriangle className="size-4" aria-hidden="true" /> Self-reflection
          </span>
          <p className="mt-3 text-sm text-muted-foreground">
            Not a diagnosis and not a way to judge a partner — a mirror for your own patterns.
            Twenty-five statements plus two attention checks, about three minutes, ends in a green / amber / red share card with a confidence rating.
          </p>
          <button
            type="button"
            onClick={() => setPhase("quiz")}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground sm:w-auto"
          >
            Start the scan
          </button>
        </div>
      ) : null}

      {phase === "quiz" ? (
        <QuizRunner
          items={items}
          intro="How true is this of you — not of them?"
          onReshuffle={restart}
          onComplete={(all, meta) => {
            setAnswers(all);
            setTimings(meta?.timingsMs ?? {});
            setPhase("result");
          }}
        />
      ) : null}


      {phase === "result" ? (
        <div className="reveal">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <span className="label-mono">{profile.band} flag</span>
            <h2 className="mt-1 font-display text-4xl">{profile.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.blurb}</p>

            <QualityBadge
              className="mt-6"
              score={quality.score}
              label={quality.label}
              flags={quality.flags}
              notes={quality.notes}
              errorBand={quality.errorBand}
              answered={quality.answered}
              total={quality.total}
            />

            <div className="mt-7 rounded-2xl border border-hairline bg-surface-2/30 p-4">
              <RadarChart data={scores} />
              <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
                Overall friction {overall}/100 · lower is calmer
              </p>
            </div>

            <div className="mt-8">
              <LockedReport
                toolSlug="red-flag"
                title="Axis-by-axis breakdown"
                share={{
                  t: "red-flag",
                  n: "Red Flag Radar",
                  h: `${profile.band} · ${profile.name}`,
                  l: [profile.blurb],
                  p: "/tools/red-flag",
                }}
              >
                <div className="mt-6">
                  <TraitBars
                    data={scores}
                    notes={notes}
                    percentiles={norms.percentiles}
                    liveNorms={norms.live}
                  />
                  {action ? (
                    <p className="mt-6 rounded-xl border border-hairline bg-surface-2/40 p-4 text-sm leading-relaxed">
                      <span className="label-mono block">Your one change</span>
                      {action}
                    </p>
                  ) : null}
                </div>
              </LockedReport>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Research-informed scoring for self-reflection — not a clinical or diagnostic
              assessment.
            </p>
          </div>


          <ResultActions
            toolSlug="red-flag"
            onRetake={restart}
            payload={{
              eyebrow: "Red Flag Radar",
              title: "Red Flag Radar",
              headline: `${profile.band} · ${profile.name}`,
              lines: scores.map((s) => `${s.dim} ${s.value}`),
              fileName: "senses-of-void-red-flag.png",
              text: `I scored ${profile.band} on the Red Flag Radar — ${profile.name}.`,
              toolName: "Red Flag Radar",
              toolPath: "/tools/red-flag",
              accentSeed: profile.name,
              badge: profile.band,
              metrics: scores.map((s) => ({ label: s.dim, value: s.value })),
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
