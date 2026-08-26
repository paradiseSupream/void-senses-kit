import { ArrowRight } from "lucide-react";

import type { ToolMeta } from "@/lib/tools";

/**
 * Compact suite row — used below the signature card so the remaining tools
 * scan as a list instead of competing as seven equal posters.
 */
export function ToolRow({ tool }: { tool: ToolMeta }) {
  const Icon = tool.icon;
  return (
    <a
      href={`${tool.path}?auto=1`}
      style={{ ["--tool-accent" as string]: tool.accent }}
      className="bento group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 p-4 sm:gap-4 sm:p-5"
    >
      <span className="accent-tile size-11 shrink-0">
        <Icon className="size-5" style={{ color: "var(--tool-accent)" }} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-xl">{tool.name}</span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">{tool.tagline}</span>
        <span className="label-mono mt-1 block">
          {tool.category} · {tool.duration}
        </span>
      </span>
      <span className="capsule grid size-10 shrink-0 place-items-center transition-colors group-hover:text-primary">
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </a>
  );
}
