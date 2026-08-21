import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ShieldCheck } from "lucide-react";

import { TOOLS } from "@/lib/tools";

export function ToolShell({
  eyebrow,
  title,
  intro,
  slug,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  /** Matches a slug in the tool registry so the header inherits its accent + icon. */
  slug?: string;
  children: ReactNode;
}) {
  const tool = TOOLS.find((item) => item.slug === slug);
  const Icon = tool?.icon;

  return (
    <div style={tool ? ({ ["--tool-accent" as string]: tool.accent } as never) : undefined}>
      <header className="aurora grain relative overflow-hidden border-b border-hairline">
        <div className="void-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-16">
          <Link
            to="/"
            className="label-mono inline-flex items-center gap-1 transition-colors hover:text-primary"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" /> All tools
          </Link>

          <div className="mt-7 flex items-start gap-4">
            {Icon ? (
              <span className="accent-tile size-14 shrink-0">
                <Icon className="size-6" aria-hidden="true" />
              </span>
            ) : null}
            <div className="min-w-0">
              <span className="label-mono block">{eyebrow}</span>
              <h1 className="mt-1.5 font-display text-3xl leading-tight font-bold text-balance sm:text-[2.6rem]">
                {title}
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
            {intro}
          </p>

          {tool ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {tool.highlights.map((item) => (
                <li
                  key={item}
                  className="label-mono rounded-full border border-hairline bg-surface/60 px-3 py-1 text-foreground/75"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        {children}

        <p className="mt-14 flex items-start gap-2 rounded-xl border border-hairline bg-surface/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          Everything is scored on your device — no answers are uploaded. For entertainment and
          self-reflection only, not clinical psychological or medical assessment.
        </p>
      </div>
    </div>
  );
}
