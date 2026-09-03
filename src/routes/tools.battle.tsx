/**
 * Compatibility Battle — a real two-player match, not a self-report quiz.
 *
 * Player one answers twelve scenarios and shares a link; player two answers
 * the identical set and the page computes agreement per axis, the biggest
 * clash and a verdict. Answers travel in the link, nothing is stored.
 */

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Share2, Swords } from "lucide-react";
import { toast } from "sonner";

import { ToolShell } from "@/components/layout/ToolShell";
import { ResultActions } from "@/components/tools/ResultActions";
import { TraitBars } from "@/components/tools/TraitBars";
import { decodeDuel, duelUrl, type DuelPayload } from "@/lib/duel-link";
import { trackShare, withUtm } from "@/lib/share-link";
import {
  BATTLE_AXES,
  BATTLE_BANK,
  BATTLE_PER_AXIS,
  BATTLE_SESSION_SIZE,
  battleItem,
  battleVerdict,
  type BattleItem,
} from "@/lib/banks/battle";

const SITE = "https://sensesofvoid.app";
const OG = `${SITE}/og/battle.jpg`;
const DESC =
  "Both of you answer the same twelve scenarios, separately. Get a real compatibility percentage across rhythm, values, conflict and play — plus the exact question you clash on. Free, no signup.";

export const Route = createFileRoute("/tools/battle")({
  validateSearch: (search: Record<string, unknown>) => ({
    k: typeof search.k === "string" ? search.k : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Compatibility Battle — Two-Player Match Test" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Compatibility Battle — Senses of Void" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Senses of Void" },
      { property: "og:url", content: `${SITE}/tools/battle` },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: OG },
      { name: "twitter:image", content: OG },
    ],
    links: [{ rel: "canonical", href: `${SITE}/tools/battle` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "Compatibility Battle",
          description: DESC,
          url: `${SITE}/tools/battle`,
          isAccessibleForFree: true,
          publisher: { "@type": "Organization", name: "Senses of Void", url: SITE },
        }),
      },
    ],
  }),
  component: Battle,
});

/** Three questions per axis, in a fixed readable order. */
function battleSet(): BattleItem[] {
  return BATTLE_AXES.flatMap((axis) =>
    BATTLE_BANK.filter((item) => item.axis === axis).slice(0, BATTLE_PER_AXIS),
  );
}

