import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock } from "lucide-react";

import type { ToolMeta } from "@/lib/tools";

export function ToolCard({ tool, priority = false }: { tool: ToolMeta; priority?: boolean }) {
  const Icon = tool.icon;

  return (
    <Link
      to={tool.path}
      style={{ ["--tool-accent" as string]: tool.accent }}
      className="panel lift group relative flex flex-col overflow-hidden"
    >
      {/* Cover art gives every tool its own visual identity at a glance. */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src={tool.cover}
          alt={`${tool.name} cover art`}
          width={1024}
          height={576}
          loading={priority ? "eager" : "lazy"}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent"
        />
        <span className="label-mono absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-hairline bg-background/70 px-2.5 py-1 backdrop-blur-md">
          <Clock className="size-3" aria-hidden="true" />
          {tool.duration}
        </span>
        <span className="accent-tile absolute bottom-3 left-4 size-11 bg-background/70 backdrop-blur-md">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
          {tool.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tool.promise}</p>

        <p
          className="mt-3 truncate rounded-lg border border-hairline bg-surface-2/40 px-3 py-2 font-mono text-xs text-foreground/70"
          title={tool.teaser}
        >
          {tool.teaser}
        </p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tool.highlights.map((item) => (
            <li
              key={item}
              className="label-mono rounded-md border border-hairline bg-surface-2/50 px-2 py-1 text-[10px] text-foreground/70"
            >
              {item}
            </li>
          ))}
        </ul>

        <span
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-hairline bg-surface/60 px-4 text-sm font-semibold text-foreground transition-colors group-hover:bg-surface-2"
          style={{ borderColor: "color-mix(in oklab, var(--tool-accent) 35%, transparent)" }}
        >
          {tool.category === "Assets" ? "Open the vault" : "Start now"}
          <ArrowUpRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: "var(--tool-accent)" }}
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
