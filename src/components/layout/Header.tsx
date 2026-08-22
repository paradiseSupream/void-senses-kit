import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";

import { LogoMark } from "@/components/brand/LogoMark";
import { useVip } from "@/lib/vip";

const NAV = [
  { label: "Home", to: "/" as const },
  { label: "Tools", to: "/tools" as const },
  { label: "Vault", to: "/vault" as const },
];

export function Header() {
  const { openVipModal, isVip } = useVip();

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <LogoMark className="size-8 transition-transform duration-500 group-hover:rotate-90" />
          <span className="font-display text-base font-bold tracking-tight sm:text-lg">
            Senses of Void
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {isVip ? (
          <button
            type="button"
            onClick={openVipModal}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            <Crown className="size-3.5" aria-hidden="true" />
            VIP active
          </button>
        ) : (
          <Link
            to="/vault"
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-hairline bg-surface/60 px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-surface-2"
          >
            Free vault
          </Link>
        )}

      </div>
    </header>
  );
}
