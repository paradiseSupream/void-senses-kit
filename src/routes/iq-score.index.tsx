import { createFileRoute, Link } from "@tanstack/react-router";

import { IQ_SCORE_MAX, IQ_SCORE_MIN, IQ_SCORE_PATHS, iqBand } from "@/lib/iq-score-seo";
import { SITE_BASE_URL } from "@/lib/sitemap-routes";

export const Route = createFileRoute("/iq-score/")({
  head: () => {
    const url = `${SITE_BASE_URL}/iq-score`;
    const title = "IQ Score Meanings — What Every Score From 70 to 145 Means | Senses of Void";
    const description =
      "What does your IQ score mean? Percentile, classification and plain-English explanation for every score from 70 to 145 — then test yourself free in under five minutes.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Senses of Void" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "IQ score meanings",
            url,
            isPartOf: { "@type": "WebSite", name: "Senses of Void", url: SITE_BASE_URL },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_BASE_URL },
              { "@type": "ListItem", position: 2, name: "IQ score meanings", item: url },
            ],
          }),
        },
      ],
    };
  },
  component: IqScoreIndex,
});

const POPULAR = [85, 90, 100, 110, 115, 120, 125, 130, 140];

function IqScoreIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-display">What does your IQ score mean?</h1>
      <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
        IQ scores follow a bell curve: 100 is the average, and about 68% of people score between
        85 and 115. Pick any score below for its percentile, classification and a plain-English
        explanation.
      </p>

      <section className="mt-10">
        <h2 className="label-mono text-muted-foreground">Most searched</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {POPULAR.map((s) => (
            <Link
              key={s}
              to="/iq-score/$score"
              params={{ score: String(s) }}
              className="rounded-xl border border-hairline bg-surface/60 p-4 transition-colors hover:border-primary/60"
            >
              <span className="font-mono text-2xl font-bold text-primary">{s}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{iqBand(s).label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="label-mono text-muted-foreground">
          Every score, {IQ_SCORE_MIN}–{IQ_SCORE_MAX}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {IQ_SCORE_PATHS.map((path) => {
            const s = path.split("/").pop()!;
            return (
              <Link
                key={s}
                to="/iq-score/$score"
                params={{ score: s }}
                className="rounded-full border border-hairline bg-surface/60 px-3 py-1.5 font-mono text-sm transition-colors hover:border-primary/60 hover:text-primary"
              >
                {s}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <h2 className="text-xl font-semibold">Don't know your score yet?</h2>
        <p className="mt-2 text-muted-foreground">
          The free Quick IQ test gives you an instant estimate with percentile — no signup.
        </p>
        <Link
          to="/tools/iq"
          className="mt-4 inline-flex h-11 items-center rounded-full bg-primary px-6 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Take the free IQ test
        </Link>
      </div>
    </div>
  );
}
