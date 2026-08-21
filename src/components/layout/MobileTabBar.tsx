import { Link, useRouterState } from "@tanstack/react-router";
import { Crown, FolderDown, Home, LayoutGrid } from "lucide-react";

import { useVip } from "@/lib/vip";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    to: "/tools/iq",
    label: "Tools",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/tools"),
  },
  { to: "/vault", label: "Vault", icon: FolderDown, match: (p: string) => p.startsWith("/vault") },
] as const;

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { openVipModal, isVip } = useVip();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl sm:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label}>
              <Link
                to={to}
                className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 text-[0.65rem] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={openVipModal}
            className="flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-1 text-[0.65rem] font-medium text-muted-foreground transition-colors"
          >
            <Crown className="size-5 text-primary" aria-hidden="true" />
            {isVip ? "VIP" : "Go VIP"}
          </button>
        </li>
      </ul>
    </nav>
  );
}
