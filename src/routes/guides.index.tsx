import { createFileRoute, Link } from "@tanstack/react-router";

import { GUIDES } from "@/lib/guides";

const URL = "https://sensesofvoid.app/guides";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Guides — Psychology, Memory and AI, Explained" },
      {
        name: "description",
        content:
          "Plain-language guides on IQ bands, relationship red flags, short-term memory and genuinely free AI tools — each one linked to a free test you can take in minutes.",
      },
      { property: "og:title", content: "Guides — Senses of Void" },
      {
        property: "og:description",
        content: "Evergreen explainers on intelligence, memory, relationships and AI tools.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Senses of Void" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Senses of Void Guides",
          url: URL,
          hasPart: GUIDES.map((guide) => ({
            "@type": "Article",
            headline: guide.title,
            url: `https://sensesofvoid.app/guides/${guide.slug}`,
          })),
        }),
      },
    ],
  }),
  component: GuidesIndex,
});

function GuidesIndex() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <span className="label-mono">Guides</span>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Explainers worth the read</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Short, sourced explainers on the questions our tools keep raising — what a score means,
        which patterns matter, and what actually changes them. Every guide ends in a free test.
      </p>

      <div className="mt-10 grid gap-4">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            to="/guides/$slug"
            params={{ slug: guide.slug }}
            className="glass block rounded-2xl p-6 transition-colors hover:border-primary/40"
          >
            <h2 className="font-display text-2xl">{guide.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
            <span className="label-mono mt-4 block">Read guide →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
