import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ghost, Loader2, Lock } from "lucide-react";

import { ToolShell } from "@/components/layout/ToolShell";
import { useAutoStart } from "@/lib/autostart";
import { takeCarriedAnswer } from "@/lib/entry-carry";
import { QuizRunner } from "@/components/tools/QuizRunner";
import { RadarChart } from "@/components/tools/RadarChart";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import { LockedReport } from "@/components/monetization/LockedReport";
import { ShadowDossier } from "@/components/tools/ShadowDossier";
import { MatrixUpsellModal } from "@/components/monetization/MatrixUpsellModal";
import { useVipSuccessUnlock } from "@/lib/vip-unlock";
import {
  DARK_BANK,
  DARK_NOTES,
  DARK_PER_DIM,
  DARK_SESSION_SIZE,
  DARK_SHORT,
} from "@/lib/banks/dark";
import { freeSummary } from "@/lib/archetype-core";
import { usePremiumDossier } from "@/lib/premium-dossier";
import { newSeed, pickBalanced, rngFrom, scoreDimensions, type Likert } from "@/lib/quiz-engine";

type Search = { auto?: string; vip_order?: string; matrix_order?: string };


export const Route = createFileRoute("/tools/dark-personality")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed: Search = {};
    for (const key of ["auto", "vip_order", "matrix_order"] as const) {
      if (typeof search[key] === "string") parsed[key] = search[key] as string;
    }
    return parsed;
  },
  head: () => ({
    meta: [
      { title: "Dark Personality Test — 6-Axis Shadow Archetype Profile" },
      {
        name: "description",
        content:
          "Twenty-four randomised items score Machiavellianism, narcissism, psychopathy, detachment, cognitive dominance and shadow integration, then name one of eight dark archetypes.",
      },
      { property: "og:title", content: "Dark Personality Test — Senses of Void" },
      {
        property: "og:description",
        content:
          "Sovereign Manipulator, Velvet Ghost, Dark Empath or Stoic Predator? Six psychometric axes, a different question set every attempt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://sensesofvoid.app/__l5e/assets-v1/5372e174-cb46-4786-8ef3-281c52a92138/cover-dark-personality.jpg" },
      { name: "twitter:image", content: "https://sensesofvoid.app/__l5e/assets-v1/5372e174-cb46-4786-8ef3-281c52a92138/cover-dark-personality.jpg" },
      { property: "og:url", content: "https://sensesofvoid.app/tools/dark-personality" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/tools/dark-personality" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: "Dark Personality Test",
        url: "https://sensesofvoid.app/tools/dark-personality",
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
            { "@type": "ListItem", position: 2, name: "Dark Personality Test", item: "https://sensesofvoid.app/tools/dark-personality" },
          ],
        }),
      },
    ],
  }),
  component: DarkPersonality,
});

