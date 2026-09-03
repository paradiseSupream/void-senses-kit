/**
 * Shareable result page — the landing surface of the viral loop.
 *
 * `/r/<token>` decodes a result the sharer encoded client-side (no stored
 * personal data), renders it with a per-result link preview and pushes the
 * visitor straight into the same test. Personal result URLs are `noindex`:
 * the indexable pages are the tool hubs they link to.
 */

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Swords, Trophy } from "lucide-react";

import { AdSlot } from "@/components/monetization/AdSlot";
import { NativeAdCard } from "@/components/monetization/NativeAdCard";
import { decodeCompare, type ComparePayload } from "@/lib/compare-link";
import { getTool } from "@/lib/tools";

const SITE = "https://sensesofvoid.app";

function loadResult(token: string): ComparePayload {
  const result = decodeCompare(token);
  if (!result) throw notFound();
  return result;
}

export const Route = createFileRoute("/r/$token")({
  loader: ({ params }) => ({ result: loadResult(params.token) }),
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Result unavailable — Senses of Void" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { result } = loaderData;
    const cover = getTool(result.t)?.cover;
    const title = `${result.h} on ${result.n} — can you beat it?`;
    const description = `A friend scored ${result.h} on the ${result.n}. Take the same free test — randomised questions, instant visual result, no signup.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Senses of Void" },
        { property: "og:url", content: `${SITE}/r/${params.token}` },
        { name: "twitter:card", content: "summary_large_image" },
        ...(cover && cover.startsWith("https")
          ? [
              { property: "og:image", content: cover },
              { name: "twitter:image", content: cover },
            ]
          : []),
      ],
    };
  },
  notFoundComponent: ResultMissing,
  component: SharedResult,
});

function ResultMissing() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="font-display text-3xl">That result link expired</h1>
      <p className="mt-3 text-muted-foreground">
        The link was incomplete, but every test is free — pick one and make your own.
      </p>
      <Link
        to="/tools"
        className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        Browse the tests <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function SharedResult() {
  const { result } = Route.useLoaderData();
  const tool = getTool(result.t);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <span className="label-mono inline-flex items-center gap-2">
        <Swords className="size-4" aria-hidden="true" /> Friend challenge
      </span>
      <h1 className="mt-3 font-display text-3xl sm:text-4xl">
        They scored {result.h} on the {result.n}
      </h1>

      <div className="glass mt-7 rounded-2xl p-6">
        <span className="label-mono">Their result</span>
        <p className="mt-2 font-display text-5xl">{result.h}</p>
        {result.l.length ? (
          <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            {result.l.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <Link
        to={result.p}
        search={{ auto: "1" } as never}
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        <Trophy className="size-4" aria-hidden="true" /> Beat this score
      </Link>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Free · {tool?.duration ?? "a few minutes"} · no signup
      </p>

      <AdSlot id={`result-share-${result.t}`} toolSlug={result.t} className="mt-9" />

      <Link
        to="/tools"
        className="mt-9 flex items-center justify-between rounded-xl border border-hairline p-4 text-sm"
      >
        <span>See all {tool ? "other" : ""} tests</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>

      <NativeAdCard index={0} toolSlug={result.t} className="mt-8" />
    </div>
  );
}
