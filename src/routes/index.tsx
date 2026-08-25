import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

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
import { AmbientCanvas } from "@/components/visuals/AmbientCanvas";
import { StreakChallenge } from "@/components/home/StreakChallenge";
import { HomeFaq } from "@/components/home/HomeFaq";
import { useVip } from "@/lib/vip";
import { copyVariant, trackExperiment, type CopyVariant } from "@/lib/monetization";

export const Route = createFileRoute("/")({
  // Paid-traffic landing: `?t=<slug>` sends the visitor straight to the tool
  // page with auto-start, instead of landing them on the home hero where they
  // need an extra click. Redirects happen before render (SSR) so ad clicks
  // never see the home page at all.
  beforeLoad: ({ location }) => {
    const t = (location.search as { t?: string }).t;
    if (!t) return;
    const tool = TOOLS.find((x) => x.slug === t);
    if (tool) {
      throw redirect({ to: tool.path, search: { auto: "1" } as never, replace: true });
    }
  },
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

const QUICK_PICKS = ["dark-personality", "love-match", "iq", "roast"] as const;

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

/**
 * Paid-traffic message match. `/?t=<slug>` swaps the hero into a single-promise
 * landing view for that exact test, so an ad click lands on the same words it
 * was sold with — no separate landing route to maintain, and the whole suite
 * stays one page below the fold.
 */
const FOCUS: Record<
  string,
  { title: string; accent: string; sub: string; cta: string; reasons: [string, string, string] }
> = {
  "dark-personality": {
    title: "Which dark archetype",
    accent: "is hiding in your shadow?",
    sub: "Eighteen randomised statements weigh strategy, detachment, ambition, control, charm and defiance — then name the archetype that runs you.",
    cta: "Reveal my archetype — free",
    reasons: [
      "Six shadow traits on a visual radar, not one vague label",
      "A fresh randomised question set every attempt",
      "HD share card ready to post the second you finish",
    ],
  },
  "love-match": {
    title: "How real is the chemistry",
    accent: "between you two?",
    sub: "Fifteen randomised questions score banter, trust, adventure, calm and spark, then hand you an honest verdict card built for stories.",
    cta: "Check our vibe — free",
    reasons: [
      "Five chemistry dimensions broken down, not one flat percentage",
      "About two minutes, works on any phone, no signup",
      "Story-sized card for Instagram and TikTok",
    ],
  },
  iq: {
    title: "Take a real IQ test",
    accent: "in under 3 minutes",
    sub: "Timed, randomised reasoning questions scored on your device the second you finish, with a visual report you can download straight away.",
    cta: "Start the IQ test — free",
    reasons: [
      "Scored instantly on your device, no waiting screen",
      "Different question set every run, so retakes stay honest",
      "Downloadable score report and share card",
    ],
  },
  "child-trauma": {
    title: "Which childhood patterns",
    accent: "still run your reactions?",
    sub: "Eighteen randomised statements build a radar of six emotional dimensions, with a written reflection for every band you land in.",
    cta: "See my patterns — free",
    reasons: [
      "Six emotional axes mapped, plus written reflection per band",
      "Answers never leave your browser — nothing is saved",
      "Takes about three minutes",
    ],
  },
};

const DEFAULT_REASONS: [string, string, string] = [
  "Scored on your device the moment you answer — no waiting, no account",
  "Fresh randomised questions every run, so results stay honest",
  "Visual radar report and an HD share card you can download free",
];

function Home() {
  const [query, setQuery] = useState("");
  const [arm, setArm] = useState<CopyVariant>("clarity");
  const [focusSlug, setFocusSlug] = useState<string | null>(null);

  useEffect(() => {
    const picked = copyVariant();
    setArm(picked);
    const slug = new URLSearchParams(window.location.search).get("t");
    if (slug && FOCUS[slug]) {
      setFocusSlug(slug);
      trackExperiment("hero_view", `focus:${slug}`);
      return;
    }
    trackExperiment("hero_view", picked);
  }, []);

  const focusTool = focusSlug ? (TOOLS.find((t) => t.slug === focusSlug) ?? null) : null;
  const focusCopy = focusSlug ? FOCUS[focusSlug] : undefined;
  const base = HERO_COPY[arm];
  const copy = focusCopy
    ? { ...base, title: focusCopy.title, accent: focusCopy.accent, sub: focusCopy.sub, cta: focusCopy.cta }
    : base;
  const reasons = focusCopy?.reasons ?? DEFAULT_REASONS;
  const primaryPath = focusTool ? `${focusTool.path}?auto=1` : "/tools/iq";
  const heroArm = focusSlug ? `focus:${focusSlug}` : arm;
  const [goal, setGoal] = useState("all");
  const { openVipModal, isVip } = useVip();

  const results = useMemo<ToolMeta[]>(() => {
    const active = GOALS.find((g) => g.id === goal) ?? GOALS[0]!;
    return searchTools(query).filter((t) => active.slugs.includes(t.slug));
  }, [query, goal]);
  const slots = useMemo(() => withNativeAds(results), [results]);

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="aurora grain relative overflow-hidden border-b border-hairline">
        <div className="void-grid absolute inset-0 -z-10" aria-hidden="true" />
        <AmbientCanvas className="-z-10 opacity-70" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
          <div className="text-center lg:text-left">
            <span
              className="reveal label-mono inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-primary backdrop-blur-xl"
              style={{ animationDelay: "0ms" }}
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              {copy.badge}
            </span>

            <h1
              className="reveal text-display mt-6 sm:mt-8"
              style={{ animationDelay: "60ms" }}
            >
              {copy.title}
              <span className="sheen-word mt-1.5 block">{copy.accent}</span>
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
              <a
                href={primaryPath}
                onClick={() => trackExperiment("hero_cta", heroArm)}
                className="btn-glow inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold"
              >
                {copy.cta} <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href="#suite"
                onClick={() => trackExperiment("hero_secondary", heroArm)}
                className="btn-ghost inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold"
              >
                {focusTool ? "See all 7 tests" : copy.second}
              </a>

            </div>

            <ul
              className="reveal mx-auto mt-6 grid max-w-xl gap-2 text-left sm:mt-7 lg:mx-0"
              style={{ animationDelay: "200ms" }}
            >
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>

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

            {/* Quick picks keep the top-converting tools reachable without any scroll. */}
            <ul className="reveal mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              {QUICK_PICKS.map((slug) => {
                const t = TOOLS.find((x) => x.slug === slug);
                if (!t) return null;
                const Icon = t.icon;
                return (
                  <li key={slug}>
                    <a
                      href={`${t.path}?auto=1`}
                      style={{ ["--tool-accent" as string]: t.accent }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-hairline bg-surface/60 px-4 text-sm font-semibold backdrop-blur-xl transition-colors hover:bg-surface-2"
                    >
                      <Icon
                        className="size-4"
                        style={{ color: "var(--tool-accent)" }}
                        aria-hidden="true"
                      />
                      {t.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>


          <div className="reveal hidden lg:block" style={{ animationDelay: "260ms" }}>
            <SampleResult />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 sm:pb-14">
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {STATS.map(({ icon: Icon, k, v }) => (
              <div key={k} className="hud-tile px-3 py-3 text-center sm:py-4">
                <Icon className="mx-auto size-4 text-primary" aria-hidden="true" />
                <dt className="mt-2 font-display text-base font-semibold tracking-[-0.02em]">
                  {k}
                </dt>
                <dd className="label-mono mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>


      {/* ---------------- Tool suite + goal finder ---------------- */}
      <section id="suite" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <span className="label-mono">Find your test</span>
          <h2 className="text-section mt-2.5">What do you want to find out?</h2>
          <p className="mt-2.5 hidden text-sm leading-relaxed text-muted-foreground sm:block">
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
                className={`capsule inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold ${
                  active ? "capsule-active" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>


        <div className="relative mt-4 hidden w-full sm:block sm:max-w-sm">
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
            className="min-h-11 w-full rounded-full border border-hairline bg-void-2/50 py-2.5 pr-4 pl-10 text-sm backdrop-blur-xl transition-colors placeholder:text-muted-foreground focus:border-primary/45 focus:bg-void-2/70"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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

      {/* ---------------- How it works ---------------- */}
      <section className="border-y border-hairline bg-surface/20">
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
          <h2 className="text-section mt-2.5">Engineered like a product, not a quiz page</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-3">
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
          <h2 className="text-section mt-2.5 mb-6">Free to use, honestly explained</h2>
          <HomeFaq />
        </div>
      </section>

      {/* ---------------- Closing CTA ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="panel aurora grain spotlight relative overflow-hidden p-7 text-center sm:p-14">
          <h2 className="text-section text-balance">Everything here is free. Forever.</h2>
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
              className="btn-ghost inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold"
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
