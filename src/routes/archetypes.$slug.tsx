import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Check, Sparkles } from "lucide-react";

import { AXIS_LABELS } from "@/lib/archetype-core";
import { archetypePageBySlug, type ArchetypePage } from "@/lib/archetype-seo";
import { AdSlot } from "@/components/monetization/AdSlot";

const BASE = "https://sensesofvoid.app";

export const Route = createFileRoute("/archetypes/$slug")({
  loader: ({ params }) => {
    const page = archetypePageBySlug(params.slug);
    if (!page) throw notFound();
    return { slug: page.key };
  },
  head: ({ params }) => {
    const page = archetypePageBySlug(params.slug);
    if (!page) {
      return { meta: [{ title: "Archetype not found" }, { name: "robots", content: "noindex" }] };
    }
    const url = `${BASE}${page.path}`;
    return {
      meta: [
        { title: `${page.title} | Senses of Void` },
        { name: "description", content: page.description },
        { name: "keywords", content: page.keywords.join(", ") },
        { property: "og:title", content: page.title },
        { property: "og:description", content: page.description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Senses of Void" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: page.archetype.name,
            description: page.description,
            url,
            isPartOf: { "@type": "WebSite", name: "Senses of Void", url: BASE },
            about: { "@type": "Thing", name: "Dark personality archetypes" },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.faq.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: BASE },
              { "@type": "ListItem", position: 2, name: "Shadow Archetypes", item: `${BASE}/archetypes` },
              { "@type": "ListItem", position: 3, name: page.archetype.name, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: ArchetypeMissing,
  component: ArchetypeDetail,
});

function ArchetypeMissing() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">That archetype does not exist</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Browse the full shadow taxonomy instead.
      </p>
      <Link
        to="/archetypes"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        All 8 archetypes
      </Link>
    </div>
  );
}

function ArchetypeDetail() {
  const { slug } = Route.useLoaderData();
  const page = archetypePageBySlug(slug) as ArchetypePage;
  const weights = Object.entries(page.archetype.weights) as [string, number][];
  const peak = Math.max(...weights.map(([, w]) => Math.abs(w)), 1);

  return (
    <article>
      <header className="relative overflow-hidden border-b border-hairline">
        <div className="aurora grain absolute inset-0">
          <div className="void-grid absolute inset-0" aria-hidden="true" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            <Link to="/archetypes" className="hover:text-primary">
              Archetypes
            </Link>
            <span className="px-2">/</span>
            <span className="text-primary">{page.short}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            {page.archetype.name}
          </h1>
          <p className="mt-3 text-base text-primary sm:text-lg">{page.archetype.tagline}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {page.rarity}
          </p>
          <Link
            to="/tools/dark-personality"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="size-4" aria-hidden="true" /> Am I this archetype? Free test
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {page.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}

        <section className="mt-8 rounded-2xl border border-hairline bg-surface-2/60 p-5">
          <h2 className="text-lg font-semibold tracking-tight">Axis signature</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How strongly each of the six axes pulls a profile toward this archetype.
          </p>
          <ul className="mt-4 space-y-3">
            {weights.map(([dim, weight]) => (
              <li key={dim}>
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span>{AXIS_LABELS[dim as keyof typeof AXIS_LABELS] ?? dim}</span>
                  <span className={weight < 0 ? "text-muted-foreground" : "text-primary"}>
                    {weight < 0 ? "inverse" : `${Math.round((weight / peak) * 100)}%`}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${weight < 0 ? "bg-muted-foreground/40" : "bg-primary"}`}
                    style={{ width: `${Math.max(6, (Math.abs(weight) / peak) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Signs you are the {page.short}</h2>
          <ul className="mt-4 space-y-2.5">
            {page.signs.map((sign) => (
              <li key={sign} className="flex gap-2.5 text-[15px] leading-relaxed text-muted-foreground">
                <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{sign}</span>
              </li>
            ))}
          </ul>
        </section>

        <AdSlot id="archetype_mid" className="my-10" />

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-hairline bg-surface-2/60 p-5">
            <h2 className="text-lg font-semibold tracking-tight">Strengths</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {page.strengths.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-hairline bg-surface-2/60 p-5">
            <h2 className="text-lg font-semibold tracking-tight">Shadow risks</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {page.risks.map((item) => (
                <li key={item} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">In relationships</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{page.relationships}</p>
          <h2 className="mt-8 text-xl font-semibold tracking-tight">At work</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{page.career}</p>
          <h2 className="mt-8 text-xl font-semibold tracking-tight">Growth edge</h2>
          <ol className="mt-3 space-y-2 text-[15px] leading-relaxed text-muted-foreground">
            {page.growth.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            Find out if this is actually your archetype
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            The free Dark Personality test scores all six axes in about four minutes — randomised
            items, attention checks, instant visual report, no signup.
          </p>
          <Link
            to="/tools/dark-personality"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Take the free test <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Frequently asked</h2>
          <dl className="mt-4 space-y-5">
            {page.faq.map((item) => (
              <div key={item.q} className="rounded-2xl border border-hairline bg-surface-2/60 p-5">
                <dt className="text-[15px] font-semibold">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Related archetypes</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {page.related.map((key) => {
              const related = archetypePageBySlug(key);
              if (!related) return null;
              return (
                <Link
                  key={key}
                  to="/archetypes/$slug"
                  params={{ slug: key }}
                  className="rounded-2xl border border-hairline bg-surface-2/60 p-4 transition-colors hover:border-primary/40"
                >
                  <p className="text-sm font-semibold">{related.archetype.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{related.archetype.tagline}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
          Senses of Void tests are psychometric-inspired tools for self-reflection and
          entertainment. They are not diagnostic instruments and do not replace assessment by a
          qualified professional.
        </p>
      </main>
    </article>
  );
}
