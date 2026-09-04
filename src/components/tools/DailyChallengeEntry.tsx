import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Trophy } from "lucide-react";

import { DAILY_TOOL_META, cleanAlias, dailyToolFor, storeAlias, storedAlias } from "@/lib/daily-challenge";
import type { DailyToolSlug } from "@/lib/daily-challenge";
import { submitDailyScore } from "@/lib/daily.functions";
import { sessionId, track } from "@/lib/monetization";

/**
 * Result-page entry point for the daily challenge. Renders only when the tool
 * the visitor just finished is today's rotating challenge, so the board always
 * compares like with like.
 */
export function DailyChallengeEntry({ toolSlug, score }: { toolSlug: DailyToolSlug; score: number }) {
  const submit = useServerFn(submitDailyScore);
  const [alias, setAlias] = useState(() => storedAlias());
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [placement, setPlacement] = useState<{ rank: number; players: number } | null>(null);

  if (toolSlug !== dailyToolFor()) return null;
  const meta = DAILY_TOOL_META[toolSlug];

  const send = async () => {
    const name = cleanAlias(alias);
    if (!name) {
      setState("error");
      return;
    }
    setState("sending");
    storeAlias(name);
    track({ event_type: "funnel", slot: "daily_submit", tool_slug: toolSlug, format: "daily" });
    try {
      const result = await submit({ data: { toolSlug, sessionId: sessionId(), alias: name, score } });
      if (result.status === "ok") {
        setPlacement({ rank: result.rank, players: result.players });
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  return (
    <div className="glass mt-4 rounded-2xl p-5 sm:p-6">
      <span className="label-mono inline-flex items-center gap-2">
        <Trophy className="size-4 text-primary" aria-hidden="true" /> Today&apos;s challenge
      </span>
      <p className="mt-2 text-sm text-muted-foreground">
        {meta.name} is today&apos;s challenge. Put your {score} {meta.unit} on the public board —
        anonymous, just a nickname.
      </p>

      {state === "done" && placement ? (
        <p className="mt-4 text-sm">
          You&apos;re <strong className="text-primary">#{placement.rank}</strong> of {placement.players}{" "}
          players today.{" "}
          <Link to="/challenge" className="underline underline-offset-4">
            See the full board
          </Link>
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            maxLength={24}
            placeholder="Nickname"
            aria-label="Leaderboard nickname"
            className="min-h-12 flex-1 rounded-xl border border-hairline bg-surface-2 px-4 text-sm outline-none focus:border-primary/50"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={state === "sending"}
            className="min-h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {state === "sending" ? "Posting…" : "Post my score"}
          </button>
        </div>
      )}

      {state === "error" ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Could not post that — check the nickname and try again.
        </p>
      ) : null}
    </div>
  );
}
