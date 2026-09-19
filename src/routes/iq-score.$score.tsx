import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import {
  IQ_SCORE_MAX,
  IQ_SCORE_MIN,
  iqBand,
  iqNeighbors,
  iqPercentile,
  iqRarity,
} from "@/lib/iq-score-seo";
import { SITE_BASE_URL } from "@/lib/sitemap-routes";

function parseScore(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < IQ_SCORE_MIN || n > IQ_SCORE_MAX) return null;
  return n;
}

export const Route = createFileRoute("/iq-score/$score")({
  beforeLoad: ({ params }) => {
    if (parseScore(params.score) === null) throw notFound();
  },
  head: ({ params }) => {
    const score = parseScore(params.score) ?? 100;
    const band = iqBand(score);
    const percentile = Math.round(iqPercentile(score));
    const rarity = iqRarity(score);
    const title = `IQ ${score} — What Does an IQ of ${score} Mean? | Senses of Void`;
    const description = `An IQ of ${score} is ${band.label.toLowerCase()} — higher than about ${percentile}% of people (roughly 1 in ${rarity}). What IQ ${score} means, and how to test your own score free.`;
    const url = `${SITE_BASE_URL}/iq-score/${score}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
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
            "@type": "Article",
            headline: `What does an IQ of ${score} mean?`,
            description,
            url,
            isPartOf: {
              "@type": "WebSite",
              name: "Senses of Void",
              url: SITE_BASE_URL,
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_BASE_URL },
              { "@type": "ListItem", position: 2, name: "IQ score meanings", item: `${SITE_BASE_URL}/iq-score` },
              { "@type": "ListItem", position: 3, name: `IQ ${score}`, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: IqScorePage,
});

function IqScorePage() {
  const { score: raw } = Route.useParams();
  const score = parseScore(raw) ?? 100;
  const band = iqBand(score);
  const percentile = Math.round(iqPercentile(score));
  const rarity = iqRarity(score);

  // Position of the marker on a 70–145 scale bar.
  const markerPct = ((score - IQ_SCORE_MIN) / (IQ_SCORE_MAX - IQ_SCORE_MIN)) * 100;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <nav className="label-mono text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/iq-score" className="hover:text-foreground">IQ score meanings</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">IQ {score}</span>
      </nav>

      <h1 className="mt-6 text-display">What does an IQ of {score} mean?</h1>
      <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
        An IQ of {score} is classified as <strong className="text-foreground">{band.label.toLowerCase()}</strong>.
        On the standard scale (average 100), it is higher than roughly{" "}
        <strong className="text-foreground">{percentile}%</strong> of people — about{" "}
        <strong className="text-foreground">1 in {rarity}</strong> people score {score} or higher.
      </p>

      <div className="mt-8 rounded-2xl border border-hairline bg-surface/60 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="label-mono text-muted-foreground">Score</span>
            <p className="mt-1 font-mono text-5xl font-bold text-primary">{score}</p>
          </div>
          <div className="text-right">
            <span className="label-mono text-muted-foreground">Classification</span>
            <p className="mt-1 text-xl font-semibold">{band.label}</p>
          </div>
        </div>

        <div className="relative mt-6" role="img" aria-label={`IQ ${score} on a scale from ${IQ_SCORE_MIN} to ${IQ_SCORE_MAX}`}>
          <div className="h-3 w-full rounded-full bg-gradient-to-r from-muted via-primary/40 to-primary" />
          <div
            className="absolute -top-1.5 h-6 w-1.5 rounded-full bg-foreground shadow"
            style={{ left: `calc(${markerPct}% - 3px)` }}
          />
          <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
            <span>{IQ_SCORE_MIN}</span>
            <span>100 (average)</span>
            <span>{IQ_SCORE_MAX}</span>
          </div>
        </div>
      </div>

      <section className="mt-10 space-y-4 leading-relaxed text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">What this range means</h2>
        <p>{band.description}</p>
        <p>
          IQ scores follow a bell curve centered on 100 with a standard deviation of 15, which is
          the convention used by widely known standardized tests. About 68% of people score between
          85 and 115, and about 95% score between 70 and 130.
        </p>
      </section>

      <section className="mt-10 space-y-4 leading-relaxed text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">A few honest caveats</h2>
        <p>
          A single score is an estimate, not a verdict. Online tests — including ours — measure a
          narrow slice of reasoning under time pressure. Motivation, sleep, language and test
          familiarity all move the number. For self-reflection and fun it is genuinely useful; for
          any formal decision, only a professionally administered assessment counts.
        </p>
      </section>

      <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <h2 className="text-xl font-semibold">Curious about your own score?</h2>
        <p className="mt-2 text-muted-foreground">
          Take the free Quick IQ test — randomized questions, instant percentile, no signup.
        </p>
        <Link
          to="/tools/iq"
          className="mt-4 inline-flex h-11 items-center rounded-full bg-primary px-6 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Take the free IQ test
        </Link>
      </div>

      <nav className="mt-12" aria-label="Nearby scores">
        <h2 className="label-mono text-muted-foreground">Nearby scores</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {iqNeighbors(score).map((s) => (
            <Link
              key={s}
              to="/iq-score/$score"
              params={{ score: String(s) }}
              className="rounded-full border border-hairline bg-surface/60 px-4 py-2 font-mono text-sm transition-colors hover:border-primary/60 hover:text-primary"
            >
              IQ {s}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
