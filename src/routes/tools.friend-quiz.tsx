/**
 * Friend Knowledge Quiz — the invite-first tool.
 *
 * Flow: you answer ten questions about yourself → we pack them into a private
 * link → your friend answers the same ten about you and gets scored against
 * your real answers. Nothing is stored: the answer key lives in the URL only.
 */

import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Link2, Share2, Users } from "lucide-react";
import { toast } from "sonner";

import { ToolShell } from "@/components/layout/ToolShell";
import { ResultActions } from "@/components/tools/ResultActions";
import { newSeed, rngFrom } from "@/lib/quiz-engine";
import { decodeDuel, duelUrl, type DuelPayload } from "@/lib/duel-link";
import { trackShare, withUtm } from "@/lib/share-link";
import { FQ_BANK, FQ_SESSION_SIZE, fqItem, fqVerdict, type FqItem } from "@/lib/banks/friend-quiz";

const SITE = "https://sensesofvoid.app";
const OG = `${SITE}/og/friend-quiz.jpg`;
const TITLE = "How Well Do You Know Me? — Friend Quiz Link";
const DESC =
  "Answer ten questions about yourself, get a private link, and see who actually knows you. Free, no signup, instant score for every friend who plays.";

export const Route = createFileRoute("/tools/friend-quiz")({
  validateSearch: (search: Record<string, unknown>) => ({
    k: typeof search.k === "string" ? search.k : undefined,
    n: typeof search.n === "string" ? search.n.slice(0, 16) : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: "How Well Do You Know Me? — Senses of Void" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Senses of Void" },
      { property: "og:url", content: `${SITE}/tools/friend-quiz` },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: OG },
      { name: "twitter:image", content: OG },
    ],
    links: [{ rel: "canonical", href: `${SITE}/tools/friend-quiz` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "How Well Do You Know Me?",
          description: DESC,
          url: `${SITE}/tools/friend-quiz`,
          isAccessibleForFree: true,
          publisher: { "@type": "Organization", name: "Senses of Void", url: SITE },
        }),
      },
    ],
  }),
  component: FriendQuiz,
});

function pickTen(seed: number): FqItem[] {
  const rng = rngFrom(seed);
  const pool = [...FQ_BANK];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, FQ_SESSION_SIZE);
}

function FriendQuiz() {
  const search = Route.useSearch();
  const invite = useMemo<DuelPayload | null>(
    () => (search.k ? decodeDuel(search.k, "fq") : null),
    [search.k],
  );

  return invite ? <PlayInvite invite={invite} /> : <BuildInvite />;
}

/* ------------------------------------------------------------ challenger */

