import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ToolShell } from "@/components/layout/ToolShell";
import { useAutoStart } from "@/lib/autostart";
import { QuizRunner } from "@/components/tools/QuizRunner";
import { QualityBadge } from "@/components/tools/QualityBadge";
import { ResultActions } from "@/components/tools/ResultActions";
import { ResultExperience } from "@/components/tools/ResultExperience";
import { TraitBars } from "@/components/tools/TraitBars";
import { LockedReport } from "@/components/monetization/LockedReport";
import {
  TRAUMA_BANK,
  TRAUMA_NOTES,
  TRAUMA_PER_DIM,
  TRAUMA_SESSION_SIZE,
  traumaArchetype,
} from "@/lib/banks/trauma";
import {
  bandOf,
  newSeed,
  pickBalanced,
  rngFrom,
  scoreDimensions,
  type Likert,
} from "@/lib/quiz-engine";
import { responseQuality } from "@/lib/psychometrics";
import { evaluateAttention, scorableItems, withAttentionChecks } from "@/lib/attention";
import { useNorms } from "@/hooks/use-norms";

export const Route = createFileRoute("/tools/child-trauma")({
  head: () => ({
    meta: [
      { title: "Child Trauma Test — 18 Randomised Questions & Radar Report" },
      {
        name: "description",
        content:
          "Twenty-four randomised statements map six childhood dimensions — safety, trust, voice, attachment, self-worth and regulation — into a radar report you can download.",
      },
      { property: "og:title", content: "Child Trauma Test — Senses of Void" },
      {
        property: "og:description",
        content:
          "A fresh randomised set every attempt, scored on your device into a six-axis radar and written reflection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://sensesofvoid.app/__l5e/assets-v1/de0c2b33-a0b2-46c6-a2ac-a749af315b8e/cover-child-trauma.jpg" },
      { name: "twitter:image", content: "https://sensesofvoid.app/__l5e/assets-v1/de0c2b33-a0b2-46c6-a2ac-a749af315b8e/cover-child-trauma.jpg" },
      { property: "og:url", content: "https://sensesofvoid.app/tools/child-trauma" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/tools/child-trauma" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: "Child Trauma Test",
        url: "https://sensesofvoid.app/tools/child-trauma",
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
            { "@type": "ListItem", position: 2, name: "Child Trauma Test", item: "https://sensesofvoid.app/tools/child-trauma" },
          ],
        }),
      },
    ],
  }),
  component: ChildTrauma,
});

