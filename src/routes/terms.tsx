import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Senses of Void" },
      {
        name: "description",
        content:
          "Terms for using Senses of Void tools, the free Drive vault, AI roasts and lifetime VIP access. Entertainment and self-reflection only.",
      },
      { property: "og:title", content: "Terms of Service — Senses of Void" },
      {
        property: "og:description",
        content: "The rules for using the tools, the vault, AI roasts and lifetime VIP access.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://sensesofvoid.app/terms" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/terms" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Terms of Service",
        url: "https://sensesofvoid.app/terms",
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
            { "@type": "ListItem", position: 2, name: "Terms of Service", item: "https://sensesofvoid.app/terms" },
          ],
        }),
      },
    ],
  }),
  component: Terms,
});

const SECTIONS = [
  {
    title: "Nature of the tools",
    body: "All tests, scores, certificates and reports are for entertainment and self-reflection only. They are not clinical psychological or medical assessments, and must not be used for diagnosis, hiring, admissions or any consequential decision.",
  },
  {
    title: "Acceptable use",
    body: "Do not submit other people's private information to the AI roast tool, and do not use outputs to harass anyone. We may block access that abuses the service or bypasses rate limits.",
  },
  {
    title: "Vault assets",
    body: "Assets are curated third-party or first-party files provided as-is with no warranty. Check each asset's own licence before commercial use.",
  },
  {
    title: "Lifetime VIP",
    body: "VIP is a one-time payment that removes ads and export gates for as long as the product exists. It is not a subscription and does not renew. Refunds are available within 14 days if you have not downloaded a VIP export.",
  },
  {
    title: "Availability",
    body: "The service is provided as-is. Features, tools and asset listings can change, and AI generation depends on third-party providers that may be temporarily unavailable.",
  },
];

function Terms() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Terms of Service</h1>
      <p className="mt-3 text-muted-foreground">
        Plain terms for a simple product. Using Senses of Void means you accept them.
      </p>
      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
