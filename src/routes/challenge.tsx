import { useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Trophy } from "lucide-react";

import { DAILY_TOOL_META, dailyToolFor, dayKey } from "@/lib/daily-challenge";
import { dailyLeaderboard } from "@/lib/daily.functions";
import { track } from "@/lib/monetization";

const URL = "https://sensesofvoid.app/challenge";
const OG = "https://sensesofvoid.app/og/logic.jpg";

export const Route = createFileRoute("/challenge")({
  head: () => ({
    meta: [
      { title: "Daily Brain Challenge — Today's Leaderboard | Senses of Void" },
      {
        name: "description",
        content:
          "A new brain test every day — IQ, memory span or logic sprint. Post your score anonymously and see where you land on today's public leaderboard. Free, no signup.",
      },
      { property: "og:title", content: "Daily Brain Challenge — Senses of Void" },
      {
        property: "og:description",
        content: "One test a day, one public board. Beat today's top score.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Senses of Void" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: OG },
      { name: "twitter:image", content: OG },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ChallengePage,
});

function ChallengePage() {
  const fetchBoard = useServerFn(dailyLeaderboard);
  const today = dayKey();
  const slug = dailyToolFor(today);
  const meta = DAILY_TOOL_META[slug];

  const { data, isLoading } = useQuery({
    queryKey: ["daily-leaderboard", today],
    queryFn: () => fetchBoard({ data: { day: today } }),
    staleTime: 60_000,
  });

  useEffect(() => {
    track({ event_type: "funnel", slot: "daily_visit", tool_slug: slug, format: "daily" });
  }, [slug]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <span className="label-mono inline-flex items-center gap-2">
        <Flame className="size-4 text-primary" aria-hidden="true" /> Daily challenge · {today}
      </span>
      <h1 className="mt-3 font-display text-3xl sm:text-4xl">Today: {meta.name}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{meta.blurb}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to={meta.path}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          Take today&apos;s challenge
        </Link>
        <Link
          to="/tools"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-hairline px-6 text-sm"
        >
          All tools
        </Link>
      </div>

      <section className="glass mt-8 rounded-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <span className="label-mono inline-flex items-center gap-2">
            <Trophy className="size-4 text-primary" aria-hidden="true" /> Top {meta.unit}
          </span>
          <span className="label-mono">{data ? `${data.players} players` : ""}</span>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading today&apos;s board…</p>
        ) : data && data.rows.length > 0 ? (
          <ol className="mt-4 divide-y divide-hairline">
            {data.rows.map((row) => (
              <li key={`${row.rank}-${row.alias}`} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="label-mono w-8 shrink-0 text-muted-foreground">#{row.rank}</span>
                <span className="flex-1 truncate">{row.alias}</span>
                {row.country ? (
                  <span className="label-mono text-muted-foreground">{row.country}</span>
                ) : null}
                <span className="font-display text-lg">{row.score}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No scores yet today — the board is wide open. Be first.
          </p>
        )}

        {data?.yesterdayBest ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Yesterday&apos;s top score: {data.yesterdayBest}.
          </p>
        ) : null}
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Scores are anonymous — only the nickname you type is stored, and the board resets every day
        at 00:00 UTC.
      </p>
    </main>
  );
}