function Battle() {
  const search = Route.useSearch();
  const invite = useMemo<DuelPayload | null>(
    () => (search.k ? decodeDuel(search.k, "bt") : null),
    [search.k],
  );

  const items = useMemo(
    () =>
      invite
        ? invite.q.map((id) => battleItem(id)).filter((i): i is BattleItem => Boolean(i))
        : battleSet(),
    [invite],
  );

  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const done = answers.length >= items.length && items.length > 0;
  const current = items[index];

  const link = useMemo(() => {
    if (!done || invite) return "";
    const raw = duelUrl("/tools/battle", {
      k: "bt",
      n: name.trim(),
      q: items.map((i) => i.id),
      a: answers,
    });
    return withUtm(raw, {
      source: "battle",
      medium: "challenge",
      campaign: "battle",
      content: "invite_link",
    });
  }, [done, invite, name, items, answers]);

  const axisScores = useMemo(() => {
    if (!invite || !done) return [];
    return BATTLE_AXES.map((axis) => {
      const idx = items
        .map((item, i) => ({ item, i }))
        .filter(({ item }) => item.axis === axis);
      const hits = idx.filter(({ i }) => answers[i] === invite.a[i]).length;
      return { dim: axis, value: idx.length ? Math.round((hits / idx.length) * 100) : 0 };
    });
  }, [invite, done, items, answers]);

  const pct = axisScores.length
    ? Math.round(axisScores.reduce((sum, s) => sum + s.value, 0) / axisScores.length)
    : 0;
  const verdict = battleVerdict(pct);
  const partner = invite?.n || "them";
  const clash = useMemo(() => {
    if (!invite || !done) return null;
    const i = items.findIndex((_, idx) => answers[idx] !== invite.a[idx]);
    return i >= 0 ? { item: items[i]!, mine: answers[i]!, theirs: invite.a[i]! } : null;
  }, [invite, done, items, answers]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied — send it to your other half.");
    } catch {
      toast.error("Copy failed — long-press the link instead.");
    }
    trackShare({ source: "copy", campaign: "battle", content: "invite_link", toolSlug: "battle" });
  };

  const nativeShare = async () => {
    trackShare({ source: "native", campaign: "battle", content: "invite_link", toolSlug: "battle" });
    try {
      if (navigator.share) {
        await navigator.share({ title: "Compatibility Battle", text: "Answer these twelve. Let's see the match.", url: link });
      } else {
        await copy();
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <ToolShell
      eyebrow="Tool 13 · Social"
      slug="battle"
      title={invite ? `Battle vs ${partner}` : "Compatibility Battle"}
      intro={
        invite
          ? `${partner} already answered these ${items.length} scenarios. Answer them honestly and the match is calculated the moment you finish.`
          : `${BATTLE_SESSION_SIZE} scenarios across rhythm, values, conflict and play. You answer first, then send one link — the match only appears once both sides have answered.`
      }
    >
      {!started && !done ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono inline-flex items-center gap-2">
            <Swords className="size-4" aria-hidden="true" /> Two players
          </span>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {invite
              ? "No peeking is possible — their answers stay hidden until yours are locked in."
              : "Answer alone, share the link, and let them answer alone. That's what makes the number honest."}
          </p>
          {!invite ? (
            <label className="mt-6 block">
              <span className="label-mono">Your first name (optional)</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 16))}
                placeholder="e.g. Alex"
                className="mt-2 min-h-12 w-full rounded-xl border border-hairline bg-surface-2 px-4 text-base outline-none focus:border-primary/60"
              />
            </label>
          ) : null}
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground sm:w-auto"
          >
            {invite ? "Answer now" : "Start the battle"}
          </button>
        </div>
      ) : null}

      {started && !done && current ? (
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
          <h2 className="mt-6 font-display text-2xl leading-snug">{current.q}</h2>
          <div className="mt-5 grid gap-3">
            {current.opts.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setAnswers((prev) => [...prev, i]);
                  setIndex((n) => n + 1);
                }}
                className="min-h-14 rounded-2xl border border-hairline px-5 py-4 text-left text-base transition-colors hover:border-primary/50 hover:bg-surface-2"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {done && !invite ? (
        <div className="reveal glass rounded-2xl p-6 sm:p-8">
          <span className="label-mono">Half of the battle is done</span>
          <h2 className="mt-2 font-display text-3xl">Send this to the other player</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Your answers are sealed inside the link. The match percentage appears on their screen —
            ask them to screenshot it, or have them send you their result card.
          </p>
          <p className="mt-5 break-all rounded-xl border border-hairline bg-surface-2 p-4 font-mono text-xs">
            {link}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={nativeShare}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
            >
              <Share2 className="size-4" aria-hidden="true" /> Send link
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-hairline px-6 text-sm font-semibold"
            >
              <Copy className="size-4" aria-hidden="true" /> Copy
            </button>
          </div>
        </div>
      ) : null}

      {done && invite ? (
        <div className="reveal">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <span className="label-mono">Match with {partner}</span>
            <h2 className="mt-1 font-display text-6xl leading-none">{pct}%</h2>
            <h3 className="mt-4 font-display text-2xl">{verdict.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{verdict.blurb}</p>

            <div className="mt-7">
              <TraitBars data={axisScores} />
            </div>

            {clash ? (
              <div className="mt-7 rounded-xl border border-hairline bg-surface-2 p-4 text-sm">
                <span className="label-mono block">Biggest clash</span>
                <p className="mt-2">{clash.item.q}</p>
                <p className="mt-2 text-muted-foreground">
                  You: {clash.item.opts[clash.mine]} · {partner}: {clash.item.opts[clash.theirs]}
                </p>
              </div>
            ) : (
              <p className="mt-7 text-sm text-muted-foreground">
                Not a single disagreement across all {items.length} scenarios.
              </p>
            )}
          </div>

          <ResultActions
            toolSlug="battle"
            onRetake={() => {
              setAnswers([]);
              setIndex(0);
              setStarted(false);
            }}
            payload={{
              eyebrow: "Compatibility Battle",
              title: `Match with ${partner}`,
              headline: `${pct}%`,
              lines: axisScores.map((s) => `${s.dim} ${s.value}`),
              fileName: "senses-of-void-battle.png",
              text: `We scored ${pct}% — ${verdict.name} — on the Compatibility Battle.`,
              toolName: "Compatibility Battle",
              toolPath: "/tools/battle",
              accentSeed: verdict.name,
              badge: verdict.name,
              subject: partner,
              metrics: axisScores.map((s) => ({ label: s.dim, value: s.value })),
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
