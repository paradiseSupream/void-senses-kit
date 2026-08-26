import { ArrowRight } from "lucide-react";

import type { ToolMeta } from "@/lib/tools";

/**
 * Compact suite tile. On phones it stacks (icon over name) so two fit side by
 * side; from `sm` up it becomes the wide scan-friendly row.
 */
export function ToolRow({ tool }: { tool: ToolMeta }) {
  const Icon = tool.icon;
  return (
    <a
      href={`${tool.path}?auto=1`}
      style={{ ["--tool-accent" as string]: tool.accent }}
      className="bento group flex h-full flex-col gap-3 p-4 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:p-5"
    >
      <span className="accent-tile size-10 shrink-0 sm:size-11">
        <Icon className="size-5" style={{ color: "var(--tool-accent)" }} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg leading-tight text-balance sm:truncate sm:text-xl">
          {tool.name}
        </span>
        <span className="mt-1 line-clamp-2 block text-[0.8rem] leading-snug text-muted-foreground sm:mt-0.5 sm:truncate sm:text-sm">
          {tool.tagline}
        </span>
        <span className="label-mono mt-1.5 block sm:mt-1">
          {tool.category} · {tool.duration}
        </span>
      </span>
      <span className="capsule hidden size-10 shrink-0 place-items-center transition-colors group-hover:text-primary sm:grid">
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </a>
  );
}
