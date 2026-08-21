import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gauge, Lock, Sparkles } from "lucide-react";

import { TOOLS, searchTools } from "@/lib/tools";
import { NativeAdCard, withNativeAds } from "@/components/monetization/NativeAdCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Senses of Void — Seven Fast Tools for the Curious Mind" },
      {
        name: "description",
        content:
          "Trauma reflection, quick IQ, dark personality, vibe matching, AI roasts, prompt building and a free asset vault. No signup, instant results.",
      },
      { property: "og:title", content: "Senses of Void — Seven Fast Tools for the Curious Mind" },
      {
        property: "og:description",
        content:
          "Seven dark, fast tools plus a free Drive vault of UI kits, boilerplates and AI prompt packs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchTools(query), [query]);
  const slots = useMemo(() => withNativeAds(results), [results]);

  return (
    <div>
      <section className="void-grid relative overflow-hidden border-b border-hairline">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="label-mono inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-3 py-1">
            <Sparkles className="size-3 text-primary" aria-hidden="true" />
            seven tools · zero signup
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] font-bold text-balance sm:text-6xl">
            Look into the void.
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              It answers in data.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
            A tight suite of reflection, cognition and creativity tools that run instantly in your
            browser — plus a free vault of design and developer assets.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/tools/child-trauma"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start with a test <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              to="/vault"
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
            >
              Browse the free vault
            </Link>
          </div>
          <dl className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4">
            {[
              { icon: Gauge, k: "Sub-1.5s", v: "first paint" },
              { icon: Lock, k: "On-device", v: "test scoring" },
              { icon: Sparkles, k: "7 tools", v: "one suite" },
            ].map(({ icon: Icon, k, v }) => (
              <div key={k} className="glass rounded-xl px-3 py-4">
                <Icon className="mx-auto size-4 text-primary" aria-hidden="true" />
                <dt className="mt-2 font-display text-sm font-semibold">{k}</dt>
                <dd className="label-mono mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">The suite</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every tool loads on demand — nothing you don't open is downloaded.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <label htmlFor="hub-filter" className="sr-only">
              Filter tools
            </label>
            <input
              id="hub-filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter the suite…"
              className="w-full rounded-full border border-hairline bg-surface/60 px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot, i) =>
            "ad" in slot ? (
              <NativeAdCard key={`ad-${i}`} index={slot.ad} />
            ) : (
              <Link
                key={slot.item.slug}
                to={slot.item.path}
                className="glass lift group flex flex-col rounded-xl p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="label-mono rounded-full border border-hairline px-2 py-0.5">
                    {slot.item.category}
                  </span>
                  <span className="label-mono">{slot.item.duration}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {slot.item.name}
                </h3>
                <p className="mt-1 text-sm text-primary">{slot.item.tagline}</p>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{slot.item.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  Open tool <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            ),
          )}
          {results.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              Nothing matches "{query}".
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <p className="glass rounded-xl p-5 text-center text-sm text-muted-foreground">
          {TOOLS.length} tools · All tests are for entertainment and self-reflection only, not
          clinical psychological or medical assessment.
        </p>
      </section>
    </div>
  );
}
