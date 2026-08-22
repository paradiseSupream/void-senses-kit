import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";

import { TOOLS } from "@/lib/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { AdSlot } from "@/components/monetization/AdSlot";
import { NativeAdCard } from "@/components/monetization/NativeAdCard";

const CATEGORIES = ["All", "Psyche", "Cognition", "Social", "AI", "Assets"] as const;

export const Route = createFileRoute("/tools/")({
  head: () => ({
    meta: [
      { title: "All Tools — Free IQ, Personality & AI Tests | Senses of Void" },
      {
        name: "description",
        content:
          "Browse every Senses of Void tool: Quick IQ test, Child Trauma test, Dark Personality test, Love & Vibe matcher, AI Roast Me, AI Prompt Maker and the Free Drive Vault. Free, no signup.",
      },
      { property: "og:title", content: "All Tools — Senses of Void" },
      {
        property: "og:description",
        content:
          "Seven free tools: IQ, trauma, dark personality, love match, AI roast, prompt maker and a free asset vault.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ToolsIndex,
});

function ToolsIndex() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter(
      (t) =>
        (category === "All" || t.category === category) &&
        (!q ||
          `${t.name} ${t.tagline} ${t.description} ${t.keywords.join(" ")}`
            .toLowerCase()
            .includes(q)),
    );
  }, [category, query]);

  return (
    <div>
      <header className="relative overflow-hidden border-b border-hairline">
        <div className="aurora grain absolute inset-0">
          <div className="void-grid absolute inset-0" aria-hidden="true" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-10 sm:px-6 sm:pt-16 sm:pb-14">
          <span className="label-mono inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface/60 px-3 py-1">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            7 tools · 100% free · no signup
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-3xl leading-[1.05] font-bold text-balance sm:text-5xl">
            Every test and tool, in one place
          </h1>
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            Pick a tool below — each one runs entirely in your browser, gives you a visual result
            you can download, and takes under five minutes. Questions are randomised every attempt.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Tool categories"
            className="flex flex-wrap gap-1 rounded-full border border-hairline bg-surface/60 p-1"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={category === cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="relative sm:w-72">
            <span className="sr-only">Search tools</span>
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools..."
              className="h-11 w-full rounded-full border border-hairline bg-surface/60 pr-4 pl-9 text-sm outline-none focus:border-primary/60"
            />
          </label>
        </div>

        <AdSlot id="result-tools" toolSlug="tools" className="mt-6" />

        {filtered.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">
            No tool matches “{query}”. Try another word.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} priority={i < 3} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <NativeAdCard index={1} toolSlug="tools" />
        </div>

        <AdSlot id="result-tools-footer" toolSlug="tools" className="mt-8" />
      </div>
    </div>
  );
}
