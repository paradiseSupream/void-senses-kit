import { createServerFn } from "@tanstack/react-start";

import { cleanAlias, dailyToolFor, dayKey, type DailyToolSlug } from "@/lib/daily-challenge";

export type LeaderboardRow = { rank: number; alias: string; score: number; country: string | null };

export type LeaderboardResult = {
  day: string;
  toolSlug: DailyToolSlug;
  players: number;
  rows: LeaderboardRow[];
  /** Best score of the previous day, for a "beat yesterday" line. */
  yesterdayBest: number | null;
};

export type SubmitResult =
  | { status: "ok"; rank: number; players: number; best: number }
  | { status: "closed" }
  | { status: "error"; message: string };

const MAX_ROWS = 20;

/** Today's board plus yesterday's high score. */
export const dailyLeaderboard = createServerFn({ method: "POST" })
  .inputValidator((input: { day?: string } | undefined) => ({
    day: typeof input?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.day) ? input.day : dayKey(),
  }))
  .handler(async ({ data }): Promise<LeaderboardResult> => {
    const { admin } = await import("@/lib/admin-core.server");
    const db = admin();
    const toolSlug = dailyToolFor(data.day);

    const { data: rows } = await db
      .from("daily_scores")
      .select("alias,score,country")
      .eq("day", data.day)
      .eq("tool_slug", toolSlug)
      .order("score", { ascending: false })
      .limit(500);

    const list = (rows ?? []) as Array<{ alias: string; score: number; country: string | null }>;

    const yesterday = dayKey(new Date(Date.parse(`${data.day}T00:00:00Z`) - 86_400_000));
    const { data: prev } = await db
      .from("daily_scores")
      .select("score")
      .eq("day", yesterday)
      .eq("tool_slug", dailyToolFor(yesterday))
      .order("score", { ascending: false })
      .limit(1);

    return {
      day: data.day,
      toolSlug,
      players: list.length,
      rows: list.slice(0, MAX_ROWS).map((row, index) => ({
        rank: index + 1,
        alias: row.alias,
        score: row.score,
        country: row.country,
      })),
      yesterdayBest: (prev?.[0]?.score as number | undefined) ?? null,
    };
  });

/** Records (or improves) an anonymous score on today's challenge board. */
export const submitDailyScore = createServerFn({ method: "POST" })
  .inputValidator((input: { toolSlug: string; sessionId: string; alias: string; score: number }) => ({
    toolSlug: String(input?.toolSlug ?? ""),
    sessionId: String(input?.sessionId ?? "").slice(0, 64),
    alias: cleanAlias(String(input?.alias ?? "")),
    score: Math.max(0, Math.min(100_000, Math.round(Number(input?.score ?? 0)))),
  }))
  .handler(async ({ data }): Promise<SubmitResult> => {
    const day = dayKey();
    if (data.toolSlug !== dailyToolFor(day)) return { status: "closed" };
    if (!data.sessionId || !data.alias) return { status: "error", message: "Alias required." };

    const { admin } = await import("@/lib/admin-core.server");
    const { countryOf } = await import("@/lib/geo-header");
    const db = admin();

    let country: string | null = null;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      country = countryOf(getRequest());
    } catch {
      country = null;
    }

    const { data: existing } = await db
      .from("daily_scores")
      .select("score")
      .eq("day", day)
      .eq("tool_slug", data.toolSlug)
      .eq("session_id", data.sessionId)
      .maybeSingle();

    const best = Math.max(data.score, (existing?.score as number | undefined) ?? 0);

    const { error } = await db.from("daily_scores").upsert(
      {
        day,
        tool_slug: data.toolSlug,
        session_id: data.sessionId,
        alias: data.alias,
        score: best,
        country,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "day,tool_slug,session_id" },
    );
    if (error) return { status: "error", message: error.message };

    const { data: rows } = await db
      .from("daily_scores")
      .select("score")
      .eq("day", day)
      .eq("tool_slug", data.toolSlug)
      .order("score", { ascending: false })
      .limit(2000);

    const scores = ((rows ?? []) as Array<{ score: number }>).map((row) => row.score);
    const rank = scores.filter((value) => value > best).length + 1;
    return { status: "ok", rank, players: scores.length, best };
  });
