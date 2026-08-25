import { useCallback, useEffect, useMemo, useState } from "react";
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
}: {
  items: Likert[];
  onComplete: (answers: Record<string, number>) => void;
  onReshuffle?: () => void;
  intro?: string;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    setIndex(0);
    setAnswers({});
  }, [items]);

  // While the quiz is open and unfinished, no pop-under / vignette / push may
  // load — only the first-party banner below and the smartlink on the result.
  useEffect(() => {
    setQuizActive(true);
    return () => setQuizActive(false);
  }, []);

  const item = items[index];
  const progress = useMemo(() => (index / items.length) * 100, [index, items.length]);

  const choose = useCallback(
    (weight: number) => {
      if (!item) return;
      markQuizInteraction();
      const next = { ...answers, [item.id]: weight };
      setAnswers(next);
      if (index === items.length - 1) {
        setQuizActive(false);
        onComplete(next);
      }
      else setIndex((i) => i + 1);
    },
    [answers, index, item, items.length, onComplete],
  );

  if (!item) return null;

  return (
    <div>
      {/* Sticky progress rail so the finish line is always visible on mobile. */}
      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-hairline bg-void-0/80 px-4 py-2.5 backdrop-blur-2xl sm:top-16">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <span className="label-mono min-w-0 truncate">
            <span className="font-mono text-sm text-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="mx-1 opacity-50">/</span>
            {String(items.length).padStart(2, "0")}
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

      <div key={item.id} className="panel spotlight reveal p-5 sm:p-8">
        {intro ? <span className="label-mono">{intro}</span> : null}
        <h2 className="mt-2.5 font-display text-[1.35rem] leading-[1.25] font-semibold tracking-[-0.025em] text-balance sm:text-[1.75rem]">
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
                {option.label}
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
      </div>


      {/* Quiet banner only once the visitor is deep in the quiz (7th question
          onward) — no interstitial, no pop-under, safe for paid social. */}
      {index >= 6 ? <AdSlot id="quiz-inline" className="mt-4" /> : null}

      <QuizVipNudge step={index} total={items.length} />
    </div>
  );
}
