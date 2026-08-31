import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, RefreshCw } from "lucide-react";

import { QuizVipNudge } from "@/components/monetization/QuizVipNudge";

import { AdSlot } from "@/components/monetization/AdSlot";
import { markQuizInteraction, setQuizActive } from "@/lib/engagement";
import { SCALE, type Likert } from "@/lib/quiz-engine";

/**
 * One-question-at-a-time Likert runner shared by every self-report tool.
 * Answering auto-advances, so a full session is fifteen taps and no scrolling.
 */
export function QuizRunner({
  items,
  onComplete,
  onReshuffle,
  intro,
  initialAnswers,
}: {
  items: Likert[];
  onComplete: (answers: Record<string, number>, meta?: { timingsMs: Record<string, number> }) => void;
  onReshuffle?: () => void;
  intro?: string;
  /** Answers already given elsewhere (e.g. question one on the home hero). */
  initialAnswers?: Record<string, number> | undefined;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  // Per-item response time, used only to grade measurement confidence
  // (speeding detection) — never sent anywhere.
  const timingsRef = useRef<Record<string, number>>({});
  const shownAtRef = useRef<number>(Date.now());

  useEffect(() => {
    // Keep only carried answers that belong to this drawn set, then resume on
    // the first unanswered item.
    const seeded: Record<string, number> = {};
    for (const item of items) {
      const carried = initialAnswers?.[item.id];
      if (typeof carried === "number") seeded[item.id] = carried;
    }
    const first = items.findIndex((item) => seeded[item.id] === undefined);
    setAnswers(seeded);
    setIndex(first === -1 ? 0 : first);
    timingsRef.current = {};
    shownAtRef.current = Date.now();
    // `initialAnswers` is a one-shot handoff; the drawn set is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // While the quiz is open and unfinished, no pop-under / vignette / push may
  // load — only the first-party banner below and the smartlink on the result.
  useEffect(() => {
    setQuizActive(true);
    return () => setQuizActive(false);
  }, []);

  // The tool intro pushes question one below the fold on phones. Bringing the
  // runner to the top the moment it mounts removes that dead scroll.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const id = window.setTimeout(() => {
      const top = node.getBoundingClientRect().top + window.scrollY - 72;
      if (top > window.scrollY + 8) window.scrollTo({ top, behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(id);
  }, []);

  const item = items[index];
  const progress = useMemo(() => (index / items.length) * 100, [index, items.length]);

  const choose = useCallback(
    (weight: number) => {
      if (!item) return;
      markQuizInteraction();
      const elapsed = Date.now() - shownAtRef.current;
      timingsRef.current[item.id] = Math.min(elapsed, 120_000);
      shownAtRef.current = Date.now();
      const next = { ...answers, [item.id]: weight };
      setAnswers(next);
      // Skip anything already answered (a carried home-page answer), so the
      // session ends as soon as every item in the set has a value.
      const remaining = items.findIndex((q) => next[q.id] === undefined);
      if (remaining === -1) {
        setQuizActive(false);
        onComplete(next, { timingsMs: { ...timingsRef.current } });
      } else setIndex(remaining);
    },
    [answers, item, items, onComplete],
  );


  // Desktop speed-run: keys 1–5 pick the matching option, so a full set is
  // finished without leaving the keyboard. Mobile is unaffected.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > SCALE.length) return;
      const option = SCALE[n - 1];
      if (!option) return;
      e.preventDefault();
      choose(option.weight);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose]);

  if (!item) return null;

  const leftSeconds = Math.max(1, Math.round(((items.length - index) * 7) / 5) * 5);
  const timeLeft = leftSeconds >= 60 ? `~${Math.ceil(leftSeconds / 60)} min left` : "under a minute left";

  return (
    <div ref={rootRef}>
      {/* Sticky progress rail so the finish line is always visible on mobile. */}
      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-hairline bg-void-0/80 px-4 py-2.5 backdrop-blur-2xl sm:top-16">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <span className="label-mono min-w-0 truncate">
            <span className="font-mono text-sm text-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="mx-1 opacity-50">/</span>
            {String(items.length).padStart(2, "0")}
            <span className="ml-2 opacity-60">{Math.round(progress)}%</span>
            <span className="ml-2 hidden opacity-60 sm:inline">· {timeLeft}</span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {onReshuffle ? (
              <button
                type="button"
                onClick={onReshuffle}
                className="capsule label-mono inline-flex min-h-9 items-center gap-1 px-2.5 hover:text-primary"
              >
                <RefreshCw className="size-3" aria-hidden="true" /> New set
              </button>
            ) : null}
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="capsule label-mono inline-flex min-h-9 items-center gap-1 px-2.5 hover:text-primary"
              >
                <ChevronLeft className="size-3" aria-hidden="true" /> Back
              </button>
            ) : null}
          </div>
        </div>
        {/* Segmented rail reads as measured progress, not a loading bar. */}
        <div className="mt-2.5 flex gap-[3px]" aria-hidden="true">
          {items.map((q, i) => (
            <span
              key={q.id}
              className="h-1 flex-1 rounded-full transition-colors duration-[var(--dur-ui)]"
              style={{
                background:
                  i < index
                    ? "var(--tool-accent, var(--primary))"
                    : i === index
                      ? "color-mix(in oklab, var(--tool-accent, var(--primary)) 55%, transparent)"
                      : "color-mix(in oklab, var(--foreground) 10%, transparent)",
              }}
            />
          ))}
        </div>
        <span className="sr-only" role="status">
          Question {index + 1} of {items.length}
        </span>
      </div>

      <div key={item.id} className="bento spotlight reveal p-5 sm:p-8">
        {intro ? <span className="label-mono">{intro}</span> : null}
        <h2 className="mt-3 font-display text-[1.7rem] leading-[1.18] text-balance sm:text-[2.25rem]">
          {item.text}
        </h2>

        <div className="mt-6 grid gap-2">
          {SCALE.map((option, i) => {
            const active = answers[item.id] === option.weight;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => choose(option.weight)}
                aria-pressed={active}
                style={{ animationDelay: `${60 + i * 35}ms` }}
                className={`reveal flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-[background-color,border-color,transform] duration-[var(--dur-micro)] active:scale-[0.985] ${
                  active
                    ? "border-primary/55 bg-primary/12 text-foreground"
                    : "border-hairline bg-void-2/45 text-foreground/85 hover:border-primary/35 hover:bg-primary/8"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="label-mono hidden size-5 shrink-0 place-items-center rounded-md border border-hairline text-[0.6rem] sm:grid"
                  >
                    {i + 1}
                  </span>
                  <span className="truncate">{option.label}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full transition-transform duration-[var(--dur-micro)]"
                  style={{
                    background: active
                      ? "var(--tool-accent, var(--primary))"
                      : "color-mix(in oklab, var(--foreground) 16%, transparent)",
                    boxShadow: active
                      ? "0 0 12px color-mix(in oklab, var(--tool-accent, var(--primary)) 60%, transparent)"
                      : "none",
                  }}
                />
              </button>
            );
          })}
        </div>
        <p className="label-mono mt-4 hidden sm:block">
          Tip — press 1–{SCALE.length} to answer without the mouse
        </p>
      </div>



      {/* Quiet banner only once the visitor is deep in the quiz (7th question
          onward) — no interstitial, no pop-under, safe for paid social. */}
      {index >= 3 && index < 9 ? <AdSlot id="quiz-inline" className="mt-4" /> : null}
      {index >= 9 ? <AdSlot id="quiz-inline-late" className="mt-4" /> : null}

      {/* Soft inline nudge only — no modal, no rewarded ad gate during the test.
          The quiz now runs Start → Complete → Result → VIP uninterrupted; the
          paid offer lives on the result surface (VipOfferCard / ExitIntent). */}
      <QuizVipNudge step={index} total={items.length} />
    </div>
  );
}
