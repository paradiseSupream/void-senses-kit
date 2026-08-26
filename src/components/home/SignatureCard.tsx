import { ArrowRight, Ghost, Share2, Sparkles } from "lucide-react";

import { TOOLS } from "@/lib/tools";

const BULLETS = [
  "Six shadow axes on a live radar — not one vague label",
  "One of eight archetypes, with the edge and the risk it carries",
  "HD share card, ready the second you finish",
];

/**
 * One hero test instead of seven equal cards. The signature test is the most
 * shared tool in the suite, so it gets its own weight above the rest.
 */
export function SignatureCard() {
  const tool = TOOLS.find((t) => t.slug === "dark-personality");
  if (!tool) return null;

  return (
    <article
      style={{ ["--tool-accent" as string]: tool.accent }}
      className="bento spotlight relative grid h-full lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
    >
      <div className="order-2 p-6 sm:p-8 lg:order-1">
        <span className="label-mono inline-flex items-center gap-2">
          <Sparkles className="size-3.5" style={{ color: "var(--tool-accent)" }} aria-hidden="true" />
          most shared test
        </span>
        <h2 className="text-section mt-3">{tool.name}</h2>
        <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {tool.promise}
        </p>
        <ul className="mt-5 grid gap-2">
          {BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Ghost
                className="mt-0.5 size-4 shrink-0"
                style={{ color: "var(--tool-accent)" }}
                aria-hidden="true"
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={`${tool.path}?auto=1`}
            className="btn-glow inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold"
          >
            Reveal my archetype <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <span className="label-mono inline-flex min-h-12 items-center gap-2 px-1">
            <Share2 className="size-3.5" aria-hidden="true" /> {tool.duration} · free
          </span>
        </div>
      </div>

      <div className="relative order-1 min-h-40 lg:order-2">
        <img
          src={tool.cover}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 size-full object-cover opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-void-0 via-void-0/55 to-transparent lg:bg-gradient-to-r"
        />
      </div>
    </article>
  );
}
