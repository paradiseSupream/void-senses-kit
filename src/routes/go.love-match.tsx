import { createFileRoute } from "@tanstack/react-router";

import { AdLanding } from "@/components/landing/AdLanding";
import { TOOLS } from "@/lib/tools";

const TOOL = TOOLS.find((t) => t.slug === "love-match")!;

export const Route = createFileRoute("/go/love-match")({
  head: () => ({
    meta: [
      { title: "Love & Vibe Matcher — Free 2-Minute Compatibility Read" },
      {
        name: "description",
        content:
          "Fifteen randomised questions score banter, trust, adventure, calm and spark into an honest chemistry verdict. Free, no signup, story-ready card.",
      },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "How real is your chemistry?" },
      {
        property: "og:description",
        content: "Fifteen questions, five vibe dimensions, one verdict card built for stories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdLanding
      tool={TOOL}
      headline="How real is the chemistry between you two?"
      sub="Fifteen randomised questions score banter, trust, adventure, calm and spark, then hand you an honest verdict card. Free, instant, nothing saved."
      cta="Check our vibe — free"
      reasons={[
        "Five chemistry dimensions broken down on a radar, not one flat percentage",
        "Takes about two minutes and works on any phone, no signup",
        "A story-ready share card sized for Instagram and TikTok",
      ]}
    />
  ),
});
