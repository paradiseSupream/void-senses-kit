/**
 * "This or That" — forced-choice dilemmas.
 *
 * Every item pushes the visitor to pick one of two options; each option loads
 * one pole of an axis. Forced choice removes the middle-of-the-scale hedging
 * that Likert items allow, which is exactly what makes the result feel sharp
 * enough to screenshot.
 */

export const TOT_AXES = ["Impulse", "Loyalty", "Risk", "Candour"] as const;
export type TotAxis = (typeof TOT_AXES)[number];

export type TotItem = {
  id: string;
  axis: TotAxis;
  /** Option A scores the axis; option B scores its opposite. */
  a: string;
  b: string;
};

export const TOT_BANK: TotItem[] = [
  // Impulse — act now vs plan first
  { id: "i1", axis: "Impulse", a: "Book the trip tonight", b: "Build the spreadsheet first" },
  { id: "i2", axis: "Impulse", a: "Reply while you're angry", b: "Sleep on it" },
  { id: "i3", axis: "Impulse", a: "Say yes, figure it out later", b: "Ask for the details" },
  { id: "i4", axis: "Impulse", a: "Order something new", b: "Order the usual" },
  { id: "i5", axis: "Impulse", a: "Quit loudly", b: "Leave quietly with a plan" },
  { id: "i6", axis: "Impulse", a: "Start today, badly", b: "Start Monday, properly" },
  { id: "i7", axis: "Impulse", a: "Move city on a feeling", b: "Move for a signed offer" },
  { id: "i8", axis: "Impulse", a: "Buy the ticket now", b: "Wait for the price to drop" },
  { id: "i9", axis: "Impulse", a: "Say the idea before it's ready", b: "Polish it in private" },
  { id: "i10", axis: "Impulse", a: "Change the plan mid-way", b: "Finish what was agreed" },

  // Loyalty — people first vs outcome first
  { id: "l1", axis: "Loyalty", a: "Cover for a friend", b: "Tell the truth" },
  { id: "l2", axis: "Loyalty", a: "Stay on a sinking team", b: "Take the better offer" },
  { id: "l3", axis: "Loyalty", a: "Old friends", b: "New rooms" },
  { id: "l4", axis: "Loyalty", a: "Split the bill evenly", b: "Pay for exactly what you ate" },
  { id: "l5", axis: "Loyalty", a: "Keep their secret", b: "Protect the group" },
  { id: "l6", axis: "Loyalty", a: "Answer the 2am call", b: "Answer in the morning" },
  { id: "l7", axis: "Loyalty", a: "Give the credit away", b: "Take the credit you earned" },
  { id: "l8", axis: "Loyalty", a: "Forgive once more", b: "Close the door" },
  { id: "l9", axis: "Loyalty", a: "Defend them in public", b: "Correct them in public" },
  { id: "l10", axis: "Loyalty", a: "Stay for the people", b: "Leave for the work" },

  // Risk — exposure vs safety
  { id: "r1", axis: "Risk", a: "All of it on one bet", b: "Small, boring, certain" },
  { id: "r2", axis: "Risk", a: "Public failure", b: "Private stagnation" },
  { id: "r3", axis: "Risk", a: "Freelance", b: "Salary" },
  { id: "r4", axis: "Risk", a: "Speak first in the room", b: "Read the room first" },
  { id: "r5", axis: "Risk", a: "Unknown road", b: "Known shortcut" },
  { id: "r6", axis: "Risk", a: "Ask and be rejected", b: "Never know" },
  { id: "r7", axis: "Risk", a: "Post it unedited", b: "Draft it for a week" },
  { id: "r8", axis: "Risk", a: "Ten percent chance, huge", b: "Ninety percent chance, small" },
  { id: "r9", axis: "Risk", a: "Say yes to the stage", b: "Say yes to the back row" },
  { id: "r10", axis: "Risk", a: "Double down", b: "Cut the loss" },

  // Candour — say it vs hold it
  { id: "c1", axis: "Candour", a: "Blunt honesty", b: "Kind vagueness" },
  { id: "c2", axis: "Candour", a: "Tell them the food is bad", b: "Eat it and smile" },
  { id: "c3", axis: "Candour", a: "Name the problem in the meeting", b: "Message them after" },
  { id: "c4", axis: "Candour", a: "Read your own reviews", b: "Never look" },
  { id: "c5", axis: "Candour", a: "Say you don't know", b: "Sound certain" },
  { id: "c6", axis: "Candour", a: "Ask what they really meant", b: "Let it slide" },
  { id: "c7", axis: "Candour", a: "Show the messy draft", b: "Show the finished thing" },
  { id: "c8", axis: "Candour", a: "Admit you were wrong out loud", b: "Quietly change course" },
  { id: "c9", axis: "Candour", a: "Give the real reason", b: "Give the easy reason" },
  { id: "c10", axis: "Candour", a: "Ask for the number", b: "Avoid the awkward question" },
];

export const TOT_PER_AXIS = 6;
export const TOT_SESSION_SIZE = TOT_PER_AXIS * TOT_AXES.length;

/** Short profile name from the two dominant poles. */
export function totProfile(scores: { dim: string; value: number }[]): {
  name: string;
  blurb: string;
} {
  const sorted = [...scores].sort((x, y) => y.value - x.value);
  const top = sorted[0]?.dim ?? "Impulse";
  const low = sorted[sorted.length - 1]?.dim ?? "Risk";

  const names: Record<string, string> = {
    Impulse: "The Spark",
    Loyalty: "The Anchor",
    Risk: "The Gambler",
    Candour: "The Blade",
  };
  const blurbs: Record<string, string> = {
    Impulse: "You decide at speed and repair on the move. It costs you tidy plans and buys you momentum.",
    Loyalty: "People outrank outcomes for you. You keep rooms together, sometimes past the point they deserve it.",
    Risk: "You price upside higher than comfort, and you'd rather fail in public than stall in private.",
    Candour: "You say the thing. It makes you trusted and, occasionally, expensive to be around.",
  };

  return {
    name: names[top] ?? "The Spark",
    blurb: `${blurbs[top] ?? ""} Your quietest side is ${low.toLowerCase()} — that's where you hedge.`,
  };
}

/** Written interpretation per axis and band. Axis value = share of "This" picks. */
export const TOT_NOTES: Record<string, { High: string; Moderate: string; Low: string }> = {
  Impulse: {
    High: "You commit before the information is complete, so you learn faster than most and pay for it occasionally.",
    Moderate: "You move quickly on small things and slowly on expensive ones, which is the cheapest way to be wrong.",
    Low: "You wait for evidence. You rarely regret a decision, but you sometimes miss the window entirely.",
  },
  Loyalty: {
    High: "You stay. People count on that, and the cost is the room you keep for relationships that stopped giving anything back.",
    Moderate: "You are loyal until it becomes unreasonable, and you can usually name the line.",
    Low: "You optimise for what works now. Clean, efficient, and occasionally read as cold by people who expected more.",
  },
  Risk: {
    High: "Exposure doesn't scare you; stagnation does. You collect outsized outcomes at the price of a louder failure rate.",
    Moderate: "You take the risk once the downside is survivable — the profile most long-term winners actually have.",
    Low: "You protect the base first. Slow compounding beats a blow-up, and you have never had a blow-up.",
  },
  Candour: {
    High: "You say the real thing. It builds unusual trust and costs you a few rooms along the way.",
    Moderate: "You tell the truth in the right dose to the right person.",
    Low: "You choose comfort over precision, which keeps the peace and leaves people guessing what you actually think.",
  },
};
