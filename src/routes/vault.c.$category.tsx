import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";

import { AdSlot } from "@/components/monetization/AdSlot";
import { NativeAdCard, withNativeAds } from "@/components/monetization/NativeAdCard";
import { useActionGate } from "@/components/monetization/ActionGate";
import { recordUnlock, trackVaultLoop } from "@/lib/vault-loop";
import {
  categoryFromSlug,
  categorySlug,
  VAULT_CATEGORIES,
  vaultByCategory,
  type VaultItem,
} from "@/lib/vault-catalog";

export const Route = createFileRoute("/vault/c/$category")({
  loader: ({ params }) => {
    const category = categoryFromSlug(params.category);
    if (!category) throw notFound();
    return { category, items: vaultByCategory(category) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Collection unavailable — Senses of Void" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { category, items } = loaderData;
    const url = `https://sensesofvoid.app/vault/c/${categorySlug(category)}`;
    const title = `Top ${items.length} Free ${category} Downloads — Senses of Void`;
    const description = `A hand-checked collection of ${items.length} genuinely free ${category.toLowerCase()} resources: legal sources, no account, no paywall, instant unlock.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
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
            "@type": "ItemList",
            name: title,
            description,
            url,
            numberOfItems: items.length,
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.title,
              url: `https://sensesofvoid.app/vault/${item.slug}`,
            })),
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-section">Collection not found</h1>
      <Link to="/vault" className="mt-6 inline-block text-primary underline">
        Browse the full vault
      </Link>
    </div>
  ),
  component: VaultCollection,
});

function VaultCollection() {
  const { category, items } = Route.useLoaderData();
  const runGated = useActionGate();

  const unlock = async (target: VaultItem) => {
    trackVaultLoop("vault_unlock_start", target.slug);
    await runGated({ toolSlug: "vault", force: true });
    trackVaultLoop("vault_unlock", target.slug, recordUnlock(target.slug));
    window.open(target.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        to="/vault"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All free resources
      </Link>

      <h1 className="mt-6 text-section">
        Top {items.length} free {category} downloads
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every item is a legal, freely distributed release — open source, public domain, Creative
        Commons or an official free tier. Unlock as many as you want; no account needed.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {VAULT_CATEGORIES.filter((c) => c !== category).map((c) => (
          <Link
            key={c}
            to="/vault/c/$category"
            params={{ category: categorySlug(c) }}
            className="label-mono rounded-full border border-hairline px-3 py-1.5 hover:border-primary/50 hover:text-primary"
          >
            {c}
          </Link>
        ))}
      </div>

      <AdSlot id="result-vault-collection" toolSlug="vault" className="mt-8" />

      <div className="mt-8 grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {withNativeAds(items, 6).map((entry, i) =>
          "ad" in entry ? (
            <NativeAdCard key={`ad-${i}`} index={entry.ad} toolSlug="vault" />
          ) : (
            <article
              key={entry.item.slug}
              className="glass flex flex-col rounded-xl border border-hairline p-5"
            >
              <span className="label-mono text-primary">{entry.item.format}</span>
              <Link
                to="/vault/$slug"
                params={{ slug: entry.item.slug }}
                className="mt-2 block font-display text-lg text-foreground hover:text-primary"
              >
                {entry.item.title}
              </Link>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{entry.item.tagline}</p>
              <p className="label-mono mt-3 flex items-center gap-1.5 text-[0.6rem] text-muted-foreground">
                <ShieldCheck className="size-3 text-primary" aria-hidden="true" />
                {entry.item.license}
              </p>
              <button
                type="button"
                onClick={() => void unlock(entry.item)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-4" aria-hidden="true" /> Unlock free
              </button>
            </article>
          ),
        )}
      </div>

      <AdSlot id="result-vault-collection-footer" toolSlug="vault" className="mt-12" />
    </div>
  );
}
