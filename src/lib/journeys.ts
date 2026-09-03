/**
 * Cross-tool journeys: result-aware "what to do next" suggestions.
 *
 * Purely additive on top of `relatedTools()` in `src/lib/tools.ts` — the
 * static registry stays the fallback, this layer refines the order using the
 * category and the actual result (score band or archetype).
 */

import { TOOLS, getTool, relatedTools, type ToolMeta } from "@/lib/tools";

export type JourneyContext = {
  /** Slug of the tool just completed. */
  slug: string;
  /** Headline result — score string or archetype name. */
  headline?: string | undefined;
  /** Numeric score when the tool produces one (0–100 or IQ points). */
  score?: number | undefined;
};

/** Ordered preferences per source tool; first existing tools win. */
const JOURNEYS: Record<string, string[]> = {
  "red-flag": ["love-match", "child-trauma", "this-or-that"],
  iq: ["memory", "logic", "prompt-maker"],
  memory: ["logic", "iq", "this-or-that"],
  logic: ["iq", "memory", "dark-personality"],
  "dark-personality": ["child-trauma", "this-or-that", "love-match"],
  "child-trauma": ["red-flag", "dark-personality", "love-match"],
  "love-match": ["battle", "red-flag", "this-or-that"],
  "friend-quiz": ["battle", "this-or-that", "love-match"],
  battle: ["friend-quiz", "love-match", "red-flag"],
  "this-or-that": ["friend-quiz", "dark-personality", "love-match"],
  roast: ["dark-personality", "this-or-that", "prompt-maker"],
  "prompt-maker": ["iq", "roast", "vault"],
  vault: ["prompt-maker", "iq", "this-or-that"],
};

/**
 * Up to two genuinely relevant next tools. Never blocking, never the tool the
 * visitor just finished.
 */
export function nextTools(ctx: JourneyContext, limit = 2): ToolMeta[] {
  const preferred = (JOURNEYS[ctx.slug] ?? [])
    .map((slug) => getTool(slug))
    .filter((t): t is ToolMeta => Boolean(t) && t!.slug !== ctx.slug);

  const fallback = relatedTools(ctx.slug).filter((t) => t.slug !== ctx.slug);
  const pool = [...preferred, ...fallback, ...TOOLS.filter((t) => t.slug !== ctx.slug)];

  const seen = new Set<string>();
  const out: ToolMeta[] = [];
  for (const tool of pool) {
    if (seen.has(tool.slug)) continue;
    seen.add(tool.slug);
    out.push(tool);
    if (out.length >= limit) break;
  }
  return out;
}

/** One-line reason shown next to a suggestion, based on the result itself. */
export function journeyReason(ctx: JourneyContext, target: ToolMeta): string {
  if (target.category === "Cognition" && typeof ctx.score === "number") {
    return "See if your speed matches your reasoning score";
  }
  if (target.category === "Psyche") return "The other half of the picture — how you're wired";
  if (target.category === "Social") return "Run it with someone else and compare";
  if (target.category === "AI") return "Lighter, faster, and very shareable";
  return target.promise;
}
