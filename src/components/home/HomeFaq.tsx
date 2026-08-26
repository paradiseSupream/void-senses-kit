import { ChevronDown } from "lucide-react";

const FAQ = [
  {
    q: "Is Senses of Void really free?",
    a: "Yes. Every test, every result and the whole asset vault are free to use with no signup. The site is paid for by ads. Lifetime VIP ($19, one payment) simply removes the ads and export gates — it never unlocks extra tests.",
  },
  {
    q: "Do I get the same questions every time?",
    a: "No. Each test pulls a fresh, randomised set from a large question bank and shuffles the answer order too, so a screenshot from someone else is useless and every retake feels new.",
  },
  {
    q: "How accurate are the results?",
    a: "Answers are scored on-device across multiple weighted dimensions and normalised into bands with written interpretations. It is built for self-reflection and entertainment, not clinical diagnosis.",
  },
  {
    q: "Where do my answers go?",
    a: "Nowhere. Scoring happens entirely in your browser. Only the AI Roast tool sends text to a server, and nothing is stored.",
  },
  {
    q: "Can I share my result?",
    a: "Every test ends with an HD share card and certificate you can download or share in one tap — sized for stories, feeds and portfolios.",
  },
];

export function HomeFaq() {
  return (
    <div className="grid gap-2.5">
      {FAQ.map((item) => (
        <details key={item.q} className="bento group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <span className="font-display text-lg">{item.q}</span>
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
