/**
 * Friend Knowledge Quiz — "how well do you actually know me?".
 *
 * Unlike every other tool on the site, there is no scoring model here: the
 * challenger's own answers become the answer key, and the friend is scored
 * against them. Questions are deliberately everyday and answerable by anyone,
 * so a stranger can still guess and a close friend clearly out-scores them.
 */

export type FqItem = {
  id: string;
  /** Asked to the challenger ("about you"). */
  self: string;
  /** Asked to the friend ("about them"). */
  friend: string;
  opts: [string, string, string, string];
  /** Knowledge area, used for the "where they knew you" breakdown. */
  area: FqArea;
};

export const FQ_AREAS = ["Habits", "Emotional", "Values", "Social"] as const;
export type FqArea = (typeof FQ_AREAS)[number];

/** What a strong or weak score in each area actually means. */
export const FQ_AREA_NOTES: Record<string, string> = {
  Habits: "The observable stuff: mornings, food, sleep, music. Anyone who spends real time around you gets these right.",
  Emotional: "How you argue, what scares you, how you take a compliment. This is the area only people who have seen you unguarded can answer.",
  Values: "Money, risk, travel, what you are working towards. Friends who talk with you rather than just hang out score here.",
  Social: "Your behaviour around other people — texts, plans, gifts, photos. Easy for a wide circle, hard for a distant one.",
};

export const FQ_SESSION_SIZE = 10;

export const FQ_BANK: FqItem[] = [
  {
    id: "fq-morning",
    area: "Habits",
    self: "How do you actually start a normal morning?",
    friend: "How do they actually start a normal morning?",
    opts: ["Phone in bed for ages", "Straight up, straight out", "Coffee before words", "Snooze, panic, sprint"],
  },
  {
    id: "fq-argue",
    area: "Emotional",
    self: "In an argument you tend to…",
    friend: "In an argument they tend to…",
    opts: ["Go quiet and think", "Say everything instantly", "Crack a joke", "Walk away and return later"],
  },
  {
    id: "fq-money",
    area: "Values",
    self: "You get an unexpected 200. First instinct?",
    friend: "They get an unexpected 200. First instinct?",
    opts: ["Save all of it", "Treat someone else", "Buy the thing on the list", "Spontaneous trip or night out"],
  },
  {
    id: "fq-friday",
    area: "Social",
    self: "Perfect Friday night for you is…",
    friend: "Perfect Friday night for them is…",
    opts: ["Home, screen, silence", "Small group, long talk", "Loud, crowded, late", "Something outdoors"],
  },
  {
    id: "fq-text",
    area: "Social",
    self: "Your reply speed to a non-urgent text?",
    friend: "Their reply speed to a non-urgent text?",
    opts: ["Instant, always", "Within an hour", "Same day, eventually", "Three days and an apology"],
  },
  {
    id: "fq-fear",
    area: "Emotional",
    self: "The thing that stresses you most:",
    friend: "The thing that stresses them most:",
    opts: ["Being late", "Letting people down", "Losing control of plans", "Being misunderstood"],
  },
  {
    id: "fq-food",
    area: "Habits",
    self: "Ordering at a new place, you…",
    friend: "Ordering at a new place, they…",
    opts: ["Take the safest option", "Ask the staff", "Pick the weirdest thing", "Copy whoever ordered first"],
  },
  {
    id: "fq-travel",
    area: "Values",
    self: "Your travel style is closest to…",
    friend: "Their travel style is closest to…",
    opts: ["Spreadsheet and timings", "Rough plan, loose days", "Book it tonight, figure it out", "Same place, every time"],
  },
  {
    id: "fq-compliment",
    area: "Emotional",
    self: "The compliment that lands hardest for you:",
    friend: "The compliment that lands hardest for them:",
    opts: ["“You're so smart”", "“You're so kind”", "“You're actually funny”", "“I trust you with this”"],
  },
  {
    id: "fq-rest",
    area: "Habits",
    self: "After a brutal week you recover by…",
    friend: "After a brutal week they recover by…",
    opts: ["Sleeping it off", "Seeing people", "Cleaning or organising", "Disappearing into a hobby"],
  },
  {
    id: "fq-music",
    area: "Habits",
    self: "What's usually playing when you're alone?",
    friend: "What's usually playing when they're alone?",
    opts: ["Same five songs", "A podcast", "Whatever the algorithm says", "Nothing — silence"],
  },
  {
    id: "fq-risk",
    area: "Values",
    self: "Offered a risky opportunity, you…",
    friend: "Offered a risky opportunity, they…",
    opts: ["Say yes immediately", "Research for days", "Ask a friend to decide", "Say no and regret it"],
  },
  {
    id: "fq-gift",
    area: "Social",
    self: "The gift you'd secretly love:",
    friend: "The gift they'd secretly love:",
    opts: ["Something handmade", "Something expensive", "An experience together", "Money, honestly"],
  },
  {
    id: "fq-photo",
    area: "Social",
    self: "In group photos you're the one…",
    friend: "In group photos they're the one…",
    opts: ["Taking the photo", "Front and centre", "Half behind someone", "Pulling a face"],
  },
  {
    id: "fq-late",
    area: "Habits",
    self: "At 2am you're most likely…",
    friend: "At 2am they're most likely…",
    opts: ["Asleep for hours", "Scrolling", "Working on something", "Still talking to someone"],
  },
  {
    id: "fq-conflict",
    area: "Emotional",
    self: "Someone cancels last minute. You feel…",
    friend: "Someone cancels last minute. They feel…",
    opts: ["Secretly relieved", "Genuinely fine", "Quietly hurt", "Annoyed and vocal"],
  },
  {
    id: "fq-goal",
    area: "Values",
    self: "What you actually want next year:",
    friend: "What they actually want next year:",
    opts: ["More money", "More calm", "More adventure", "More closeness"],
  },
  {
    id: "fq-truth",
    area: "Emotional",
    self: "Your honesty setting with people is…",
    friend: "Their honesty setting with people is…",
    opts: ["Brutally direct", "Honest but soft", "Diplomatic", "Whatever keeps peace"],
  },
];

export function fqItem(id: string): FqItem | undefined {
  return FQ_BANK.find((item) => item.id === id);
}

export type FqVerdict = { name: string; blurb: string; badge: string };

/** Verdict bands for the friend's score (percentage of matching answers). */
export function fqVerdict(pct: number, name: string): FqVerdict {
  const who = name ? name : "them";
  if (pct >= 90)
    return {
      name: "Mind Reader",
      badge: "Top tier",
      blurb: `You answered almost exactly the way ${who} did. Either years of history or genuinely unnerving attention.`,
    };
  if (pct >= 70)
    return {
      name: "Inner Circle",
      badge: "Close",
      blurb: `You know the real version of ${who}, not the public one. A couple of blind spots, nothing serious.`,
    };
  if (pct >= 50)
    return {
      name: "Good Guess",
      badge: "Solid",
      blurb: `You read the surface well. The habits you missed are the private ones ${who} rarely explains out loud.`,
    };
  if (pct >= 30)
    return {
      name: "Distant Signal",
      badge: "Patchy",
      blurb: `You're working from an old snapshot of ${who}. Worth a long conversation before the next round.`,
    };
  return {
    name: "Total Stranger",
    badge: "Ouch",
    blurb: `Statistically you'd have done better guessing at random. Somebody has some catching up to do with ${who}.`,
  };
}
