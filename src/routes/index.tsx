import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Cpu,
  Download,
  Fingerprint,
  Gauge,
  Heart,
  Laugh,
  MousePointerClick,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet,
  Zap,
} from "lucide-react";

import { TOOLS, searchTools, type ToolMeta } from "@/lib/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { NativeAdCard, withNativeAds } from "@/components/monetization/NativeAdCard";
import { SampleResult } from "@/components/home/SampleResult";
import { StreakChallenge } from "@/components/home/StreakChallenge";
import { HomeFaq } from "@/components/home/HomeFaq";
import { useVip } from "@/lib/vip";
import { copyVariant, trackExperiment, type CopyVariant } from "@/lib/monetization";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Free IQ & Psychology Tests With Instant Visual Results" },
      {
        name: "description",
        content:
          "Take free IQ, childhood trauma, dark personality and love compatibility tests. Randomised questions, instant radar reports and HD share cards. No signup.",
      },
      { property: "og:title", content: "Free IQ & Psychology Tests With Instant Visual Results" },
      {
        property: "og:description",
        content:
          "Seven free tools: IQ, trauma, dark personality, love match, AI roast, prompt maker and a free asset vault. Results in minutes, no signup.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://sensesofvoid.app/" },
      { property: "og:site_name", content: "Senses of Void" },
    ],
    links: [{ rel: "canonical", href: "https://sensesofvoid.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Senses of Void",
        url: "https://sensesofvoid.app",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://sensesofvoid.app/tools?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      }),
      },
    ],
  }),
  component: Home,
});

const STATS = [
  { icon: Gauge, k: "< 1.5s", v: "first paint" },
  { icon: Fingerprint, k: "On-device", v: "test scoring" },
  { icon: Download, k: "PDF · PNG", v: "instant export" },
  { icon: Sparkles, k: "7 tools", v: "one suite" },
];

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick a test",
    body: "Seven tools, each with one clear job. Tap and it starts — no account, no email.",
  },
  {
    icon: Timer,
    title: "Answer for 2–5 minutes",
    body: "One plain-language question per screen, randomised every single time you take it.",
  },
  {
    icon: Download,
    title: "Get your visual report",
    body: "A radar map, score bands, written analysis and an HD card ready to share.",
  },
];

const PILLARS = [
  {
    icon: Zap,
    title: "Instant, not eventual",
    body: "Every test scores locally the moment you answer. No spinners, no round trips, no account wall between you and the result.",
  },
  {
    icon: ShieldCheck,
    title: "Private by architecture",
    body: "Answers never leave the browser. Only the AI roast tool sends text to a server, and nothing about it is stored.",
  },
  {
    icon: Cpu,
    title: "Never the same test twice",
    body: "Questions and answer order are drawn fresh from a large bank each run, so results stay honest and retakes stay interesting.",
  },
];

type Goal = { id: string; label: string; icon: typeof Brain; slugs: string[] };

const GOALS: Goal[] = [
  { id: "all", label: "Show everything", icon: Sparkles, slugs: TOOLS.map((t) => t.slug) },
  { id: "mind", label: "How smart am I?", icon: Brain, slugs: ["iq", "prompt-maker"] },
  {
    id: "past",
    label: "What shaped me?",
    icon: Fingerprint,
    slugs: ["child-trauma", "dark-personality"],
  },
  { id: "love", label: "My relationship", icon: Heart, slugs: ["love-match", "dark-personality"] },
  { id: "fun", label: "Just for fun", icon: Laugh, slugs: ["roast", "prompt-maker", "vault"] },
];

/**
 * Hero copy A/B test. Three arms compete on the fastest signal we have against
 * bounce: the share of exposed sessions that reach `test_start` in the funnel.
 */
const HERO_COPY: Record<
  CopyVariant,
  { badge: string; title: string; accent: string; sub: string; cta: string; second: string }
