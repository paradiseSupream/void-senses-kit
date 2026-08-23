import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ShieldCheck, Sparkles, Timer } from "lucide-react";

import { track } from "@/lib/monetization";
import type { ToolMeta } from "@/lib/tools";

type Props = {
  tool: ToolMeta;
  /** Single, ad-matched promise shown as the H1. */
  headline: string;
  /** Short sub-line that repeats the ad's offer in the visitor's words. */
  sub: string;
  /** Primary CTA label — the only action on the page. */
  cta: string;
  /** Three plain-language reasons to finish the test. */
  reasons: [string, string, string];
};

/**
 * Dedicated paid-traffic landing page: one promise, one CTA, zero navigation
 * away from the funnel. Everything below the fold exists only to remove doubt
 * before the visitor taps start.
 */
export function AdLanding({ tool, headline, sub, cta, reasons }: Props) {
  const Icon = tool.icon;
  const startTo = `${tool.path}?auto=1`;

  useEffect(() => {
    track({ event_type: "funnel", slot: "ad_landing_view", tool_slug: tool.slug });
  }, [tool.slug]);

  const onStart = () => {
    track({ event_type: "funnel", slot: "ad_landing_cta", tool_slug: tool.slug });
  };

  return (
    <div className="aurora grain relative overflow-hidden">
      <div className="void-grid absolute inset-0 -z-10" aria-hidden="true" />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
        <div className="text-center lg:text-left">
          <span className="label-mono inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-primary backdrop-blur-xl">
            <Sparkles className="size-3.5" aria-hidden="true" />
            No signup · {tool.duration}
          </span>

          <h1 className="mt-5 font-display text-[2.3rem] leading-[1.03] font-bold tracking-tight text-balance sm:mt-7 sm:text-6xl">
            {headline}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[0.97rem] leading-relaxed text-pretty text-muted-foreground sm:mt-6 sm:text-lg lg:mx-0">
            {sub}
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:mt-8 lg:items-start">
            <Link
              to={tool.path}
              search={{ auto: "1" }}
              onClick={onStart}
              className="btn-glow inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-8 text-base font-semibold sm:w-auto"
            >
              {cta} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <p className="label-mono flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Free · nothing saved · no email required
            </p>
          </div>

          <ul className="mx-auto mt-8 grid max-w-md gap-2.5 text-left sm:mt-10 lg:mx-0">
            {reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel relative overflow-hidden rounded-3xl border border-hairline">
          <img
            src={tool.cover}
            alt={`${tool.name} result preview`}
            width={1024}
            height={640}
            loading="eager"
            className="h-56 w-full object-cover sm:h-72"
          />
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl border border-hairline bg-surface-2">
                <Icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold">{tool.name}</p>
                <p className="text-sm text-muted-foreground">{tool.tagline}</p>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Questions", value: tool.facts.steps },
                { label: "Time", value: tool.facts.time },
                { label: "You get", value: tool.facts.output },
              ].map((fact) => (
                <div key={fact.label} className="rounded-xl border border-hairline bg-surface/60 p-3">
                  <dt className="label-mono text-[0.65rem] text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-1 text-sm font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <p className="rounded-xl border border-hairline bg-surface/60 p-3 text-sm italic text-muted-foreground">
              {tool.teaser}
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Ready when you are
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Every attempt draws a fresh, randomised question set, so the result stays honest even
            if you come back tomorrow.
          </p>
          <Link
            to={tool.path}
            search={{ auto: "1" }}
            onClick={onStart}
            className="btn-glow mt-7 inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-semibold"
          >
            {cta} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="label-mono mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Timer className="size-3.5" aria-hidden="true" />
            {tool.duration} · results on this device only
          </p>
        </div>
      </section>

      <p className="sr-only">{startTo}</p>
    </div>
  );
}