function ChildTrauma() {
  const [seed, setSeed] = useState(() => newSeed());
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");

  // Chained sessions: /tools/x?auto=1 skips the intro and starts immediately.
  useAutoStart(() => setPhase("quiz"));
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});

  // Drawn set plus two instructed-response attention checks, which are never
  // scored into a dimension — they only grade whether the answers were read.
  const items: Likert[] = useMemo(
    () =>
      withAttentionChecks(
        pickBalanced(TRAUMA_BANK, (i) => i.dim, TRAUMA_PER_DIM, rngFrom(seed)),
        rngFrom(seed + 1),
      ),
    [seed],
  );
  const scored = useMemo(() => scorableItems(items), [items]);

  // Measurement confidence for this exact session: completeness, response
  // style, within-axis agreement, answer speed and attention checks.
  const quality = useMemo(
    () => responseQuality(scored, answers, timings, evaluateAttention(items, answers)),
    [items, scored, answers, timings],
  );

  const reshuffle = useCallback(() => {
    setSeed(newSeed());
    setAnswers({});
    setTimings({});
    setPhase("quiz");
  }, []);

  const result = useMemo(() => {
    const scores = scoreDimensions(scored, answers);
    const sorted = [...scores].sort((a, b) => b.value - a.value);
    const top = sorted[0]?.dim ?? "Safety";
    const low = sorted[sorted.length - 1]?.dim ?? "Trust";
    const overall = scores.length
      ? Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length)
      : 0;
    return { scores, top, low, overall, archetype: traumaArchetype(top, low) };
  }, [scored, answers]);

  // Percentiles from this site's own anonymous score pool once it is big
  // enough; the reference curve until then.
  const norms = useNorms("child-trauma", result.scores, phase === "result");

  const notes = useMemo(
    () =>
      Object.fromEntries(
        result.scores.map((s) => [s.dim, TRAUMA_NOTES[s.dim]?.[bandOf(s.value)] ?? ""]),
      ),
    [result.scores],
  );

  return (
    <ToolShell
      eyebrow="Tool 01 · Psyche"
      slug="child-trauma"
      title="Child Trauma Test"
      intro="Twenty-four statements about growing up, drawn fresh from a 48-item bank every attempt. Answer on instinct — the score maps how dependable six emotional dimensions felt, not how damaged you are."
    >
      {phase === "intro" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono">What you'll get</span>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>A six-axis radar of safety, trust, voice, attachment, self-worth and regulation.</li>
            <li>A written read on each axis, worded for your specific band.</li>
            <li>An archetype name and a downloadable HD card you can share.</li>
          </ul>
          <p className="mt-5 rounded-xl border border-hairline bg-surface-2/40 p-3.5 text-sm italic">
            “{TRAUMA_BANK[0]?.text}”
          </p>
          <button
            type="button"
            onClick={() => setPhase("quiz")}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Begin · {TRAUMA_SESSION_SIZE} questions
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Nothing is uploaded. Every attempt draws a different question set.
          </p>
        </div>
      ) : null}

      {phase === "quiz" ? (
        <QuizRunner
          items={items}
          intro="How true was this for you growing up?"
          onReshuffle={reshuffle}
          onComplete={(all, meta) => {
            setAnswers(all);
            setTimings(meta?.timingsMs ?? {});
            setPhase("result");
          }}
        />
      ) : null}

      {phase === "result" ? (
        <div className="reveal">
        <ResultExperience variant="impact-map" eyebrow="childhood pattern map" title={result.archetype.name} score={result.overall} scoreSuffix="/100" status="Reflective, not diagnostic" description={result.archetype.punch} metrics={result.scores.map((metric) => ({ label: metric.dim, value: metric.value, note: notes[metric.dim] }))}>
          <QualityBadge
            className="result-quality"
            score={quality.score}
            label={quality.label}
            flags={quality.flags}
            notes={quality.notes}
            errorBand={quality.errorBand}
            answered={quality.answered}
            total={quality.total}
          />

          <div>
            <LockedReport
              toolSlug="child-trauma"
              title="Dimension-by-dimension breakdown"
              share={{
                t: "child-trauma",
                n: "Child Trauma Test",
                h: `${result.archetype.name} · ${result.overall}/100`,
                l: [result.archetype.punch],
                p: "/tools/child-trauma",
              }}
            >
          <div className="mt-8">
              <TraitBars
                data={result.scores}
                notes={notes}
                percentiles={norms.percentiles}
                liveNorms={norms.live}
              />
            </div>
            </LockedReport>
          </div>

        </ResultExperience>
          <ResultActions
            toolSlug="child-trauma"
            onRetake={reshuffle}
            payload={{
              eyebrow: "Child Trauma Test",
              title: result.archetype.name,
              headline: `${result.overall}/100`,
              lines: [
                result.archetype.punch,
                result.scores
                  .map((s) => `${s.dim} ${s.value}`)
                  .join("  ·  "),
              ],
              footer: "sensesofvoid.app · reflection tool, not a clinical assessment",
              fileName: "senses-of-void-childhood-map.png",
              toolName: "Child Trauma Test",
              toolPath: "/tools/child-trauma",
              accentSeed: result.archetype.name,
              badge: `${result.overall}/100`,
              subject: result.archetype.name,
              metrics: result.scores.slice(0, 4).map((s) => ({ label: s.dim, value: s.value })),
              text: `I got ${result.archetype.name} (${result.overall}/100) on the Senses of Void childhood map.`,
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
