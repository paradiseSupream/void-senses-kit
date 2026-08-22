import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ghost } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { QuizRunner } from "@/components/tools/QuizRunner";
import { RadarChart } from "@/components/tools/RadarChart";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import {
  DARK_ARCHETYPES,
  DARK_BANK,
  DARK_NOTES,
  DARK_PER_DIM,
  DARK_SESSION_SIZE,
} from "@/lib/banks/dark";
import { newSeed, pickBalanced, rngFrom, scoreDimensions, type Likert } from "@/lib/quiz-engine";

export const Route = createFileRoute("/tools/dark-personality")({
  head: () => ({
    meta: [
      { title: "Dark Personality Test — 18 Items, Six Shadow Traits" },
      {
        name: "description",
        content:
          "Eighteen randomised statements weigh strategy, detachment, ambition, control, charm and defiance to reveal your dominant shadow archetype.",
      },
      { property: "og:title", content: "Dark Personality Test — Senses of Void" },
      {
        property: "og:description",
        content:
          "Mastermind, Phantom, Architect, Ghost, Siren or Outlaw? A different question set every attempt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DarkPersonality,
});

function DarkPersonality() {
  const [seed, setSeed] = useState(() => newSeed());
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const items: Likert[] = useMemo(
    () => pickBalanced(DARK_BANK, (i) => i.dim, DARK_PER_DIM, rngFrom(seed)),
    [seed],
  );

  const reshuffle = useCallback(() => {
    setSeed(newSeed());
    setAnswers({});
    setPhase("quiz");
  }, []);

  const result = useMemo(() => {
    const scores = scoreDimensions(items, answers);
    const sorted = [...scores].sort((a, b) => b.value - a.value);
    const top = sorted[0]?.dim ?? "Strategy";
    const second = sorted[1]?.dim ?? "Control";
    const intensity = scores.length
      ? Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length)
      : 0;
    return {
      scores,
      top,
      second,
      intensity,
      archetype: DARK_ARCHETYPES[top] ?? DARK_ARCHETYPES.Strategy!,
    };
  }, [items, answers]);

  return (
    <ToolShell
      eyebrow="Tool 03 · Psyche"
      slug="dark-personality"
      title="Dark Personality Test"
      intro="Eighteen statements pulled fresh from a 48-item bank, scoring six shadow traits. No two attempts share the same set, so the archetype you get is earned, not memorised."
    >
      {phase === "intro" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono">What you'll get</span>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>Six trait scores: strategy, detachment, ambition, control, charm, defiance.</li>
            <li>One of six archetypes, plus the edge that comes with it.</li>
            <li>A radar visual and a downloadable share card.</li>
          </ul>
          <p className="mt-5 rounded-xl border border-hairline bg-surface-2/40 p-3.5 text-sm italic">
            “I read the room for leverage before I speak.”
          </p>
          <button
            type="button"
            onClick={() => setPhase("quiz")}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Begin · {DARK_SESSION_SIZE} questions
          </button>
        </div>
      ) : null}

      {phase === "quiz" ? (
        <QuizRunner
          items={items}
          intro="How accurate is this about you?"
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
            <Ghost className="size-3.5 text-secondary" aria-hidden="true" /> shadow archetype
          </span>
          <h2 className="mt-3 font-display text-3xl leading-tight font-bold text-primary sm:text-4xl">
            {result.archetype.name}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{result.archetype.blurb}</p>
          <p className="mt-2 text-sm text-foreground/80">{result.archetype.edge}</p>

          <div className="mt-7 rounded-2xl border border-hairline bg-surface-2/30 p-4">
            <RadarChart data={result.scores} />
            <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
              Shadow intensity {result.intensity}/100 · dominant {result.top}, backed by{" "}
              {result.second}
            </p>
          </div>

          <div className="mt-8">
            <TraitBars data={result.scores} notes={DARK_NOTES} />
          </div>

          <ResultActions
            toolSlug="dark-personality"
            onRetake={reshuffle}
            payload={{
              eyebrow: "Dark Personality Test",
              title: "Shadow archetype",
              headline: result.archetype.name,
              lines: [
                result.archetype.blurb,
                `Shadow intensity ${result.intensity}/100 · dominant ${result.top}`,
              ],
              footer: "sensesofvoid.app · entertainment personality read",
              fileName: "senses-of-void-shadow-archetype.png",
              text: `I'm ${result.archetype.name} — shadow intensity ${result.intensity}/100 on Senses of Void.`,
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