> = {
  clarity: {
    badge: "100% free · no signup · ad supported",
    title: "Free IQ & psychology tests",
    accent: "that actually show you something",
    sub: "Answer for 2–5 minutes and get a radar map of your mind, written analysis and an HD card you can share — scored entirely in your browser, with fresh randomised questions every single time.",
    cta: "Start the free IQ test",
    second: "See all 7 tools",
  },
  curiosity: {
    badge: "7 free tests · results in 3 minutes",
    title: "What does your mind",
    accent: "actually look like?",
    sub: "One question at a time, a radar map of your traits at the end, and an HD card worth screenshotting. No signup, no email, nothing saved.",
    cta: "Reveal my results — free",
    second: "Browse all 7 tests",
  },
  speed: {
    badge: "No signup · starts instantly",
    title: "Take a real IQ test",
    accent: "in under 3 minutes",
    sub: "Timed, randomised questions scored on your device the second you finish — with a visual report and share card you can download straight away.",
    cta: "Start now — 3 minutes",
    second: "Or pick another test",
  },
};

function Home() {
  const [query, setQuery] = useState("");
  const [arm, setArm] = useState<CopyVariant>("clarity");
  const copy = HERO_COPY[arm];

  useEffect(() => {
    const picked = copyVariant();
    setArm(picked);
    trackExperiment("hero_view", picked);
  }, []);
  const [goal, setGoal] = useState("all");
  const { openVipModal, isVip } = useVip();

  const results = useMemo<ToolMeta[]>(() => {
    const active = GOALS.find((g) => g.id === goal) ?? GOALS[0]!;
    return searchTools(query).filter((t) => active.slugs.includes(t.slug));
  }, [query, goal]);
  const slots = useMemo(() => withNativeAds(results), [results]);
  const popular = useMemo(
    () => TOOLS.filter((t) => ["iq", "dark-personality", "roast", "love-match"].includes(t.slug)),
    [],
  );

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="aurora grain relative overflow-hidden border-b border-hairline">
        <div className="void-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
          <div className="text-center lg:text-left">
            <span
              className="reveal label-mono inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-primary backdrop-blur-xl"
              style={{ animationDelay: "0ms" }}
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              {copy.badge}
            </span>

            <h1
              className="reveal mt-5 font-display text-[2.3rem] leading-[1.03] font-bold tracking-tight text-balance sm:mt-7 sm:text-6xl lg:text-[4.1rem]"
              style={{ animationDelay: "60ms" }}
            >
              {copy.title}
              <span className="text-gradient mt-1 block">{copy.accent}</span>
            </h1>

            <p
              className="reveal mx-auto mt-4 max-w-xl text-[0.97rem] leading-relaxed text-pretty text-muted-foreground sm:mt-6 sm:text-lg lg:mx-0"
              style={{ animationDelay: "120ms" }}
            >
              {copy.sub}
            </p>

            <div
              className="reveal mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap lg:justify-start"
              style={{ animationDelay: "180ms" }}
            >
              <Link
                to="/tools/iq"
                onClick={() => trackExperiment("hero_cta", arm)}
                className="btn-glow inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold"
              >
                {copy.cta} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="#suite"
                onClick={() => trackExperiment("hero_secondary", arm)}
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-hairline bg-surface/60 px-7 text-base font-semibold backdrop-blur-xl transition-colors hover:bg-surface-2"
              >
                {copy.second}
              </a>
            </div>

            <p
              className="reveal label-mono mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 lg:justify-start"
              style={{ animationDelay: "220ms" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-primary" aria-hidden="true" /> free forever
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Timer className="size-3.5 text-primary" aria-hidden="true" /> result in 3 min
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" /> no account
              </span>
            </p>
          </div>

          <div className="reveal" style={{ animationDelay: "260ms" }}>
            <SampleResult />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14">
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {STATS.map(({ icon: Icon, k, v }) => (
              <div key={k} className="glass rounded-xl px-3 py-3.5 text-center sm:py-4">
                <Icon className="mx-auto size-4 text-primary" aria-hidden="true" />
                <dt className="mt-2 font-display text-base font-semibold">{k}</dt>
                <dd className="label-mono mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="border-b border-hairline bg-surface/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <span className="label-mono">How it works</span>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-5">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="panel flex items-start gap-4 p-5">
                <span className="accent-tile size-10 shrink-0">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold">
                    <span className="label-mono mr-2">0{i + 1}</span>
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Popular rail (mobile-first swipe) ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="label-mono">Most taken this week</span>
            <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight sm:text-2xl">
              Start with a crowd favourite
            </h2>
          </div>
        </div>
        <ul className="mt-5 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {popular.map((tool) => {
            const Icon = tool.icon;
            return (
              <li key={tool.slug} className="w-[15rem] shrink-0 snap-start">
                <Link
                  to={tool.path}
                  style={{ ["--tool-accent" as string]: tool.accent }}
                  className="panel lift group block h-full overflow-hidden"
                >
                  <div className="relative aspect-[16/10]">
                    <img
                      src={tool.cover}
                      alt=""
                      width={1024}
                      height={576}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-background to-transparent"
                    />
                    <span className="label-mono absolute top-2.5 left-2.5 rounded-full border border-primary/35 bg-background/80 px-2 py-0.5 text-primary backdrop-blur-md">
                      Free
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="flex items-center gap-2 font-display text-sm font-semibold">
                      <Icon
                        className="size-4 shrink-0"
                        style={{ color: "var(--tool-accent)" }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{tool.name}</span>
                    </span>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {tool.promise}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------------- Tool suite + goal finder ---------------- */}
      <section id="suite" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <span className="label-mono">Find your test</span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-4xl">
            What do you want to find out?
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Tap a goal and we&apos;ll show the right tools. Every one is free, starts instantly and
            finishes in minutes.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {GOALS.map(({ id, label, icon: Icon }) => {
            const active = goal === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setGoal(id)}
                aria-pressed={active}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  active
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-hairline bg-surface/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative mt-4 w-full sm:max-w-sm">
          <label htmlFor="hub-filter" className="sr-only">
            Filter tools
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="hub-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or search the suite…"
            className="min-h-11 w-full rounded-full border border-hairline bg-surface/60 py-2.5 pr-4 pl-10 text-sm backdrop-blur-xl placeholder:text-muted-foreground focus:border-primary/50"
          />
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {slots.map((slot, i) =>
            "ad" in slot ? (
              <NativeAdCard key={`ad-${i}`} index={slot.ad} />
            ) : (
              <ToolCard key={slot.item.slug} tool={slot.item} priority={i < 2} />
            ),
          )}
          {results.length === 0 ? (
            <p className="col-span-full py-14 text-center text-sm text-muted-foreground">
              Nothing matches "{query}".
            </p>
          ) : null}
        </div>
      </section>

      {/* ---------------- 3-test run (dwell time) ---------------- */}
      <section className="border-y border-hairline bg-surface/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <StreakChallenge />
        </div>
      </section>

      {/* ---------------- Pillars ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="max-w-xl">
          <span className="label-mono">Why it feels different</span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-4xl">
            Engineered like a product, not a quiz page
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel p-6">
              <span className="accent-tile size-11">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="border-y border-hairline bg-surface/20">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
          <span className="label-mono">Questions people ask</span>
          <h2 className="mt-2 mb-6 font-display text-2xl font-bold tracking-tight sm:text-4xl">
            Free to use, honestly explained
          </h2>
          <HomeFaq />
        </div>
      </section>

      {/* ---------------- Closing CTA ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="panel aurora grain relative overflow-hidden p-7 text-center sm:p-14">
          <h2 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-4xl">
            Everything here is free. Forever.
          </h2>
          <p className="mx-auto mt-3.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
            All {TOOLS.length} tools and the whole vault stay free — ads keep the lights on. If you
            prefer a clean screen, lifetime VIP removes every ad and export gate for one $19
            payment. No subscription, no renewal, no account.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/tools/iq"
              className="btn-glow inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold"
            >
              Take a free test <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => openVipModal()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-hairline bg-surface/60 px-6 text-sm font-semibold backdrop-blur-xl transition-colors hover:bg-surface-2"
            >
              <Wallet className="size-4" aria-hidden="true" />
              {isVip ? "VIP active" : "Remove ads for $19 (optional)"}
            </button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            All tests are for entertainment and self-reflection only, not clinical psychological or
            medical assessment.
          </p>
        </div>
      </section>
    </div>
  );
}
