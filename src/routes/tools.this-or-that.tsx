import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Split } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { RadarChart } from "@/components/tools/RadarChart";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import { LockedReport } from "@/components/monetization/LockedReport";
import { useNorms } from "@/hooks/use-norms";
import { useAutoStart } from "@/lib/autostart";
import { bandOf, newSeed, pickBalanced, rngFrom } from "@/lib/quiz-engine";
import {
  TOT_NOTES,
  TOT_BANK,
  TOT_PER_AXIS,
  TOT_SESSION_SIZE,
  totProfile,
  type TotItem,
} from "@/lib/banks/this-or-that";

const OG = "https://sensesofvoid.app/__l5e/assets-v1/053c4668-7074-4003-b960-9c801cb16d90/cover-dark-personality.jpg";

export const Route = createFileRoute("/tools/this-or-that")({
  head: () => ({
    meta: [
      { title: "This or That — 20 Forced-Choice Dilemmas" },
      {
        name: "description",
        content:
          "Twenty impossible two-option choices score impulse, loyalty, risk and candour, then name the profile you actually decide with. Free, no signup.",
      },
      { property: "og:title", content: "This or That — Senses of Void" },
      {
        property: "og:description",
        content: "Pick one. Twenty times. Then meet the decision profile behind your answers.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Senses of Void" },
      { property: "og:url", content: "https://sensesofvoid.app/tools/this-or-that" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: OG },
      { name: "twitter:image", content: OG },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/tools/this-or-that" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "This or That",
          url: "https://sensesofvoid.app/tools/this-or-that",
          isAccessibleForFree: true,
          publisher: {
            "@type": "Organization",
            name: "Senses of Void",
            url: "https://sensesofvoid.app",
          },
        }),
      },
    ],
  }),
  component: ThisOrThat,
});

function ThisOrThat() {
  const [seed, setSeed] = useState(() => newSeed());
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, "a" | "b">>({});

  useAutoStart(() => setPhase("quiz"));

  const items: TotItem[] = useMemo(
    () => pickBalanced(TOT_BANK, (i) => i.axis, TOT_PER_AXIS, rngFrom(seed)),
    [seed],
  );

  const restart = useCallback(() => {
    setSeed(newSeed());
    setPicks({});
    setIndex(0);
    setPhase("quiz");
  }, []);

  const scores = useMemo(() => {
    const totals: Record<string, { hits: number; total: number }> = {};
    for (const item of items) {
      const bucket = (totals[item.axis] ??= { hits: 0, total: 0 });
      bucket.total += 1;
      if (picks[item.id] === "a") bucket.hits += 1;
    }
    return Object.entries(totals).map(([dim, b]) => ({
      dim,
      value: b.total ? Math.round((b.hits / b.total) * 100) : 0,
    }));
  }, [items, picks]);

  const profile = useMemo(() => totProfile(scores), [scores]);

  const norms = useNorms("this-or-that", scores, phase === "result");

  const notes = useMemo(
    () => Object.fromEntries(scores.map((s) => [s.dim, TOT_NOTES[s.dim]?.[bandOf(s.value)] ?? ""])),
    [scores],
  );

  // How often the two sides were split rather than swept: a decisive profile
  // sweeps its axes, a conflicted one lands near 50 on several of them.
  const decisiveness = useMemo(() => {
    if (!scores.length) return 0;
    const spread = scores.reduce((a, s) => a + Math.abs(s.value - 50), 0) / scores.length;
    return Math.round(Math.min(100, (spread / 50) * 100));
  }, [scores]);

  const choose = (item: TotItem, side: "a" | "b") => {
    setPicks((prev) => ({ ...prev, [item.id]: side }));
    if (index + 1 >= items.length) setPhase("result");
    else setIndex(index + 1);
  };

  const current = items[index];

  return (
    <ToolShell
      eyebrow="Tool 08 · Psyche"
      slug="this-or-that"
      title="This or That"
      intro={`${TOT_SESSION_SIZE} two-option dilemmas with no comfortable middle. Every pick loads one side of impulse, loyalty, risk or candour — and the set is drawn fresh each time.`}
    >
      {phase === "intro" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono inline-flex items-center gap-2">
            <Split className="size-4" aria-hidden="true" /> Forced choice
          </span>
          <p className="mt-3 text-sm text-muted-foreground">
            No sliders, no “it depends”. Twenty times you pick one and live with it. Takes about
            two minutes and ends in a share card.
          </p>
          <button
            type="button"
            onClick={() => setPhase("quiz")}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground sm:w-auto"
          >
            Start picking
          </button>
        </div>
      ) : null}

      {phase === "quiz" && current ? (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="label-mono">
              {index + 1} / {items.length}
            </span>
            <span className="label-mono">{current.axis}</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${((index + 1) / items.length) * 100}%` }}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(["a", "b"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => choose(current, side)}
                className="min-h-28 rounded-2xl border border-hairline p-5 text-left text-base font-medium transition-colors hover:border-primary/50 hover:bg-surface-2"
              >
                <span className="label-mono block">{side === "a" ? "This" : "That"}</span>
                <span className="mt-2 block">{current[side]}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "result" ? (
        <div className="reveal">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <span className="label-mono">Your decision profile</span>
            <h2 className="mt-1 font-display text-4xl">{profile.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.blurb}</p>

            <div className="mt-7 rounded-2xl border border-hairline bg-surface-2/30 p-4">
              <RadarChart data={scores} />
              <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
                Decisiveness {decisiveness}/100 · how hard you leaned rather than split
              </p>
            </div>

            <div className="mt-8">
              <LockedReport
                toolSlug="this-or-that"
                title="What each axis says about you"
                share={{
                  t: "this-or-that",
                  n: "This or That",
                  h: profile.name,
                  l: [profile.blurb],
                  p: "/tools/this-or-that",
                }}
              >
                <div className="mt-6">
                  <TraitBars
                    data={scores}
                    notes={notes}
                    percentiles={norms.percentiles}
                    liveNorms={norms.live}
                  />
                </div>
              </LockedReport>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Forced-choice scoring compared against the live answer pool — for self-reflection,
              not a clinical assessment.
            </p>
          </div>

          <ResultActions
            toolSlug="this-or-that"
            onRetake={restart}
            payload={{
              eyebrow: "This or That",
              title: "This or That",
              headline: profile.name,
              lines: scores.map((s) => `${s.dim} ${s.value}`),
              fileName: "senses-of-void-this-or-that.png",
              text: `My decision profile is ${profile.name} on This or That.`,
              toolName: "This or That",
              toolPath: "/tools/this-or-that",
              accentSeed: profile.name,
              badge: profile.name,
              metrics: scores.map((s) => ({ label: s.dim, value: s.value })),
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
