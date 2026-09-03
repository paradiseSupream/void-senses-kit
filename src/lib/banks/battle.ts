/**
 * Compatibility Battle — two real people, one shared link.
 *
 * Distinct from Love & Vibe Matcher (single-player self-report): here both
 * sides answer the same twelve scenario questions independently and the match
 * is computed from actual agreement per axis, plus the specific questions
 * where the two of you clash.
 */

export type BattleAxis = "Rhythm" | "Values" | "Conflict" | "Play";

export type BattleItem = {
  id: string;
  axis: BattleAxis;
  q: string;
  opts: [string, string, string, string];
};

export const BATTLE_AXES: BattleAxis[] = ["Rhythm", "Values", "Conflict", "Play"];
export const BATTLE_PER_AXIS = 3;
export const BATTLE_SESSION_SIZE = BATTLE_AXES.length * BATTLE_PER_AXIS;

export const BATTLE_BANK: BattleItem[] = [
  // Rhythm — pace of life and energy.
  { id: "bt-plan", axis: "Rhythm", q: "A free Saturday appears. What happens?", opts: ["Plan it the night before", "Decide over breakfast", "Improvise entirely", "Do nothing on purpose"] },
  { id: "bt-speed", axis: "Rhythm", q: "Your natural pace is…", opts: ["Early and ahead", "Steady and on time", "Late but calm", "Chaotic sprints"] },
  { id: "bt-social", axis: "Rhythm", q: "Ideal amount of people around you:", opts: ["Just us", "Two or three others", "A full table", "The bigger the better"] },
  { id: "bt-recharge", axis: "Rhythm", q: "After a heavy week you need…", opts: ["Total quiet", "One good conversation", "A night out", "A change of scenery"] },
  // Values — what actually matters.
  { id: "bt-money", axis: "Values", q: "Money is mostly for…", opts: ["Security", "Experiences", "Freedom to quit", "Looking after people"] },
  { id: "bt-honesty", axis: "Values", q: "Someone asks for your opinion on something bad:", opts: ["Say it straight", "Say it gently", "Focus on the good parts", "Avoid answering"] },
  { id: "bt-future", axis: "Values", q: "Five years from now matters most:", opts: ["Stability", "Growth", "Adventure", "Belonging"] },
  { id: "bt-loyalty", axis: "Values", q: "A friend is clearly in the wrong. You…", opts: ["Tell them privately", "Back them publicly anyway", "Stay out of it", "Call it out on the spot"] },
  // Conflict — how friction is handled.
  { id: "bt-fight", axis: "Conflict", q: "Mid-argument, your default is…", opts: ["Talk it out now", "Cool off first", "Go silent", "Escalate then apologise"] },
  { id: "bt-apology", axis: "Conflict", q: "An apology should be…", opts: ["Immediate words", "Changed behaviour", "A small gesture", "Never needed twice"] },
  { id: "bt-bother", axis: "Conflict", q: "Something small annoys you. You…", opts: ["Mention it right away", "Wait to see if it repeats", "Hint at it", "Say nothing, ever"] },
  { id: "bt-space", axis: "Conflict", q: "After a fight you want…", opts: ["Closeness immediately", "A few hours alone", "A whole day off", "To pretend it never happened"] },
  // Play — humour and fun.
  { id: "bt-humour", axis: "Play", q: "Your humour is closest to…", opts: ["Dry and deadpan", "Loud and silly", "Dark", "Warm and teasing"] },
  { id: "bt-date", axis: "Play", q: "Best low-effort plan together:", opts: ["Food and a walk", "Screen and snacks", "Something competitive", "Somewhere new"] },
  { id: "bt-risk", axis: "Play", q: "Offered something slightly reckless:", opts: ["Yes, obviously", "Yes if you're in", "Probably not", "Absolutely not"] },
  { id: "bt-tease", axis: "Play", q: "Being teased in front of others feels…", opts: ["Great, keep going", "Fine from you only", "Depends on the joke", "Not fun at all"] },
];

export function battleItem(id: string): BattleItem | undefined {
  return BATTLE_BANK.find((item) => item.id === id);
}

export type BattleVerdict = { name: string; blurb: string };

export function battleVerdict(pct: number): BattleVerdict {
  if (pct >= 85)
    return {
      name: "Same Wiring",
      blurb: "You answered like one person using two devices. The risk here isn't friction — it's that nobody challenges anybody.",
    };
  if (pct >= 65)
    return {
      name: "Strong Signal",
      blurb: "High agreement with just enough difference to stay interesting. Your clashes are about method, not values.",
    };
  if (pct >= 45)
    return {
      name: "Complementary",
      blurb: "You meet in the middle more often than you match. That works while both of you keep explaining yourselves.",
    };
  if (pct >= 25)
    return {
      name: "Opposite Currents",
      blurb: "Different rhythms and different instincts. Great for perspective, expensive when nobody translates.",
    };
  return {
    name: "Total Contrast",
    blurb: "Almost nothing lines up. That can be electric or exhausting — usually both, in that order.",
  };
}