function BuildInvite() {
  const [seed, setSeed] = useState(() => newSeed());
  const [phase, setPhase] = useState<"intro" | "answer" | "link">("intro");
  const [name, setName] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const items = useMemo(() => pickTen(seed), [seed]);
  const current = items[index];

  const link = useMemo(() => {
    if (phase !== "link") return "";
    const raw = duelUrl("/tools/friend-quiz", {
      k: "fq",
      n: name.trim(),
      q: items.map((i) => i.id),
      a: answers,
    });
    return withUtm(raw, {
      source: "friend_quiz",
      medium: "challenge",
      campaign: "friend-quiz",
      content: "invite_link",
    });
  }, [phase, name, items, answers]);

  const choose = (optIndex: number) => {
    const next = [...answers, optIndex];
    setAnswers(next);
    if (next.length >= items.length) setPhase("link");
    else setIndex(index + 1);
  };

  const restart = useCallback(() => {
    setSeed(newSeed());
    setAnswers([]);
    setIndex(0);
    setPhase("answer");
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied — send it to anyone.");
    } catch {
      toast.error("Copy failed — long-press the link instead.");
    }
    trackShare({ source: "copy", campaign: "friend-quiz", content: "invite_link", toolSlug: "friend-quiz" });
  };

  const nativeShare = async () => {
    trackShare({ source: "native", campaign: "friend-quiz", content: "invite_link", toolSlug: "friend-quiz" });
    try {
      if (navigator.share) {
        await navigator.share({ title: "How well do you know me?", text: "Ten questions. Let's see.", url: link });
      } else {
        await copy();
      }
    } catch {
      /* user dismissed the sheet */
    }
  };

  return (
    <ToolShell
      eyebrow="Tool 12 · Social"
      slug="friend-quiz"
      title="How Well Do You Know Me?"
      intro="You answer ten questions about yourself. We turn them into a private link. Everyone who opens it gets scored against your real answers — and you see who was actually paying attention."
    >
      {phase === "intro" ? (
        <div className="glass reveal rounded-2xl p-6 sm:p-8">
          <span className="label-mono inline-flex items-center gap-2">
            <Users className="size-4" aria-hidden="true" /> Invite-based
          </span>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Nothing is saved on our side — your answer key is encoded inside the link itself. Delete
            the link and the quiz is gone.
          </p>
          <label className="mt-6 block">
            <span className="label-mono">Your first name (optional)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 16))}
              placeholder="e.g. Sam"
              className="mt-2 min-h-12 w-full rounded-xl border border-hairline bg-surface-2 px-4 text-base outline-none focus:border-primary/60"
            />
          </label>
          <button
            type="button"
            onClick={() => setPhase("answer")}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground sm:w-auto"
          >
            Build my quiz
          </button>
        </div>
      ) : null}

      {phase === "answer" && current ? (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="label-mono">
              {index + 1} / {items.length}
            </span>
            <span className="label-mono">About you</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${((index + 1) / items.length) * 100}%` }}
            />
          </div>
          <h2 className="mt-6 font-display text-2xl leading-snug">{current.self}</h2>
          <div className="mt-5 grid gap-3">
            {current.opts.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => choose(i)}
                className="min-h-14 rounded-2xl border border-hairline px-5 py-4 text-left text-base transition-colors hover:border-primary/50 hover:bg-surface-2"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "link" ? (
        <div className="reveal glass rounded-2xl p-6 sm:p-8">
          <span className="label-mono inline-flex items-center gap-2">
            <Link2 className="size-4" aria-hidden="true" /> Your quiz is ready
          </span>
          <h2 className="mt-2 font-display text-3xl">Send it and watch the scores land</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Anyone who opens this link answers the same ten questions about you and instantly sees
            their percentage.
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
              <Share2 className="size-4" aria-hidden="true" /> Share link
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-hairline px-6 text-sm font-semibold"
            >
              <Copy className="size-4" aria-hidden="true" /> Copy
            </button>
          </div>
          <button
            type="button"
            onClick={restart}
            className="mt-4 text-sm text-muted-foreground underline underline-offset-4"
          >
            Rebuild with different questions
          </button>
        </div>
      ) : null}
    </ToolShell>
  );
}

/* ----------------------------------------------------------------- friend */

function PlayInvite({ invite }: { invite: DuelPayload }) {
  const items = useMemo(
    () => invite.q.map((id) => fqItem(id)).filter((i): i is FqItem => Boolean(i)),
    [invite.q],
  );
  const [index, setIndex] = useState(0);
  const [guesses, setGuesses] = useState<number[]>([]);
  const done = guesses.length >= items.length && items.length > 0;

  const hits = guesses.filter((g, i) => g === invite.a[i]).length;
  const pct = items.length ? Math.round((hits / items.length) * 100) : 0;
  const verdict = fqVerdict(pct, invite.n);
  const who = invite.n || "your friend";

  const choose = (optIndex: number) => {
    setGuesses((prev) => [...prev, optIndex]);
    setIndex((i) => i + 1);
  };

  const current = items[index];

  return (
    <ToolShell
      eyebrow="Tool 12 · Social"
      slug="friend-quiz"
      title={`How well do you know ${who}?`}
      intro={`${items.length} questions, one right answer each — the one ${who} actually picked. No hints, no going back.`}
    >
      {!done && current ? (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="label-mono">
              {index + 1} / {items.length}
            </span>
            <span className="label-mono">Guess</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${((index + 1) / items.length) * 100}%` }}
            />
          </div>
          <h2 className="mt-6 font-display text-2xl leading-snug">{current.friend}</h2>
          <div className="mt-5 grid gap-3">
            {current.opts.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => choose(i)}
                className="min-h-14 rounded-2xl border border-hairline px-5 py-4 text-left text-base transition-colors hover:border-primary/50 hover:bg-surface-2"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {done ? (
        <div className="reveal">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <span className="label-mono">Your score</span>
            <div className="mt-1 flex items-end gap-3">
              <h2 className="font-display text-6xl leading-none">{pct}%</h2>
              <span className="mb-2 rounded-full border border-hairline px-3 py-1 text-xs">
                {verdict.badge}
              </span>
            </div>
            <h3 className="mt-4 font-display text-2xl">{verdict.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{verdict.blurb}</p>

            <ul className="mt-6 grid gap-2">
              {items.map((item, i) => {
                const right = guesses[i] === invite.a[i];
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-hairline bg-surface-2 px-4 py-3 text-sm"
                  >
                    <span className="label-mono block">{right ? "Correct" : "Missed"}</span>
                    <span className="mt-1 block">{item.friend}</span>
                    <span className="mt-1 block text-muted-foreground">
                      Their answer: {item.opts[invite.a[i] ?? 0]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <ResultActions
            toolSlug="friend-quiz"
            onRetake={() => {
              setGuesses([]);
              setIndex(0);
            }}
            payload={{
              eyebrow: "Friend Quiz",
              title: `How well do you know ${who}?`,
              headline: `${pct}%`,
              lines: [verdict.name, `${hits} of ${items.length} correct`],
              fileName: "senses-of-void-friend-quiz.png",
              text: `I scored ${pct}% on “How well do you know ${who}?”`,
              toolName: "Friend Quiz",
              toolPath: "/tools/friend-quiz",
              accentSeed: verdict.name,
              badge: verdict.badge,
              subject: who,
              metrics: [{ label: "Match", value: pct }],
            }}
          />
        </div>
      ) : null}
    </ToolShell>
  );
}
