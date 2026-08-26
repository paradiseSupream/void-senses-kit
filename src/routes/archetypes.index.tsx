import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { ARCHETYPE_PAGES } from "@/lib/archetype-seo";
import { AdSlot } from "@/components/monetization/AdSlot";

const TITLE = "The 8 Shadow Archetypes — Dark Personality Types Explained";
const DESCRIPTION =
  "Explore all eight shadow archetypes measured by the free Dark Personality test: Sovereign Manipulator, Velvet Ghost, Dark Empath, Stoic Predator and more. Traits, strengths and blind spots.";

export const Route = createFileRoute("/archetypes/")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Senses of Void` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://sensesofvoid.app/archetypes" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/archetypes" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "The 8 Shadow Archetypes",
          url: "https://sensesofvoid.app/archetypes",
          isPartOf: { "@type": "WebSite", name: "Senses of Void", url: "https://sensesofvoid.app" },
          hasPart: ARCHETYPE_PAGES.map((page) => ({
            "@type": "Article",
            headline: page.archetype.name,
            url: `https://sensesofvoid.app${page.path}`,
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://sensesofvoid.app" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Shadow Archetypes",
              item: "https://sensesofvoid.app/archetypes",
            },
          ],
        }),
      },
    ],
  }),
  component: ArchetypesIndex,
});

function ArchetypesIndex() {
  return (
    <div>
      <header className="relative overflow-hidden border-b border-hairline">
        <div className="aurora grain absolute inset-0">
          <div className="void-grid absolute inset-0" aria-hidden="true" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
            Shadow taxonomy
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            The 8 shadow archetypes
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every Dark Personality profile resolves to one of eight archetypes, decided by a
            six-axis score: Machiavellianism, Narcissism, Psychopathy, Emotional Detachment,
            Cognitive Dominance and Shadow Integration. Read the type below, or take the free test
            and find out which one you are.
          </p>
          <Link
            to="/tools/dark-personality"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="size-4" aria-hidden="true" /> Take the free test
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {ARCHETYPE_PAGES.map((page) => (
            <Link
              key={page.key}
              to="/archetypes/$slug"
              params={{ slug: page.key }}
              className="group rounded-2xl border border-hairline bg-surface-2/60 p-5 transition-colors hover:border-primary/40"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {page.rarity}
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">{page.archetype.name}</h2>
              <p className="mt-1 text-sm text-primary">{page.archetype.tagline}</p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {page.archetype.blurb}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Read the profile
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <AdSlot id="archetypes_footer" className="mt-10" />
      </main>
    </div>
  );
}
