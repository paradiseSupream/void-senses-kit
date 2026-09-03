/**
 * Evergreen guide pages — the organic-search layer.
 *
 * Each guide answers one real long-tail question, links into the tool that
 * demonstrates it, and carries its own FAQ block. Content is written once and
 * lives here so a page is a data entry, not a new route file — that is what
 * makes the SEO surface scale without duplicating templates or shipping thin
 * generated pages.
 */

export type GuideFaq = { q: string; a: string };

export type Guide = {
  slug: string;
  title: string;
  /** <title> tag, kept under 60 characters. */
  metaTitle: string;
  description: string;
  /** Lead paragraph shown under the H1. */
  intro: string;
  sections: { heading: string; body: string[] }[];
  faqs: GuideFaq[];
  /** Tool slugs this guide funnels into. */
  tools: string[];
  updated: string;
};

export const GUIDES: Guide[] = [
  {
    slug: "what-is-a-good-iq-score",
    title: "What Is a Good IQ Score? Bands, Percentiles and What They Miss",
    metaTitle: "What Is a Good IQ Score? Bands Explained",
    description:
      "IQ scores explained without the mysticism: what 100 means, how percentile bands work, why test conditions matter, and what an online score can and cannot tell you.",
    intro:
      "IQ scores are standardised so the population average lands on 100, with about two thirds of people scoring between 85 and 115. Anything you read as a 'good' score is really a statement about where you sit on that curve — not a fixed property of your brain.",
    sections: [
      {
        heading: "How the bands actually work",
        body: [
          "Most modern scales use a mean of 100 and a standard deviation of 15. That puts roughly 68% of people between 85 and 115, about 95% between 70 and 130, and the remaining tails at the edges.",
          "A score of 120 is not '20% smarter' than 100. It means you scored higher than about 91% of the reference population on that specific set of tasks, under those specific conditions.",
        ],
      },
      {
        heading: "Why timing and test conditions move your number",
        body: [
          "Speeded tests reward pattern recognition under pressure. Sleep, caffeine, screen size and whether you were interrupted can shift a result by several points in either direction.",
          "That is why a single run is a snapshot. Taking the same style of test on three different days gives you a far more honest range than any one score.",
        ],
      },
      {
        heading: "What an online test can and cannot tell you",
        body: [
          "A free online test can show you which reasoning categories you handle fastest — number, logic, verbal, pattern or spatial — and how that profile changes when you are tired or rushed.",
          "It cannot substitute for a supervised clinical assessment, and no legitimate test will diagnose anything from twenty multiple-choice items.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is 120 a good IQ score?",
        a: "Yes — 120 sits roughly at the 91st percentile, meaning you scored above about nine in ten people on that test. It is comfortably above average but not rare.",
      },
      {
        q: "Do online IQ tests count?",
        a: "They are useful for comparing your own runs and seeing which reasoning styles you are fastest at. They are not clinically validated and should never be used for diagnosis or selection.",
      },
      {
        q: "Can you improve your IQ score?",
        a: "Practice reliably improves your score on a familiar test format, and sleep and focus change your performance day to day. Underlying general reasoning ability moves far more slowly.",
      },
    ],
    tools: ["iq", "logic", "memory"],
    updated: "2026-09-04",
  },
  {
    slug: "relationship-red-flags",
    title: "Relationship Red Flags: The Patterns Worth Taking Seriously",
    metaTitle: "Relationship Red Flags Worth Taking Seriously",
    description:
      "Control, jealousy, avoidance, volatility and dishonesty explained as behaviour patterns rather than labels — with the amber-stage versions that are still fixable.",
    intro:
      "Most red flags do not arrive fully formed. They start as small, defensible behaviours that become a pattern, which is exactly why they are easy to miss from inside a relationship — and easier to notice in yourself than in someone else.",
    sections: [
      {
        heading: "Control starts as helpfulness",
        body: [
          "Deciding the plan, managing the calendar and having opinions about who someone sees can all look like care. The tell is what happens when the other person makes a decision alone: relief, or friction.",
          "The amber version is fixable by asking before deciding. The red version punishes independence.",
        ],
      },
      {
        heading: "Jealousy is a story problem",
        body: [
          "Jealousy rarely runs on evidence. It runs on the story that fills a silence — an unread message, a laugh across a room. Checking a phone resolves the story for an hour and strengthens the habit for a year.",
          "Saying the fear out loud, plainly, deflates it faster than any amount of surveillance.",
        ],
      },
      {
        heading: "Avoidance and volatility are the same wound at different volumes",
        body: [
          "One person goes silent, the other goes loud. Both are ways of not having the conversation that would resolve the disagreement.",
          "A twenty-minute pause plus a written sentence about what actually hurt changes the outcome of most arguments more than any technique.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the difference between a red flag and a deal-breaker?",
        a: "A red flag is a pattern that predicts harm if it continues. A deal-breaker is your own line. Flags are about behaviour; deal-breakers are about what you will accept.",
      },
      {
        q: "Can red flags be fixed?",
        a: "Patterns driven by anxiety or habit often change when they are named and both people work on them. Behaviour that requires the other person to shrink usually does not.",
      },
      {
        q: "Am I the red flag?",
        a: "Everyone has one axis that spikes under stress. Knowing which one — control, jealousy, avoidance, volatility or honesty — is the difference between a pattern and a surprise.",
      },
    ],
    tools: ["red-flag", "love-match", "child-trauma"],
    updated: "2026-09-04",
  },
  {
    slug: "improve-short-term-memory",
    title: "How to Improve Short-Term Memory (What Actually Has Evidence)",
    metaTitle: "How to Improve Short-Term Memory: Evidence First",
    description:
      "Working memory span explained, why most people hold five to seven items, and the handful of habits — chunking, sleep, spacing — that genuinely move the number.",
    intro:
      "Short-term memory span is small and stubborn. Most adults hold about five to seven items at once, and no app makes that number dramatically larger. What does change is how efficiently you use the space you have.",
    sections: [
      {
        heading: "Chunking beats effort",
        body: [
          "Seven digits are seven items. Grouped into three chunks, they are three. Every reliable memory technique is a way of turning many items into few.",
          "Phone numbers, card numbers and passwords are all easier when you impose a rhythm on them rather than repeating them faster.",
        ],
      },
      {
        heading: "Sleep is the consolidation step",
        body: [
          "Material rehearsed before sleep is retained noticeably better than material rehearsed at the same interval while awake. Skipping sleep does not just tire you; it skips the step that files the day.",
        ],
      },
      {
        heading: "Spacing over cramming",
        body: [
          "Reviewing the same material across several days beats the same total minutes in one sitting, for almost every kind of content. The forgetting between sessions is the mechanism, not the failure.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a normal memory span?",
        a: "Around five to seven items for most adults. Nine or more in a visual sequence test is unusually strong.",
      },
      {
        q: "Do brain-training games work?",
        a: "They reliably make you better at the game. Transfer to unrelated everyday tasks is much weaker than the marketing suggests.",
      },
      {
        q: "Does caffeine help memory?",
        a: "It helps alertness, which helps encoding when you are tired. It does not increase the size of your span.",
      },
    ],
    tools: ["memory", "iq", "logic"],
    updated: "2026-09-04",
  },
  {
    slug: "free-ai-tools-worth-using",
    title: "Free AI Tools Worth Using (No Trial, No Card)",
    metaTitle: "Free AI Tools Worth Using — No Card Needed",
    description:
      "A short, honest list of genuinely free AI tools and open models, what each one is actually good at, and how to write prompts that get usable output first try.",
    intro:
      "Most 'free AI tools' lists are affiliate pages for seven-day trials. These are tools with a real free tier or an open licence, grouped by the job you are trying to finish.",
    sections: [
      {
        heading: "Writing and reasoning",
        body: [
          "Open-weight models now handle summarising, rewriting and structured extraction well enough for daily work. The limiting factor is almost always the prompt, not the model.",
          "Give the model the format you want back, one example, and the constraint that matters most. That single change fixes more bad output than switching models does.",
        ],
      },
      {
        heading: "Images and design",
        body: [
          "Free image models are strongest at texture, mood and background plates, and weakest at legible text. Generate the plate, set type yourself.",
        ],
      },
      {
        heading: "Where the Vault fits",
        body: [
          "The Free Drive Vault collects the open-licence and free-tier resources worth keeping — prompt packs, starters, datasets and design systems — each with its official source so you can verify the licence yourself.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are these tools really free?",
        a: "Every resource listed in the Vault is open source, public domain, Creative Commons or an official free tier. Nothing is pirated or paywalled content.",
      },
      {
        q: "What makes a good AI prompt?",
        a: "State the role, the output format, one example and the hard constraint. Vague prompts produce vague output regardless of which model runs them.",
      },
      {
        q: "Do I need an account?",
        a: "Not for the tools on this site. Some third-party resources in the Vault have their own free-tier signup, which is noted on the resource page.",
      },
    ],
    tools: ["prompt-maker", "roast"],
    updated: "2026-09-04",
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

export const GUIDE_PATHS = GUIDES.map((guide) => `/guides/${guide.slug}`);
