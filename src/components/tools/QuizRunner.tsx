import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, RefreshCw } from "lucide-react";

import { QuizVipNudge } from "@/components/monetization/QuizVipNudge";
import { markQuizInteraction } from "@/lib/engagement";
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

  const item = items[index];
  const progress = useMemo(() => (index / items.length) * 100, [index, items.length]);

  const choose = useCallback(
    (weight: number) => {
      if (!item) return;
      const next = { ...answers, [item.id]: weight };
      setAnswers(next);
      if (index === items.length - 1) onComplete(next);
      else setIndex((i) => i + 1);
    },
    [answers, index, item, items.length, onComplete],
  );

  if (!item) return null;

  return (
    <div>
      {/* Sticky progress rail so the finish line is always visible on mobile. */}
      <div className="sticky top-14 z-20 -mx-4 mb-4 bg-background/85 px-4 py-2.5 backdrop-blur-xl sm:top-16">
        <div className="flex items-center justify-between">
          <span className="label-mono">
            Question {index + 1} / {items.length}
          </span>
          <div className="flex items-center gap-2">
            {onReshuffle ? (
              <button
                type="button"
                onClick={onReshuffle}
                className="label-mono inline-flex min-h-9 items-center gap-1 rounded-full border border-hairline px-2.5 transition-colors hover:text-primary"
              >
                <RefreshCw className="size-3" aria-hidden="true" /> New set
              </button>
            ) : null}
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="label-mono inline-flex min-h-9 items-center gap-1 rounded-full border border-hairline px-2.5 transition-colors hover:text-primary"
              >
                <ChevronLeft className="size-3" aria-hidden="true" /> Back
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--tool-accent, var(--primary)), var(--secondary))",
            }}
          />
        </div>
      </div>

      <div key={item.id} className="glass reveal rounded-2xl p-5 sm:p-7">
        {intro ? <span className="label-mono">{intro}</span> : null}
        <h2 className="mt-2 font-display text-xl leading-snug font-semibold text-balance sm:text-2xl">
          {item.text}
        </h2>

        <div className="mt-6 grid gap-2">
          {SCALE.map((option) => {
            const active = answers[item.id] === option.weight;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => choose(option.weight)}
                aria-pressed={active}
                className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  active
                    ? "border-primary/60 bg-primary/15 text-foreground"
                    : "border-hairline bg-surface-2/50 text-foreground/85 hover:border-primary/40 hover:bg-primary/10"
                }`}
              >
                {option.label}
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{
                    background: active
                      ? "var(--tool-accent, var(--primary))"
                      : "color-mix(in oklab, var(--foreground) 18%, transparent)",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <QuizVipNudge step={index} total={items.length} />
    </div>
  );
}
