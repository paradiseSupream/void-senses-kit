import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Play } from "lucide-react";
import { useEffect, useRef } from "react";

import { AdSlot } from "@/components/monetization/AdSlot";
import { track } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";
import { relatedTools } from "@/lib/tools";

/** Chains the session after a result: two accent-themed suggestions. */
export function NextTools({ slug, heading = "Try next" }: { slug: string; heading?: string }) {
  const next = relatedTools(slug);
  const navigate = useNavigate();
  const firedRef = useRef(false);

  useEffect(() => {
    track({ event_type: "tool_complete", slot: `result-${slug}`, tool_slug: slug });
    trackFunnel("result_view", slug);
  }, [slug]);

  const upNext = next[0];
  const goNext = () => {
    if (!upNext || firedRef.current) return;
    firedRef.current = true;
    track({ event_type: "tool_start", slot: `autochain-${slug}`, tool_slug: upNext.slug });
    void navigate({ to: upNext.path, search: { auto: "1" } as never });
  };

  if (next.length === 0) return null;

  return (
    <section className="mt-14">
      {/* A/B: the result slot only renders in the result-heavy variant, so its
          RPM/CTR can be compared against the gate-heavy arm. */}
      {variant === "result_heavy" ? (
        <AdSlot id={`result-${slug}`} toolSlug={slug} className="mb-10" />
      ) : null}

      {upNext ? (
        <div
          className="glass mb-6 flex items-center gap-3 rounded-2xl p-4"
          style={{ ["--tool-accent" as string]: upNext.accent }}
        >
          <span className="min-w-0 flex-1">
            <span className="label-mono">Up next</span>
            <span className="mt-0.5 block truncate font-display text-sm font-semibold">
              {upNext.name}
            </span>
          </span>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-background"
            style={{ background: "var(--tool-accent)" }}
          >
            <Play className="size-3.5" aria-hidden="true" /> Start now
          </button>
        </div>
      ) : null}

      <span className="label-mono">{heading}</span>


      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {next.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.slug}
              to={tool.path}
              style={{ ["--tool-accent" as string]: tool.accent }}
              className="panel lift group flex items-center gap-4 overflow-hidden p-3"
            >
              <img
                src={tool.cover}
                alt=""
                width={1024}
                height={576}
                loading="lazy"
                className="size-16 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-display text-sm font-semibold">
                  <Icon
                    className="size-4 shrink-0"
                    style={{ color: "var(--tool-accent)" }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{tool.name}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {tool.promise}
                </span>
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                style={{ color: "var(--tool-accent)" }}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
