import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Trophy } from "lucide-react";

import { TOOLS } from "@/lib/tools";

const KEY = "sov.completed";

const CHAIN = ["iq", "dark-personality", "love-match"] as const;

function readCompleted(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Session-chaining challenge: three tests in one visit.
 * Purely presentational progress read from local storage.
 */
export function StreakChallenge() {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    setDone(readCompleted());
  }, []);

  const steps = CHAIN.map((slug) => TOOLS.find((t) => t.slug === slug)).filter(Boolean) as typeof TOOLS;
  const completed = steps.filter((t) => done.includes(t.slug)).length;
  const next = steps.find((t) => !done.includes(t.slug)) ?? steps[0]!;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="bento h-full p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <span className="label-mono">The 3-test run</span>
          <h3 className="mt-1 font-display text-2xl">
            Finish all three, unlock your full mind map
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Each test takes 2–5 minutes. Together they read your cognition, your shadow and your
            chemistry — all free, no signup.
          </p>
        </div>
        <span className="accent-tile size-11 shrink-0">
          <Trophy className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {steps.map((tool, i) => {
          const isDone = done.includes(tool.slug);
          return (
            <li key={tool.slug}>
              <Link
                to={tool.path}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-hairline bg-surface/50 px-3 py-2.5 transition-colors hover:bg-surface-2"
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.65rem] font-semibold ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : "border border-hairline text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span className="min-w-0 truncate text-sm font-medium">{tool.name}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <Link
        to={next.path}
        className="btn-glow mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold sm:w-auto"
      >
        {completed === 0 ? "Start the run" : completed === steps.length ? "Run it again" : "Continue the run"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
