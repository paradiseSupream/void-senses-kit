import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock } from "lucide-react";

import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import type { ToolMeta } from "@/lib/tools";

/**
 * Per-tool visual identity. Each recipe is a pure CSS overlay layered over the
 * cover art, so every test reads as its own product without extra assets.
 */
const IDENTITY: Record<string, string> = {
  // Memory / fractured geometry, soft violet-blue.
  "child-trauma":
    "repeating-linear-gradient(118deg, color-mix(in oklab, var(--light-violet) 16%, transparent) 0 1px, transparent 1px 26px), radial-gradient(70% 60% at 20% 100%, color-mix(in oklab, var(--light-violet) 26%, transparent), transparent 70%)",
  // Neural geometry / mathematical lattice, cyan precision.
  iq:
    "linear-gradient(color-mix(in oklab, var(--light-cyan) 12%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--light-cyan) 12%, transparent) 1px, transparent 1px), radial-gradient(60% 60% at 80% 0%, color-mix(in oklab, var(--light-cyan) 22%, transparent), transparent 70%)",
  // Reflective black, fractured crystal facets, deep violet tension.
  "dark-personality":
    "conic-gradient(from 210deg at 70% 20%, color-mix(in oklab, var(--light-violet) 26%, transparent), transparent 28%, color-mix(in oklab, var(--void-0) 60%, transparent) 55%, color-mix(in oklab, var(--light-violet) 18%, transparent) 78%, transparent)",
  "love-match":
    "radial-gradient(50% 50% at 25% 20%, color-mix(in oklab, var(--tool-accent) 26%, transparent), transparent 65%), radial-gradient(50% 50% at 80% 70%, color-mix(in oklab, var(--light-violet) 20%, transparent), transparent 65%)",
  roast:
    "repeating-linear-gradient(0deg, color-mix(in oklab, var(--tool-accent) 10%, transparent) 0 1px, transparent 1px 5px), radial-gradient(60% 50% at 50% 100%, color-mix(in oklab, var(--tool-accent) 26%, transparent), transparent 70%)",
  "prompt-maker":
    "repeating-linear-gradient(90deg, color-mix(in oklab, var(--light-cyan) 10%, transparent) 0 1px, transparent 1px 14px), radial-gradient(60% 60% at 15% 10%, color-mix(in oklab, var(--tool-accent) 22%, transparent), transparent 70%)",
  vault:
    "linear-gradient(160deg, color-mix(in oklab, var(--tool-accent) 18%, transparent), transparent 55%), repeating-linear-gradient(135deg, oklch(1 0 0 / 0.04) 0 1px, transparent 1px 18px)",
};

export function ToolCard({ tool, priority = false }: { tool: ToolMeta; priority?: boolean }) {
  const Icon = tool.icon;
  const tilt = usePointerTilt(4);

  return (
    <Link
      to={tool.path}
      style={{ ["--tool-accent" as string]: tool.accent }}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="bento spotlight tilt-3d group relative flex flex-col"
    >
      {/* Cover art plus a per-tool light recipe gives each test its own identity. */}
      <div className="relative aspect-[2/1] w-full overflow-hidden sm:aspect-[16/9]">
        <img
          src={tool.cover}
          alt={`${tool.name} cover art`}
          width={1024}
          height={576}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="size-full scale-[1.02] object-cover opacity-80 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 mix-blend-screen opacity-70"
          style={{ backgroundImage: IDENTITY[tool.slug], backgroundSize: "26px 26px, 26px 26px, auto" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-void-0 via-void-0/70 to-transparent"
        />
        <span className="label-mono absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-hairline bg-void-0/70 px-2.5 py-1 backdrop-blur-md">
          <Clock className="size-3" aria-hidden="true" />
          {tool.duration}
        </span>
        <span className="accent-tile absolute bottom-3 left-4 size-11 bg-void-0/70 backdrop-blur-md">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-xl leading-tight sm:text-2xl">
          {tool.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.promise}</p>

        <p
          className="mt-3 hidden truncate rounded-lg border border-hairline bg-void-2/50 px-3 py-2 font-mono text-xs text-foreground/65 sm:block"
          title={tool.teaser}
        >
          {tool.teaser}
        </p>

        <ul className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
          {tool.highlights.map((item) => (
            <li
              key={item}
              className="label-mono rounded-md border border-hairline bg-void-2/50 px-2 py-1 text-[10px] text-foreground/65"
            >
              {item}
            </li>
          ))}
        </ul>

        <span className="btn-ghost mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-foreground sm:mt-5">
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
