import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ArrowRight, Swords, Trophy } from "lucide-react";

import { decodeCompare } from "@/lib/compare-link";
import { AdSlot } from "@/components/monetization/AdSlot";

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>) => ({
    r: typeof search["r"] === "string" ? search["r"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Beat Your Friend's Score — Senses of Void Challenge" },
      {
        name: "description",
        content:
          "A friend challenged you. See their result, then take the same free test — randomised questions, instant visual report, no signup.",
      },
      { property: "og:title", content: "Beat Your Friend's Score — Senses of Void" },
      {
        property: "og:description",
        content: "See their score, take the same free test and compare your result in 3 minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://sensesofvoid.app/compare" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/compare" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Friend Challenge",
        url: "https://sensesofvoid.app/compare",
        isPartOf: { "@type": "WebSite", name: "Senses of Void", url: "https://sensesofvoid.app" },
      }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://sensesofvoid.app" },
            { "@type": "ListItem", position: 2, name: "Friend Challenge", item: "https://sensesofvoid.app/compare" },
          ],
        }),
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { r } = useSearch({ from: "/compare" });
  const result = r ? decodeCompare(r) : null;

  return (
    <div className="aurora grain relative min-h-[70vh] overflow-hidden">
      <div className="void-grid absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
        <span className="label-mono inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-primary">
          <Swords className="size-3.5" aria-hidden="true" /> Friend challenge
        </span>

        {result ? (
          <>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              Your friend scored{" "}
              <span className="text-gradient">{result.h}</span> on {result.n}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Take the exact same test — questions are drawn fresh every run, so there is no way to
              copy their answers. Free, no signup, result in about 3 minutes.
            </p>

            <div className="panel mt-7 p-6">
              <span className="label-mono">Their result</span>
              <p className="mt-2 flex items-center gap-2 font-display text-4xl font-bold text-primary">
                <Trophy className="size-6" aria-hidden="true" /> {result.h}
              </p>
              {result.l.length ? (
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {result.l.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to={result.p}
                className="btn-glow inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold"
              >
                Beat this score <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/tools"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-hairline bg-surface/60 px-7 text-base font-semibold backdrop-blur-xl transition-colors hover:bg-surface-2"
              >
                See all 7 free tests
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              This challenge link has expired
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Ask your friend to resend it — or just pick a test and start your own run.
            </p>
            <Link
              to="/tools"
              className="btn-glow mt-7 inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold"
            >
              Browse the free tests <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        )}

        <div className="mt-10">
          <AdSlot id="result-compare" toolSlug="compare" />
        </div>
      </div>
    </div>
  );
}
