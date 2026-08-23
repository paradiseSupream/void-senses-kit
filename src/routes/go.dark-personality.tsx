import { createFileRoute } from "@tanstack/react-router";

import { AdLanding } from "@/components/landing/AdLanding";
import { TOOLS } from "@/lib/tools";

const TOOL = TOOLS.find((t) => t.slug === "dark-personality")!;

export const Route = createFileRoute("/go/dark-personality")({
  head: () => ({
    meta: [
      { title: "Which Dark Archetype Are You? — Free 3-Minute Test" },
      {
        name: "description",
        content:
          "Answer eighteen randomised statements and meet the archetype hiding in your shadow. Free, no signup, HD share card at the end.",
      },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Which Dark Archetype Are You?" },
      {
        property: "og:description",
        content: "Eighteen questions, six shadow traits, one honest verdict. Free and instant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdLanding
      tool={TOOL}
      headline="Which dark archetype is hiding in your shadow?"
      sub="Eighteen randomised statements weigh strategy, detachment, ambition, control, charm and defiance — then name the archetype that runs you. Free, instant, nothing saved."
      cta="Reveal my archetype — free"
      reasons={[
        "Six shadow traits scored on a visual radar, not a vague label",
        "A fresh randomised question set every attempt, so you cannot game it",
        "An HD share card you can download and post straight away",
      ]}
    />
  ),
});
