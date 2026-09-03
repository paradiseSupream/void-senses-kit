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
};

export const FQ_SESSION_SIZE = 10;

export const FQ_BANK: FqItem[] = [
  {
    id: "fq-morning",
    self: "How do you actually start a normal morning?",
    friend: "How do they actually start a normal morning?",
    opts: ["Phone in bed for ages", "Straight up, straight out", "Coffee before words", "Snooze, panic, sprint"],
  },
  {
    id: "fq-argue",
    self: "In an argument you tend to…",
    friend: "In an argument they tend to…",
    opts: ["Go quiet and think", "Say everything instantly", "Crack a joke", "Walk away and return later"],
  },
  {
    id: "fq-money",
    self: "You get an unexpected 200. First instinct?",
    friend: "They get an unexpected 200. First instinct?",
    opts: ["Save all of it", "Treat someone else", "Buy the thing on the list", "Spontaneous trip or night out"],
  },
  {
    id: "fq-friday",
    self: "Perfect Friday night for you is…",
    friend: "Perfect Friday night for them is…",
    opts: ["Home, screen, silence", "Small group, long talk", "Loud, crowded, late", "Something outdoors"],
  },
  {
    id: "fq-text",
    self: "Your reply speed to a non-urgent text?",
    friend: "Their reply speed to a non-urgent text?",
    opts: ["Instant, always", "Within an hour", "Same day, eventually", "Three days and an apology"],
  },
  {
    id: "fq-fear",
    self: "The thing that stresses you most:",
    friend: "The thing that stresses them most:",
    opts: ["Being late", "Letting people down", "Losing control of plans", "Being misunderstood"],
  },
  {
    id: "fq-food",
    self: "Ordering at a new place, you…",
    friend: "Ordering at a new place, they…",
    opts: ["Take the safest option", "Ask the staff", "Pick the weirdest thing", "Copy whoever ordered first"],
  },
  {
    id: "fq-travel",
    self: "Your travel style is closest to…",
    friend: "Their travel style is closest to…",
    opts: ["Spreadsheet and timings", "Rough plan, loose days", "Book it tonight, figure it out", "Same place, every time"],
  },
  {
    id: "fq-compliment",
    self: "The compliment that lands hardest for you:",
    friend: "The compliment that lands hardest for them:",
    opts: ["“You're so smart”", "“You're so kind”", "“You're actually funny”", "“I trust you with this”"],
  },
  {
    id: "fq-rest",
    self: "After a brutal week you recover by…",
    friend: "After a brutal week they recover by…",
    opts: ["Sleeping it off", "Seeing people", "Cleaning or organising", "Disappearing into a hobby"],
  },
  {
    id: "fq-music",
    self: "What's usually playing when you're alone?",
    friend: "What's usually playing when they're alone?",
    opts: ["Same five songs", "A podcast", "Whatever the algorithm says", "Nothing — silence"],
  },
  {
    id: "fq-risk",
    self: "Offered a risky opportunity, you…",
    friend: "Offered a risky opportunity, they…",
    opts: ["Say yes immediately", "Research for days", "Ask a friend to decide", "Say no and regret it"],
  },
  {
    id: "fq-gift",
    self: "The gift you'd secretly love:",
    friend: "The gift they'd secretly love:",
    opts: ["Something handmade", "Something expensive", "An experience together", "Money, honestly"],
  },
  {
    id: "fq-photo",
    self: "In group photos you're the one…",
    friend: "In group photos they're the one…",
    opts: ["Taking the photo", "Front and centre", "Half behind someone", "Pulling a face"],
  },
  {
    id: "fq-late",
    self: "At 2am you're most likely…",
    friend: "At 2am they're most likely…",
    opts: ["Asleep for hours", "Scrolling", "Working on something", "Still talking to someone"],
  },
  {
    id: "fq-conflict",
    self: "Someone cancels last minute. You feel…",
    friend: "Someone cancels last minute. They feel…",
    opts: ["Secretly relieved", "Genuinely fine", "Quietly hurt", "Annoyed and vocal"],
  },
  {
    id: "fq-goal",
    self: "What you actually want next year:",
    friend: "What they actually want next year:",
    opts: ["More money", "More calm", "More adventure", "More closeness"],
  },
  {
    id: "fq-truth",
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
