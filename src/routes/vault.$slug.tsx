import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

import { AdSlot } from "@/components/monetization/AdSlot";
import { NativeAdCard } from "@/components/monetization/NativeAdCard";
import { EmailCapture } from "@/components/monetization/EmailCapture";
import { useActionGate } from "@/components/monetization/ActionGate";
import { useVip } from "@/lib/vip";
import { useVipPrices } from "@/lib/vip-pricing";
import { markSeen, recordUnlock, trackVaultLoop } from "@/lib/vault-loop";
import {
  categorySlug,
  vaultAlsoGrabbed,
  vaultBySlug,
  vaultNext,
  vaultRelated,
  type VaultItem,
} from "@/lib/vault-catalog";

export const Route = createFileRoute("/vault/$slug")({
  loader: ({ params }) => {
    const item = vaultBySlug(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Resource unavailable — Senses of Void" },
          { name: "robots", content: "noindex" },
        ],
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

/** Small pack card used by both recommendation rows — each one can unlock inline. */
function PackCard({ item, onUnlock }: { item: VaultItem; onUnlock: (item: VaultItem) => void }) {
  return (
    <article className="glass flex flex-col rounded-xl p-5">
      <span className="label-mono text-primary">{item.category}</span>
      <Link
        to="/vault/$slug"
        params={{ slug: item.slug }}
        className="mt-2 block font-display text-lg text-foreground hover:text-primary"
      >
        {item.title}
      </Link>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{item.tagline}</p>
      <p className="label-mono mt-3 flex items-center gap-1.5 text-[0.6rem] text-muted-foreground">
        <ShieldCheck className="size-3 text-primary" aria-hidden="true" />
        {item.format} · {item.license}
      </p>
      <button
        type="button"
        onClick={() => onUnlock(item)}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20"
      >
        <Download className="size-4" aria-hidden="true" /> Unlock free
      </button>
    </article>
  );
}

function VaultDetail() {
  const { item } = Route.useLoaderData();
  const related = vaultRelated(item, 6);
  const alsoGrabbed = vaultAlsoGrabbed(item, 3);
  const next = vaultNext(item);
  const runGated = useActionGate();
  const { isVip, openVipModal } = useVip();
  const { monthly: ENTRY_PRICE } = useVipPrices();
  const [unlocks, setUnlocks] = useState(0);

  useEffect(() => {
    markSeen(item.slug);
    trackVaultLoop("vault_view", item.slug);
  }, [item.slug]);

  // Free users pass the sponsor smartlink before the resource opens; VIPs skip.
  const unlock = async (target: VaultItem) => {
    trackVaultLoop("vault_unlock_start", target.slug);
    await runGated({ toolSlug: "vault", force: true });
    const total = recordUnlock(target.slug);
    setUnlocks(total);
    trackVaultLoop("vault_unlock", target.slug, total);
    window.open(target.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 pb-24 sm:px-6 lg:pb-12">
      <Link
        to="/vault"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All free resources
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <article>
          <Link
            to="/vault/c/$category"
            params={{ category: categorySlug(item.category) }}
            className="label-mono text-primary hover:underline"
          >
            {item.category}
          </Link>
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

          <AdSlot id="result-vault-mid" toolSlug="vault" className="mt-8" />

          {unlocks > 0 ? (
            <EmailCapture toolSlug="vault" source="vault" className="mt-8" />
          ) : null}

          {!isVip && unlocks >= 3 ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Crown className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                {unlocks} packs unlocked — skip every sponsor step and browse ad-free?
              </p>
              <button
                type="button"
                onClick={() => openVipModal("monthly")}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                Instant unlock · {ENTRY_PRICE}
              </button>
            </div>
          ) : null}
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
            <NativeAdCard index={0} toolSlug="vault" />
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-14" aria-labelledby="vault-related">
          <h2 id="vault-related" className="font-display text-xl">
            More free {item.category} resources
          </h2>
          <div className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 3).map((other) => (
              <PackCard key={other.slug} item={other} onUnlock={(t) => void unlock(t)} />
            ))}
            <NativeAdCard index={1} toolSlug="vault" />
            {related.slice(3).map((other) => (
              <PackCard key={other.slug} item={other} onUnlock={(t) => void unlock(t)} />
            ))}
          </div>
          <Link
            to="/vault/c/$category"
            params={{ category: categorySlug(item.category) }}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            See the full {item.category} collection{" "}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      {alsoGrabbed.length ? (
        <section className="mt-14" aria-labelledby="vault-also">
          <h2 id="vault-also" className="font-display text-xl">
            People also grabbed
          </h2>
          <div className="mt-4 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alsoGrabbed.map((other) => (
              <PackCard key={other.slug} item={other} onUnlock={(t) => void unlock(t)} />
            ))}
          </div>
        </section>
      ) : null}

      <AdSlot id="result-vault-footer" toolSlug="vault" className="mt-12" />

      {/* Mobile loop: one tap to the next pack, so a visit never ends at one page. */}
      <Link
        to="/vault/$slug"
        params={{ slug: next.slug }}
        onClick={() => trackVaultLoop("vault_next", next.slug)}
        className="glass fixed inset-x-3 bottom-3 z-30 flex items-center justify-between gap-3 rounded-xl border border-primary/30 px-4 py-3 lg:hidden"
      >
        <span className="min-w-0">
          <span className="label-mono block text-[0.6rem] text-muted-foreground">Next pack</span>
          <span className="block truncate text-sm font-semibold">{next.title}</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
      </Link>
    </div>
  );
}
