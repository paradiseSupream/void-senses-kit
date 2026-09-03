import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import { useAutoStart } from "@/lib/autostart";
import { newSeed, pickBalanced, rngFrom, SCALE, scoreDimensions } from "@/lib/quiz-engine";
import { RF_BANK, RF_PER_AXIS, RF_SESSION_SIZE, rfProfile } from "@/lib/banks/red-flag";

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
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useAutoStart(() => setPhase("quiz"));

  const items = useMemo(
    () => pickBalanced(RF_BANK, (i) => i.dim, RF_PER_AXIS, rngFrom(seed)),
    [seed],
  );

  const restart = useCallback(() => {
    setSeed(newSeed());
    setAnswers({});
    setIndex(0);
    setPhase("quiz");
  }, []);

  const scores = useMemo(() => scoreDimensions(items, answers), [items, answers]);
  const profile = useMemo(() => rfProfile(scores), [scores]);

  const answer = (id: string, weight: number) => {
    setAnswers((prev) => ({ ...prev, [id]: weight }));
    if (index + 1 >= items.length) setPhase("result");
    else setIndex(index + 1);
  };

  const current = items[index];

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
            Twenty statements, about three minutes, ends in a green / amber / red share card.
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

      {phase === "quiz" && current ? (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="label-mono">
              {index + 1} / {items.length}
            </span>
            <span className="label-mono">{current.dim}</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${((index + 1) / items.length) * 100}%` }}
            />
          </div>

          <p className="mt-6 text-lg font-medium leading-snug">{current.text}</p>

          <div className="mt-6 grid gap-2">
            {SCALE.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => answer(current.id, option.weight)}
                className="min-h-12 rounded-xl border border-hairline px-4 text-left text-sm transition-colors hover:border-primary/50 hover:bg-surface-2"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "result" ? (
        <div className="reveal">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <span className="label-mono">{profile.band} flag</span>
            <h2 className="mt-1 font-display text-4xl">{profile.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.blurb}</p>

            <div className="mt-7">
              <TraitBars data={scores} />
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              For reflection and entertainment only — not a clinical or diagnostic assessment.
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
