import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Download,
  Fingerprint,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { TOOLS, searchTools } from "@/lib/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { NativeAdCard, withNativeAds } from "@/components/monetization/NativeAdCard";
import { useVip } from "@/lib/vip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Senses of Void — Seven Fast Tools for the Curious Mind" },
      {
        name: "description",
        content:
          "Trauma reflection, quick IQ, dark personality, vibe matching, AI roasts, prompt building and a free asset vault. No signup, instant results.",
      },
      { property: "og:title", content: "Senses of Void — Seven Fast Tools for the Curious Mind" },
      {
        property: "og:description",
        content:
          "Seven dark, fast tools plus a free Drive vault of UI kits, boilerplates and AI prompt packs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    title: "Built to be shared",
    body: "Certificates, radar reports and share cards are rendered client-side in full resolution — ready for stories and portfolios.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function Home() {
  const [query, setQuery] = useState("");
  const { openVipModal, isVip } = useVip();
  const results = useMemo(() => searchTools(query), [query]);
  const slots = useMemo(() => withNativeAds(results), [results]);

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="aurora grain relative overflow-hidden border-b border-hairline">
        <div className="void-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.08 }}
            variants={{ hidden: {}, show: {} }}
          >
            <motion.span
              variants={fadeUp}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="label-mono inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-3.5 py-1.5 backdrop-blur-xl"
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              seven tools · zero signup · instant results
            </motion.span>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="mt-7 font-display text-[2.7rem] leading-[1.02] font-bold tracking-tight text-balance sm:text-7xl"
            >
              Look into the void.
              <span className="text-gradient mt-1 block">It answers in data.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg"
            >
              A precision suite of reflection, cognition and creativity instruments that run entirely
              in your browser — plus a permanently free vault of design and developer assets.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="mt-9 flex flex-wrap justify-center gap-3"
            >
              <a
                href="#suite"
                className="btn-glow inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Explore the suite <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <Link
                to="/vault"
                className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-6 py-3 text-sm font-semibold backdrop-blur-xl transition-colors hover:bg-surface-2"
              >
                Browse the free vault
              </Link>
              {!isVip ? (
                <button
                  type="button"
                  onClick={openVipModal}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  or remove ads for $19 →
                </button>
              ) : null}
            </motion.div>

            <motion.dl
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {STATS.map(({ icon: Icon, k, v }) => (
                <div key={k} className="glass rounded-xl px-3 py-4">
                  <Icon className="mx-auto size-4 text-primary" aria-hidden="true" />
                  <dt className="mt-2 font-display text-base font-semibold">{k}</dt>
                  <dd className="label-mono mt-0.5">{v}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Tool suite ---------------- */}
      <section id="suite" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <span className="label-mono">The suite</span>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Seven instruments, each built for one job
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Every tool is code-split and loads on demand — nothing you don't open is ever
              downloaded.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
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
              placeholder="Filter the suite…"
              className="w-full rounded-full border border-hairline bg-surface/60 py-2.5 pr-4 pl-10 text-sm backdrop-blur-xl placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot, i) =>
            "ad" in slot ? (
              <NativeAdCard key={`ad-${i}`} index={slot.ad} />
            ) : (
              <ToolCard key={slot.item.slug} tool={slot.item} />
            ),
          )}
          {results.length === 0 ? (
            <p className="col-span-full py-14 text-center text-sm text-muted-foreground">
              Nothing matches "{query}".
            </p>
          ) : null}
        </div>
      </section>

      {/* ---------------- Pillars ---------------- */}
      <section className="border-y border-hairline bg-surface/25">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-xl">
            <span className="label-mono">Why it feels different</span>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Engineered like a product, not a quiz page
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
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
        </div>
      </section>

      {/* ---------------- Closing CTA ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="panel aurora grain relative overflow-hidden p-10 text-center sm:p-16">
          <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Go ad-free, forever, for $19
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            One payment removes every ad and export gate across all {TOOLS.length} tools and the
            vault. No subscription, no renewal, no account.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={openVipModal}
              className="btn-glow inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {isVip ? "VIP active" : "Unlock lifetime VIP"}{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <Link
              to="/tools/iq"
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-6 py-3 text-sm font-semibold backdrop-blur-xl transition-colors hover:bg-surface-2"
            >
              Try a tool first
            </Link>
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