function DarkPersonality() {
  // Question one may already be answered on the home hero. Draw a seed whose
  // balanced set contains that item so the answer actually counts; the set is
  // still randomly drawn and balanced exactly as before.
  const [carried] = useState(() => takeCarriedAnswer("dark-personality"));
  const [seed, setSeed] = useState(() => {
    let s = newSeed();
    if (!carried) return s;
    for (let i = 0; i < 40; i++) {
      const set = pickBalanced(DARK_BANK, (it) => it.dim, DARK_PER_DIM, rngFrom(s));
      if (set.some((it) => it.id === carried.id)) break;
      s = newSeed();
    }
    return s;
  });
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");

  // Chained sessions: /tools/x?auto=1 skips the intro and starts immediately.
  useAutoStart(() => setPhase("quiz"));
  const [answers, setAnswers] = useState<Record<string, number>>({});

  // ?vip_order= / ?matrix_order= → server-verified unlock, then clean the URL
  // and queue the one-time post-purchase upsell.
  const { showUpsell, dismissUpsell } = useVipSuccessUnlock();

  const items: Likert[] = useMemo(
    () => pickBalanced(DARK_BANK, (i) => i.dim, DARK_PER_DIM, rngFrom(seed)),
    [seed],
  );

  const reshuffle = useCallback(() => {
    setSeed(newSeed());
    setAnswers({});
    setPhase("quiz");
  }, []);

  // Free tier: scores, bands and the archetype card only. Every premium
  // paragraph comes from the entitlement-checked server function below.
  const summary = useMemo(() => freeSummary(scoreDimensions(items, answers)), [items, answers]);
  const scores = summary.axes.map((a) => ({ dim: a.dim, value: a.value }));
  const premium = usePremiumDossier(scores, phase === "result");

  return (
    <ToolShell
      eyebrow="Tool 03 · Psyche"
      slug="dark-personality"
      title="Dark Personality Test"
      intro="Twenty-four statements pulled fresh from a 48-item bank, scored across six psychometric axes. No two attempts share the same set, so the archetype you get is earned, not memorised."
    >
      {phase === "intro" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono">What you'll get</span>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              Six axis scores: Machiavellianism, narcissism, psychopathy, emotional detachment,
              cognitive dominance and shadow integration.
            </li>
            <li>One of eight core archetypes, plus the edge and the risk it carries.</li>
            <li>
              An interactive radar, a printable VIP dossier and a downloadable share card.
            </li>
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
          initialAnswers={carried ? { [carried.id]: carried.weight } : undefined}
          onComplete={(all) => {
            setAnswers(all);
            setPhase("result");
          }}
        />
      ) : null}

      {phase === "result" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          {showUpsell ? <MatrixUpsellModal onDismiss={dismissUpsell} /> : null}

          <span className="label-mono flex items-center gap-2">
            <Ghost className="size-3.5 text-secondary" aria-hidden="true" /> shadow archetype
          </span>
          <h2 className="mt-3 font-display text-3xl leading-tight font-bold text-primary sm:text-4xl">
            {summary.archetype.name}
          </h2>
          <p className="mt-1 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            {summary.archetype.tagline}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{summary.archetype.blurb}</p>
          <p className="mt-2 text-sm text-foreground/80">{summary.archetype.edge}</p>

          <div className="mt-7 rounded-2xl border border-hairline bg-surface-2/30 p-4">
            <RadarChart data={scores} labels={DARK_SHORT} />
            <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
              Shadow intensity {summary.intensity}/100 · dominant {summary.dominant}, backed by{" "}
              {summary.support}
            </p>
          </div>

          <div className="mt-8">
            <LockedReport
              toolSlug="dark-personality"
              title="Full six-axis dossier"
              blurb="Interactive axis breakdown, blind spots, defence mechanisms, behavioural prediction matrix, 1,500+ word shadow analysis and the printable PDF dossier."
              share={{
                t: "dark-personality",
                n: "Dark Personality Test",
                h: summary.archetype.name,
                l: [`Shadow intensity ${summary.intensity}/100`, `Dominant ${summary.dominant}`],
                p: "/tools/dark-personality",
              }}
            >
              <div className="mt-8 space-y-8">
                <TraitBars data={scores} notes={DARK_NOTES} />
                {premium.dossier ? (
                  <ShadowDossier
                    dossier={premium.dossier}
                    pdfToken={premium.pdfToken}
                    onTokenExpired={premium.refresh}
                  />
                ) : premium.loading ? (
                  <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Verifying your VIP
                    access and generating the dossier…
                  </p>
                ) : (
                  <div className="rounded-2xl border border-hairline bg-surface-2/40 p-5 text-center">
                    <span className="mx-auto grid size-10 place-items-center rounded-xl border border-hairline bg-background/60">
                      <Lock className="size-4 text-primary" aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 font-display text-base font-semibold">
                      VIP Shadow Dossier
                    </h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                      The 1,500+ word shadow analysis, blind spots, defence mechanisms, prediction
                      matrix and the print-ready PDF are generated on our server for verified VIP
                      members only.
                    </p>
                  </div>
                )}
              </div>
            </LockedReport>
          </div>

          <ResultActions
            toolSlug="dark-personality"
            onRetake={reshuffle}
            payload={{
              eyebrow: "Dark Personality Test",
              title: "Shadow archetype",
              headline: summary.archetype.name,
              lines: [
                summary.archetype.tagline,
                `Shadow intensity ${summary.intensity}/100 · dominant ${summary.dominant}`,
              ],
              footer: "sensesofvoid.app · entertainment personality read",
              fileName: "senses-of-void-shadow-archetype.png",
              toolName: "Dark Personality Test",
              toolPath: "/tools/dark-personality",
              text: `I'm ${summary.archetype.name} — shadow intensity ${summary.intensity}/100 on Senses of Void.`,
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
