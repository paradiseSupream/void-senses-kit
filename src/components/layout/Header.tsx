import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Search } from "lucide-react";

import { LogoMark } from "@/components/brand/LogoMark";
import { AdSlot } from "@/components/monetization/AdSlot";
import { TOOLS } from "@/lib/tools";
import { vaultQueryOptions } from "@/lib/vault";
import { useVip } from "@/lib/vip";

type Hit = { key: string; label: string; sub: string; to?: string; href?: string; kind: string };

export function Header() {
  const { openVipModal, isVip } = useVip();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { data: assets = [] } = useQuery({ ...vaultQueryOptions, enabled: query.trim().length > 0 });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const toolHits: Hit[] = TOOLS.filter((t) =>
      [t.name, t.tagline, t.description, t.category, ...t.keywords].join(" ").toLowerCase().includes(q),
    ).map((t) => ({ key: t.slug, label: t.name, sub: t.tagline, to: t.path, kind: "Tool" }));

    const assetHits: Hit[] = assets
      .filter((a) => `${a.title} ${a.description} ${a.category}`.toLowerCase().includes(q))
      .map((a) => ({ key: a.id, label: a.title, sub: a.category, to: "/vault", kind: "Vault" }));

    return [...toolHits, ...assetHits].slice(0, 8);
  }, [query, assets]);

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="size-8" />
          <span className="font-display text-base font-bold tracking-tight sm:text-lg">
            Senses of Void
          </span>
        </Link>

        <div ref={boxRef} className="relative order-3 w-full sm:order-none sm:mx-auto sm:max-w-md">
          <label htmlFor="global-search" className="sr-only">
            Search tools and vault assets
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="global-search"
            type="search"
            value={query}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search tools and vault assets…"
            className="w-full rounded-full border border-hairline bg-surface/60 py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50"
          />
          {open && query.trim() ? (
            <div className="glass absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl p-1">
              {hits.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">No matches.</p>
              ) : (
                hits.map((hit) => (
                  <Link
                    key={`${hit.kind}-${hit.key}`}
                    to={hit.to ?? "/"}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">{hit.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{hit.sub}</span>
                    </span>
                    <span className="label-mono shrink-0">{hit.kind}</span>
                  </Link>
                ))
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={openVipModal}
          className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:ml-0"
        >
          <Crown className="size-4" aria-hidden="true" />
          {isVip ? "VIP active" : "$19 Lifetime VIP"}
        </button>
      </div>

      <div className="hidden border-t border-hairline py-2 sm:block">
        <AdSlot id="header-leaderboard" />
      </div>
      <div className="border-t border-hairline py-2 sm:hidden">
        <AdSlot id="header-mobile" />
      </div>
    </header>
  );
}
