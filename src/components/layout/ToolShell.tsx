import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Clock, Download, ListChecks, ShieldCheck } from "lucide-react";

import { TOOLS } from "@/lib/tools";
import { NextTools } from "@/components/tools/NextTools";
import { track } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";

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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    track({ event_type: "tool_start", slot: `tool-${slug}`, tool_slug: slug });
    trackFunnel("test_start", slug);
  }, [slug]);

  // Landing from an ad or tool list puts the big hero header above the fold,
  // so the actual test start sits off-screen — a top bounce source on mobile.
  // On entry, bring the interactive content into view (keeps a sliver of the
  // header visible for orientation).
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.scrollIntoView({ block: "start" });
      return;
    }
    const id = window.setTimeout(
      () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
      150,
    );
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div style={tool ? ({ ["--tool-accent" as string]: tool.accent } as never) : undefined}>
      <header className="relative overflow-hidden border-b border-hairline">
        {tool ? (
          <>
            <img
              src={tool.cover}
              alt=""
              width={1024}
              height={576}
              className="absolute inset-0 size-full scale-105 object-cover opacity-40"
              aria-hidden="true"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-void-0/50 via-void-0/85 to-void-0"
            />
          </>
        ) : (
          <div className="aurora grain absolute inset-0">
            <div className="void-grid absolute inset-0" aria-hidden="true" />
          </div>
        )}

        <div className="relative mx-auto max-w-3xl px-4 pt-6 pb-9 sm:px-6 sm:pt-10 sm:pb-14">
          <Link
            to="/tools"
            className="label-mono inline-flex min-h-11 items-center gap-1 transition-colors hover:text-primary"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" /> All tools
          </Link>

          <div className="mt-3 flex items-start gap-3.5 sm:mt-6">
            {Icon ? (
              <span className="accent-tile size-12 shrink-0 bg-background/60 backdrop-blur-md sm:size-14">
                <Icon className="size-5 sm:size-6" aria-hidden="true" />
              </span>
            ) : null}
            <div className="min-w-0">
              <span className="label-mono block">{eyebrow}</span>
              <h1 className="mt-1 text-section text-balance">
                {title}
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-pretty text-muted-foreground sm:text-base">
            {intro}
          </p>

          {tool ? (
            <>
              {/* What you'll get — readable in one glance before starting. */}
              <dl className="mt-6 grid grid-cols-3 gap-2">
                {[
                  { icon: ListChecks, k: "Format", v: tool.facts.steps },
                  { icon: Clock, k: "Takes", v: tool.facts.time },
                  { icon: Download, k: "You get", v: tool.facts.output },
                ].map(({ icon: FactIcon, k, v }) => (
                  <div key={k} className="hud-tile px-2.5 py-3 text-center sm:px-3">
                    <FactIcon
                      className="mx-auto size-4"
                      style={{ color: "var(--tool-accent)" }}
                      aria-hidden="true"
                    />
                    <dt className="label-mono mt-1.5 text-[0.6rem]">{k}</dt>
                    <dd className="mt-0.5 text-[0.72rem] leading-snug font-medium sm:text-xs">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-4 flex flex-wrap gap-2">
                {tool.highlights.map((item) => (
                  <li
                    key={item}
                    className="capsule label-mono px-3 py-1 text-foreground/75"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </header>

      <div
        ref={contentRef}
        className="mx-auto max-w-3xl scroll-mt-16 px-4 py-8 sm:px-6 sm:py-12"
      >
        {children}

        {slug ? <NextTools slug={slug} /> : null}

        <p className="mt-12 flex items-start gap-2 rounded-xl border border-hairline bg-void-1/50 p-4 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          Everything is scored on your device — no answers are uploaded. For entertainment and
          self-reflection only, not clinical psychological or medical assessment.
        </p>
      </div>
    </div>
  );
}
