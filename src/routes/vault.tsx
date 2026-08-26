import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Download, FolderOpen } from "lucide-react";

import { NativeAdCard, withNativeAds } from "@/components/monetization/NativeAdCard";
import { useActionGate } from "@/components/monetization/ActionGate";
import { AdSlot } from "@/components/monetization/AdSlot";
import { VAULT_CATEGORIES, vaultQueryOptions, type VaultAsset } from "@/lib/vault";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "Free Drive Vault — UI Kits, Boilerplates & AI Prompt Packs" },
      {
        name: "description",
        content:
          "A curated free asset library: glass UI kits, SaaS boilerplates, 1000+ AI prompts, cheat sheets and reading notes. Instant Drive downloads.",
      },
      { property: "og:title", content: "Free Drive Vault — Senses of Void" },
      {
        property: "og:description",
        content: "Free UI kits, developer boilerplates, AI prompt megapacks and design cheat sheets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://sensesofvoid.app/__l5e/assets-v1/3694b7f0-d5cc-4c5f-9a94-74e3fa5ea65c/cover-vault.jpg" },
      { name: "twitter:image", content: "https://sensesofvoid.app/__l5e/assets-v1/3694b7f0-d5cc-4c5f-9a94-74e3fa5ea65c/cover-vault.jpg" },
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
        name: "Free Drive Vault",
        url: "https://sensesofvoid.app/vault",
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
            { "@type": "ListItem", position: 2, name: "Free Drive Vault", item: "https://sensesofvoid.app/vault" },
          ],
        }),
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(vaultQueryOptions),
  component: Vault,
});

function Vault() {
  const { data: assets } = useSuspenseQuery(vaultQueryOptions);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const runGated = useActionGate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter(
      (a) =>
        (category === "All" || a.category === category) &&
        (!q || `${a.title} ${a.description} ${a.category}`.toLowerCase().includes(q)),
    );
  }, [assets, category, query]);

  const slots = useMemo(() => withNativeAds(filtered), [filtered]);

  const download = async (asset: VaultAsset) => {
    // Vault downloads always pass the sponsor smartlink step for free users —
    // it is the highest-RPM surface on the site. VIPs skip it inside runGated.
    await runGated({ toolSlug: "vault", force: true });
    window.open(asset.drive_link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <span className="label-mono">Tool 07 · Assets</span>
      <h1 className="mt-2 text-section">Free Drive Vault</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        UI kits, developer boilerplates, AI prompt megapacks and cheat sheets — all free, all
        hosted on Drive, no account required.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Asset categories"
          className="flex flex-wrap gap-1 rounded-full border border-hairline bg-surface/60 p-1"
        >
          {VAULT_CATEGORIES.map((cat) => (
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
              {cat}
            </button>
          ))}
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
            placeholder="Search assets…"
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
            <article key={slot.item.id} className="glass lift flex flex-col rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="label-mono rounded-full border border-hairline px-2 py-0.5">
                  {slot.item.category}
                </span>
                <span className="label-mono">{slot.item.download_count} dl</span>
              </div>
              <h2 className="mt-4 font-display text-xl text-foreground">
                {slot.item.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{slot.item.description}</p>
              <button
                type="button"
                onClick={() => download(slot.item)}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-4" aria-hidden="true" /> Download Asset
              </button>
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
