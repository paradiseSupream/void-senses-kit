import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, FolderOpen, ShieldCheck, Sparkles } from "lucide-react";

import { NativeAdCard, withNativeAds } from "@/components/monetization/NativeAdCard";
import { useActionGate } from "@/components/monetization/ActionGate";
import { AdSlot } from "@/components/monetization/AdSlot";
import {
  VAULT_CATEGORIES,
  VAULT_COUNT,
  VAULT_ITEMS,
  vaultCategoryCounts,
  vaultFeatured,
  type VaultItem,
} from "@/lib/vault-catalog";

const TITLE = `Free Digital Vault — ${VAULT_COUNT}+ Legit Free Tools, Kits & Books`;
const DESCRIPTION =
  "A hand-checked library of free, legally distributable digital products: UI kits, dev boilerplates, AI prompt packs, open textbooks, datasets, stock media and business templates. No account, no paywall.";
const COVER =
  "https://sensesofvoid.app/__l5e/assets-v1/3694b7f0-d5cc-4c5f-9a94-74e3fa5ea65c/cover-vault.jpg";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Free Digital Vault — Senses of Void" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: COVER },
      { name: "twitter:image", content: COVER },
      { property: "og:url", content: "https://sensesofvoid.app/vault" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/vault" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Free Digital Vault",
          description: DESCRIPTION,
          url: "https://sensesofvoid.app/vault",
          isPartOf: { "@type": "WebSite", name: "Senses of Void", url: "https://sensesofvoid.app" },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: VAULT_COUNT,
            itemListElement: VAULT_ITEMS.slice(0, 30).map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.title,
              url: `https://sensesofvoid.app/vault/${item.slug}`,
            })),
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
          ],
        }),
      },
    ],
  }),
  component: Vault,
});

function Vault() {
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const runGated = useActionGate();

  const counts = useMemo(() => vaultCategoryCounts(), []);
  const featured = useMemo(() => vaultFeatured(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VAULT_ITEMS.filter(
      (a) =>
        (category === "All" || a.category === category) &&
        (!q ||
          `${a.title} ${a.tagline} ${a.category} ${a.tags.join(" ")}`.toLowerCase().includes(q)),
    );
  }, [category, query]);

  const slots = useMemo(() => withNativeAds(filtered), [filtered]);

  // Every unlock passes the sponsor smartlink step for free users — this is the
  // highest-RPM surface on the site. VIPs skip it inside runGated.
  const unlock = async (item: VaultItem) => {
    await runGated({ toolSlug: "vault", force: true });
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <span className="label-mono">Tool 07 · Vault</span>
      <h1 className="mt-2 text-section">Free Digital Vault</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {VAULT_COUNT} hand-checked digital products in one place — UI kits, boilerplates, AI prompt
        packs, open textbooks, datasets, stock media and business templates. Every item is legally
        free to download and use: open source, public domain or an official free tier.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" /> 100% legal sources
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1">
          <Sparkles className="size-3.5 text-primary" aria-hidden="true" /> No account required
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1">
          <Download className="size-3.5 text-primary" aria-hidden="true" /> Instant unlock
        </span>
      </div>

      {/* Featured shelf — the highest-intent items get the first tap. */}
      <section className="mt-10" aria-labelledby="vault-featured">
        <h2 id="vault-featured" className="font-display text-xl">
          Most downloaded this week
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <Link
              key={item.slug}
              to="/vault/$slug"
              params={{ slug: item.slug }}
              className="glass lift rounded-xl border border-primary/20 p-4"
            >
              <span className="label-mono text-primary">{item.category}</span>
              <span className="mt-2 block font-display text-lg text-foreground">{item.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{item.tagline}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open pack <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Asset categories"
          className="flex flex-wrap gap-1 rounded-full border border-hairline bg-surface/60 p-1"
        >
          {(["All", ...VAULT_CATEGORIES] as const).map((cat) => {
            const count =
              cat === "All" ? VAULT_COUNT : (counts.find((c) => c.category === cat)?.count ?? 0);
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={category === cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto w-full sm:w-64">
          <label htmlFor="vault-search" className="sr-only">
            Search vault assets
          </label>
          <input
            id="vault-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 60+ resources…"
            className="w-full rounded-full border border-hairline bg-surface/60 px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50"
          />
        </div>
      </div>

      <AdSlot id="result-vault" toolSlug="vault" className="mt-8" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot, i) =>
          "ad" in slot ? (
            <NativeAdCard key={`ad-${i}`} index={slot.ad} />
          ) : (
            <article key={slot.item.slug} className="glass lift flex flex-col rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="label-mono rounded-full border border-hairline px-2 py-0.5">
                  {slot.item.category}
                </span>
                <span className="label-mono">{slot.item.format}</span>
              </div>
              <h3 className="mt-4 font-display text-xl text-foreground">
                <Link to="/vault/$slug" params={{ slug: slot.item.slug }} className="hover:text-primary">
                  {slot.item.title}
                </Link>
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{slot.item.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-1">
                {slot.item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="label-mono rounded bg-surface-2/70 px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void unlock(slot.item)}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-4" aria-hidden="true" /> Unlock free
              </button>
              <Link
                to="/vault/$slug"
                params={{ slug: slot.item.slug }}
                className="mt-2 text-center text-xs text-muted-foreground hover:text-foreground"
              >
                What&apos;s inside →
              </Link>
            </article>
          ),
        )}
      </div>

      <AdSlot id="result-vault-footer" toolSlug="vault" className="mt-10" />

      {filtered.length === 0 ? (
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <FolderOpen className="size-4" aria-hidden="true" /> No assets match this filter yet.
        </p>
      ) : null}
    </div>
  );
}
