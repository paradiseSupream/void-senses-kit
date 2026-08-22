import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Senses of Void" },
      {
        name: "description",
        content:
          "How Senses of Void handles test answers, local storage, advertising cookies and AI roast requests. Test results never leave your device.",
      },
      { property: "og:title", content: "Privacy Policy — Senses of Void" },
      {
        property: "og:description",
        content: "Test answers stay on your device. Here is exactly what we store and why.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://sensesofvoid.app/privacy" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/privacy" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Privacy Policy",
        url: "https://sensesofvoid.app/privacy",
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
            { "@type": "ListItem", position: 2, name: "Privacy Policy", item: "https://sensesofvoid.app/privacy" },
          ],
        }),
      },
    ],
  }),
  component: Privacy,
});

const SECTIONS = [
  {
    title: "What we store",
    body: "Test answers, scores and generated files are produced in your browser and are never uploaded. Preferences such as VIP status, cookie consent and dismissed banners are stored in your browser's local storage only.",
  },
  {
    title: "AI Roast Me",
    body: "The text you submit is sent to our server and forwarded to an AI provider to generate the roast. We do not store the text or the response. We store a one-way hash of your IP address with a request counter purely to enforce the ten-per-hour limit.",
  },
  {
    title: "Free Drive Vault",
    body: "Vault listings are read from our database. Downloads resolve to Google Drive links; Google's own privacy policy applies once you follow a link.",
  },
  {
    title: "Advertising",
    body: "We display advertising to keep the tools free. Ad partners may set cookies to measure performance. You can choose essential-only storage from the cookie settings link in the footer at any time.",
  },
  {
    title: "Your control",
    body: "Clearing your browser storage removes every preference we hold about you. There are no accounts, so there is nothing else to delete.",
  },
];

function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-muted-foreground">
        Short version: your test answers stay on your device, and we collect as little as possible.
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
