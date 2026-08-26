import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Ghost } from "lucide-react";

import { SCALE } from "@/lib/quiz-engine";
import { carryAnswer } from "@/lib/entry-carry";
import { trackFunnel } from "@/lib/funnel";
import { trackExperiment } from "@/lib/monetization";

/**
 * Live entry panel — question one of the signature test, rendered inside the
 * hero. Answering here stores the answer and continues on the tool page, so a
 * visitor starts the test with zero taps of setup.
 *
 * This is composition only: the item texts come straight from the shipped bank
 * and the answer is handed to the untouched runner/scoring engine.
 */
const OPENERS = [
  { id: "mc1", text: "I read the room for leverage before I speak." },
  { id: "sh1", text: "I know exactly which part of me is dangerous." },
  { id: "dt1", text: "I keep parts of myself deliberately unreadable." },
  { id: "cg1", text: "I win arguments by reframing the question." },
] as const;

const SLUG = "dark-personality";

export function LiveEntry({ arm }: { arm: string }) {
  const navigate = useNavigate();
  const [opener, setOpener] = useState(OPENERS[0]!);
  const [picked, setPicked] = useState<number | null>(null);

  // Rotate the opener after hydration so repeat visitors get a fresh prompt
  // without risking a server/client markup mismatch.
  useEffect(() => {
    setOpener(OPENERS[Math.floor(Math.random() * OPENERS.length)]!);
  }, []);

  const answer = (weight: number) => {
    if (picked !== null) return;
    setPicked(weight);
    carryAnswer({ slug: SLUG, id: opener.id, weight });
    trackExperiment("hero_live_entry", arm);
    trackFunnel("test_start", SLUG);
    window.setTimeout(() => {
      navigate({ to: "/tools/dark-personality", search: { auto: "1" } as never });
    }, 260);
  };

  return (
    <div className="panel spotlight overflow-hidden p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <span className="label-mono">Question 01 · Dark Personality</span>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
            answer here, finish on the next screen
          </p>
        </div>
        <span className="accent-tile size-10 shrink-0">
          <Ghost className="size-4.5" aria-hidden="true" />
        </span>
      </div>

      <h2 className="mt-4 font-display text-lg leading-[1.3] font-semibold tracking-[-0.02em] text-balance sm:text-xl">
        {opener.text}
      </h2>

      <div className="mt-4 grid gap-2">
        {SCALE.map((option, i) => {
          const active = picked === option.weight;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => answer(option.weight)}
              aria-pressed={active}
              style={{ animationDelay: `${60 + i * 30}ms` }}
              className={`reveal flex min-h-11 items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-[background-color,border-color,transform] duration-[var(--dur-micro)] active:scale-[0.985] ${
                active
                  ? "border-primary/55 bg-primary/12 text-foreground"
                  : "border-hairline bg-surface-2/40 hover:border-primary/35 hover:bg-surface-2/70"
              }`}
            >
              <span>{option.label}</span>
              {active ? <ArrowRight className="size-4 text-primary" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      <p className="label-mono mt-3.5">
        {picked === null ? "17 more · about 3 minutes" : "Saved — opening your test…"}
      </p>
    </div>
  );
}
