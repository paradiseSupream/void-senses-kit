import { Link, useRouterState } from "@tanstack/react-router";
import { Crown, FolderDown, Home, LayoutGrid } from "lucide-react";

import { useVip } from "@/lib/vip";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    to: "/tools",
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
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] sm:hidden"
    >
      <ul className="dock mx-auto grid max-w-md grid-cols-4 rounded-[1.35rem] p-1">
        {ITEMS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label}>
              <Link
                to={to}
                className={`relative flex min-h-[3.1rem] flex-col items-center justify-center gap-1 rounded-[1.05rem] text-[0.65rem] font-medium transition-[color,transform] duration-[var(--dur-micro)] active:scale-95 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="capsule-active absolute inset-0 rounded-[1.05rem] transition-transform duration-[var(--dur-ui)] ease-[cubic-bezier(0.34,1.46,0.44,1)]"
                  />
                ) : null}
                <Icon className="relative size-5" aria-hidden="true" />
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => openVipModal()}
            className="flex min-h-[3.1rem] w-full flex-col items-center justify-center gap-1 rounded-[1.05rem] text-[0.65rem] font-medium text-muted-foreground transition-transform duration-[var(--dur-micro)] active:scale-95"
          >
            <Crown className="size-5 text-primary" aria-hidden="true" />
            {isVip ? "VIP" : "Go VIP"}
          </button>
        </li>
      </ul>
    </nav>
  );
}
