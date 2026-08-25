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
    <header className="sticky top-0 z-30 px-2 pt-2 sm:px-4 sm:pt-3">
      <div className="dock mx-auto flex max-w-7xl items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-5">
        <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-2.5">
          <LogoMark className="size-8 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-90" />
          <span className="truncate font-display text-[0.95rem] font-bold tracking-[-0.03em] sm:text-lg">
            Senses of Void
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-5 hidden items-center gap-0.5 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:bg-void-2/70 hover:text-foreground data-[status=active]:bg-void-2/80 data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {isVip ? (
          <button
            type="button"
            onClick={() => openVipModal()}
            className="capsule capsule-active ml-auto inline-flex shrink-0 items-center gap-2 px-3 py-1.5 text-xs font-semibold"
          >
            <Crown className="size-3.5" aria-hidden="true" />
            VIP active
          </button>
        ) : (
          <Link
            to="/vault"
            className="btn-ghost ml-auto inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold"
          >
            Free vault
          </Link>
        )}
      </div>
    </header>
  );
}
