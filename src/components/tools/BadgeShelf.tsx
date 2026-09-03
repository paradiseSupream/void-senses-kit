import { useEffect, useMemo, useState } from "react";
import { Award, Lock } from "lucide-react";
import { toast } from "sonner";

import { badges, drainNewBadges, markToolCompleted, type Badge } from "@/lib/badges";
import { track } from "@/lib/monetization";
import { TOOLS } from "@/lib/tools";

/**
 * Local achievement shelf shown under a result. Progress lives in storage
 * only — it exists to pull the visitor into the next test / vault unlock.
 */
export function BadgeShelf({ toolSlug }: { toolSlug: string }) {
  const [list, setList] = useState<Badge[] | null>(null);
  const total = useMemo(() => TOOLS.length, []);

  useEffect(() => {
    markToolCompleted(toolSlug);
    const current = badges(total);
    setList(current);
    const fresh = drainNewBadges(current);
    for (const badge of fresh) {
      toast.success(`Badge unlocked — ${badge.label}`);
      track({ event_type: "funnel", slot: "badge_earned", tool_slug: toolSlug, format: badge.id, zone: "badges" });
    }
  }, [toolSlug, total]);

  if (!list) return null;
  const earned = list.filter((badge) => badge.earned).length;

  return (
    <section className="panel p-4">
      <header className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Award className="size-4 text-primary" aria-hidden />
          Achievements
        </h3>
        <span className="label-mono text-xs text-muted-foreground">
          {earned}/{list.length}
        </span>
      </header>

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {list.map((badge) => (
          <li
            key={badge.id}
            className={`rounded-lg border p-2.5 ${
              badge.earned ? "border-primary/40 bg-primary/10" : "border-hairline bg-surface-2"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {badge.earned ? (
                <Award className="size-3.5 text-primary" aria-hidden />
              ) : (
                <Lock className="size-3.5 text-muted-foreground" aria-hidden />
              )}
              <span className="truncate">{badge.label}</span>
            </div>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{badge.hint}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${Math.round(badge.progress * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
