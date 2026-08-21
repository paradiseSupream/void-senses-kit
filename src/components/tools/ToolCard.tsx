import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import type { ToolMeta } from "@/lib/tools";

export function ToolCard({ tool }: { tool: ToolMeta }) {
  const Icon = tool.icon;

  return (
    <Link
      to={tool.path}
      style={{ ["--tool-accent" as string]: tool.accent }}
      className="panel lift group relative flex flex-col overflow-hidden p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 size-52 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: "var(--tool-accent)" }}
      />

      <div className="flex items-start justify-between gap-3">
        <span className="accent-tile size-11">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="label-mono rounded-full border border-hairline bg-surface/50 px-2.5 py-1">
          {tool.duration}
        </span>
      </div>

      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{tool.name}</h3>
      <p
        className="mt-1 text-sm font-medium"
        style={{ color: "color-mix(in oklab, var(--tool-accent) 88%, white)" }}
      >
        {tool.tagline}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {tool.description}
      </p>

      <ul className="mt-5 flex flex-wrap gap-1.5">
        {tool.highlights.map((item) => (
          <li
            key={item}
            className="label-mono rounded-md border border-hairline bg-surface-2/50 px-2 py-1 text-[10px] text-foreground/70"
          >
            {item}
          </li>
        ))}
      </ul>

      <span className="mt-6 inline-flex items-center gap-1.5 border-t border-hairline pt-4 text-sm font-semibold text-foreground">
        Open {tool.category === "Assets" ? "vault" : "tool"}
        <ArrowUpRight
          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ color: "var(--tool-accent)" }}
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
