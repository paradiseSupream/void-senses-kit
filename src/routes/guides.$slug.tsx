import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { guideBySlug } from "@/lib/guides";
import { getTool } from "@/lib/tools";

const BASE = "https://sensesofvoid.app";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const guide = guideBySlug(params.slug);
    if (!guide) throw notFound();
    return { guide };
  },
  head: ({ params, loaderData }) => {
    const guide = loaderData?.guide;
    const url = `${BASE}/guides/${params.slug}`;
    if (!guide) {
      return { meta: [{ title: "Guide not found — Senses of Void" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: guide.metaTitle },
        { name: "description", content: guide.description },
        { property: "og:title", content: guide.title },
        { property: "og:description", content: guide.description },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "Senses of Void" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.description,
            url,
            dateModified: guide.updated,
            author: { "@type": "Organization", name: "Senses of Void", url: BASE },
            publisher: { "@type": "Organization", name: "Senses of Void", url: BASE },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Guides", item: `${BASE}/guides` },
              { "@type": "ListItem", position: 2, name: guide.title, item: url },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: guide.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        },
      ],
    };
  },
  component: GuidePage,
});

function GuidePage() {
  const { guide } = Route.useLoaderData();
  const tools = guide.tools.map((slug) => getTool(slug)).filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <Link to="/guides" className="label-mono text-muted-foreground">
        ← Guides
      </Link>
      <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{guide.title}</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{guide.intro}</p>

      <article className="mt-10 space-y-10">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>

      {tools.length ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Try it on yourself</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tools.map((tool) => (
              <Link
                key={tool!.slug}
                to={tool!.path}
                className="glass rounded-2xl p-5 transition-colors hover:border-primary/40"
              >
                <span className="label-mono">{tool!.duration}</span>
                <h3 className="mt-1 font-display text-xl">{tool!.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tool!.promise}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-2xl">Frequently asked</h2>
        <div className="mt-4 space-y-4">
          {guide.faqs.map((faq) => (
            <div key={faq.q} className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold">{faq.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="label-mono mt-10 text-muted-foreground">Last updated {guide.updated}</p>
    </main>
  );
}
