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

  // Loyalty — people first vs outcome first
  { id: "l1", axis: "Loyalty", a: "Cover for a friend", b: "Tell the truth" },
  { id: "l2", axis: "Loyalty", a: "Stay on a sinking team", b: "Take the better offer" },
  { id: "l3", axis: "Loyalty", a: "Old friends", b: "New rooms" },
  { id: "l4", axis: "Loyalty", a: "Split the bill evenly", b: "Pay for exactly what you ate" },
  { id: "l5", axis: "Loyalty", a: "Keep their secret", b: "Protect the group" },
  { id: "l6", axis: "Loyalty", a: "Answer the 2am call", b: "Answer in the morning" },
  { id: "l7", axis: "Loyalty", a: "Give the credit away", b: "Take the credit you earned" },
  { id: "l8", axis: "Loyalty", a: "Forgive once more", b: "Close the door" },

  // Risk — exposure vs safety
  { id: "r1", axis: "Risk", a: "All of it on one bet", b: "Small, boring, certain" },
  { id: "r2", axis: "Risk", a: "Public failure", b: "Private stagnation" },
  { id: "r3", axis: "Risk", a: "Freelance", b: "Salary" },
  { id: "r4", axis: "Risk", a: "Speak first in the room", b: "Read the room first" },
  { id: "r5", axis: "Risk", a: "Unknown road", b: "Known shortcut" },
  { id: "r6", axis: "Risk", a: "Ask and be rejected", b: "Never know" },
  { id: "r7", axis: "Risk", a: "Post it unedited", b: "Draft it for a week" },
  { id: "r8", axis: "Risk", a: "Ten percent chance, huge", b: "Ninety percent chance, small" },

  // Candour — say it vs hold it
  { id: "c1", axis: "Candour", a: "Blunt honesty", b: "Kind vagueness" },
  { id: "c2", axis: "Candour", a: "Tell them the food is bad", b: "Eat it and smile" },
  { id: "c3", axis: "Candour", a: "Name the problem in the meeting", b: "Message them after" },
  { id: "c4", axis: "Candour", a: "Read your own reviews", b: "Never look" },
  { id: "c5", axis: "Candour", a: "Say you don't know", b: "Sound certain" },
  { id: "c6", axis: "Candour", a: "Ask what they really meant", b: "Let it slide" },
  { id: "c7", axis: "Candour", a: "Show the messy draft", b: "Show the finished thing" },
  { id: "c8", axis: "Candour", a: "Admit you were wrong out loud", b: "Quietly change course" },
];

export const TOT_PER_AXIS = 5;
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
