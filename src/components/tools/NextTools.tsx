import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

import { AdSlot } from "@/components/monetization/AdSlot";
import { adVariant, track } from "@/lib/monetization";
import { trackFunnel } from "@/lib/funnel";
import { relatedTools } from "@/lib/tools";

/** Chains the session after a result: two accent-themed suggestions. */
export function NextTools({ slug, heading = "Try next" }: { slug: string; heading?: string }) {
  const next = relatedTools(slug);
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    setVariant(adVariant());
    track({ event_type: "tool_complete", slot: `result-${slug}`, tool_slug: slug });
    trackFunnel("result_view", slug);
  }, [slug]);

  if (next.length === 0) return null;

  return (
    <section className="mt-14">
      {/* A/B: the result slot only renders in the result-heavy variant, so its
          RPM/CTR can be compared against the gate-heavy arm. */}
      {variant === "result_heavy" ? (
        <AdSlot id={`result-${slug}`} toolSlug={slug} className="mb-10" />
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
