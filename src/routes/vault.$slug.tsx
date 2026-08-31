import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Download, ExternalLink, ShieldCheck } from "lucide-react";

import { AdSlot } from "@/components/monetization/AdSlot";
import { NativeAdCard } from "@/components/monetization/NativeAdCard";
import { useActionGate } from "@/components/monetization/ActionGate";
import { vaultBySlug, vaultRelated, type VaultItem } from "@/lib/vault-catalog";

export const Route = createFileRoute("/vault/$slug")({
  loader: ({ params }) => {
    const item = vaultBySlug(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Resource unavailable — Senses of Void" }, { name: "robots", content: "noindex" }],
      };
    }
    const { item } = loaderData;
    const url = `https://sensesofvoid.app/vault/${item.slug}`;
    const title = `${item.title} — Free Download`;
    return {
      meta: [
        { title },
        { name: "description", content: item.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: item.tagline },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Senses of Void" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: item.title,
            description: item.detail,
            category: item.category,
            url,
            brand: { "@type": "Brand", name: "Senses of Void" },
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url,
            },
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
                name: "Free Digital Vault",
                item: "https://sensesofvoid.app/vault",
              },
              { "@type": "ListItem", position: 3, name: item.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: VaultNotFound,
  component: VaultDetail,
});

function VaultNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-section">Resource not found</h1>
      <p className="mt-3 text-muted-foreground">
        This item is no longer listed. Browse the full vault instead.
      </p>
      <Link
        to="/vault"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to the vault
      </Link>
    </div>
  );
}

function VaultDetail() {
  const { item } = Route.useLoaderData();
  const related = vaultRelated(item);
  const runGated = useActionGate();

  // Free users pass the sponsor smartlink before the resource opens; VIPs skip.
  const unlock = async (target: VaultItem) => {
    await runGated({ toolSlug: "vault", force: true });
    window.open(target.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        to="/vault"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All free resources
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <article>
          <span className="label-mono text-primary">{item.category}</span>
          <h1 className="mt-2 text-section">{item.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{item.tagline}</p>

          <p className="mt-6 text-foreground/90">{item.detail}</p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="label-mono rounded bg-surface-2/70 px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>

          <AdSlot id="result-vault" toolSlug="vault" className="mt-8" />

          <h2 className="mt-10 font-display text-xl">What you get</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {item.format} — delivered from the official source, always the latest version.
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              Licence: {item.license}. Safe to use in personal and client work.
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              No signup, no email wall, no download manager.
            </li>
          </ul>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass rounded-2xl border border-primary/25 p-6">
            <span className="label-mono">Free download</span>
            <p className="mt-1 font-display text-3xl font-bold text-primary">$0</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.license}</p>
            <button
              type="button"
              onClick={() => void unlock(item)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Download className="size-4" aria-hidden="true" /> Unlock &amp; open
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" /> Verified legal
              source · opens in a new tab
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground underline hover:text-foreground"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" /> View official page
            </a>
          </div>
          <div className="mt-4">
            <NativeAdCard index={0} />
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-14" aria-labelledby="vault-related">
          <h2 id="vault-related" className="font-display text-xl">
            More free {item.category} resources
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((other) => (
              <Link
                key={other.slug}
                to="/vault/$slug"
                params={{ slug: other.slug }}
                className="glass lift rounded-xl p-5"
              >
                <span className="label-mono">{other.category}</span>
                <span className="mt-3 block font-display text-lg text-foreground">
                  {other.title}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">{other.tagline}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <AdSlot id="result-vault-footer" toolSlug="vault" className="mt-12" />
    </div>
  );
}
