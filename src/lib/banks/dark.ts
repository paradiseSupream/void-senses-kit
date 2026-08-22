import type { Likert } from "@/lib/quiz-engine";

/**
 * Shadow-trait bank — 48 statements across six traits.
 * A session draws 3 per trait (18 items). Higher = trait is more expressed.
 */
export const DARK_DIMS = [
  "Strategy",
  "Detachment",
  "Ambition",
  "Control",
  "Charm",
  "Defiance",
] as const;

export const DARK_BANK: Likert[] = [
  // Strategy
  { id: "st1", dim: "Strategy", text: "I read the room for leverage before I speak." },
  { id: "st2", dim: "Strategy", text: "Plans matter more to me than moods." },
  { id: "st3", dim: "Strategy", text: "I know what most people in my life want from me." },
  { id: "st4", dim: "Strategy", text: "I say things now because of where they lead later." },
  { id: "st5", dim: "Strategy", text: "I prefer to improvise rather than prepare.", reverse: true },
  { id: "st6", dim: "Strategy", text: "I keep a mental map of who owes whom a favour." },
  { id: "st7", dim: "Strategy", text: "I let information out at the moment it is worth the most." },
  { id: "st8", dim: "Strategy", text: "I rarely think more than one step ahead.", reverse: true },

  // Detachment
  { id: "dt1", dim: "Detachment", text: "I can watch drama unfold without being pulled in." },
  { id: "dt2", dim: "Detachment", text: "I keep parts of myself deliberately unreadable." },
  { id: "dt3", dim: "Detachment", text: "Other people's panic barely moves my pulse." },
  { id: "dt4", dim: "Detachment", text: "I wear my feelings openly.", reverse: true },
  { id: "dt5", dim: "Detachment", text: "I can end something cleanly once it stops making sense." },
  { id: "dt6", dim: "Detachment", text: "Guilt rarely changes a decision I have already made." },
  { id: "dt7", dim: "Detachment", text: "I need people around me to feel steady.", reverse: true },
  { id: "dt8", dim: "Detachment", text: "I observe my own emotions as if from slightly outside them." },

  // Ambition
  { id: "am1", dim: "Ambition", text: "Being the most capable person present matters to me." },
  { id: "am2", dim: "Ambition", text: "I would trade comfort now for status later." },
  { id: "am3", dim: "Ambition", text: "Losing to someone I respect still stings for days." },
  { id: "am4", dim: "Ambition", text: "I measure a year by what I built in it." },
  { id: "am5", dim: "Ambition", text: "I am content staying exactly where I am.", reverse: true },
  { id: "am6", dim: "Ambition", text: "I quietly rank myself against the people in the room." },
  { id: "am7", dim: "Ambition", text: "Recognition motivates me more than I admit out loud." },
  { id: "am8", dim: "Ambition", text: "Slowing down feels like falling behind." },

  // Control
  { id: "co1", dim: "Control", text: "I dislike outcomes that depend on other people." },
  { id: "co2", dim: "Control", text: "I quietly steer group decisions toward my preference." },
  { id: "co3", dim: "Control", text: "I would rather do it myself than explain it twice." },
  { id: "co4", dim: "Control", text: "Surprises annoy me even when they are good ones." },
  { id: "co5", dim: "Control", text: "I am comfortable handing over the wheel.", reverse: true },
  { id: "co6", dim: "Control", text: "I prepare a second version of the plan without telling anyone." },
  { id: "co7", dim: "Control", text: "I decide how much of the story other people get." },
  { id: "co8", dim: "Control", text: "I let things unfold without steering them.", reverse: true },

  // Charm
  { id: "ch1", dim: "Charm", text: "I can make almost anyone comfortable within a minute." },
  { id: "ch2", dim: "Charm", text: "I adjust my tone depending on who is listening." },
  { id: "ch3", dim: "Charm", text: "People tell me things they meant to keep private." },
  { id: "ch4", dim: "Charm", text: "I know exactly which compliment will land." },
  { id: "ch5", dim: "Charm", text: "I struggle to talk my way out of trouble.", reverse: true },
  { id: "ch6", dim: "Charm", text: "First impressions of me are usually better than accurate." },
  { id: "ch7", dim: "Charm", text: "I use humour to move a conversation where I want it." },
  { id: "ch8", dim: "Charm", text: "I come across the same way with everyone.", reverse: true },

  // Defiance
  { id: "df1", dim: "Defiance", text: "Rules I did not agree to feel optional." },
  { id: "df2", dim: "Defiance", text: "Being told what to do makes me want the opposite." },
  { id: "df3", dim: "Defiance", text: "I have burned a bridge on purpose and slept fine." },
  { id: "df4", dim: "Defiance", text: "I follow instructions without questioning them.", reverse: true },
  { id: "df5", dim: "Defiance", text: "I enjoy proving a confident person wrong." },
  { id: "df6", dim: "Defiance", text: "I would rather be respected than liked." },
  { id: "df7", dim: "Defiance", text: "Fitting in matters more to me than standing out.", reverse: true },
  { id: "df8", dim: "Defiance", text: "I have walked away from something good to keep my autonomy." },
];

export const DARK_PER_DIM = 3;
export const DARK_SESSION_SIZE = DARK_PER_DIM * DARK_DIMS.length;

export const DARK_NOTES: Record<string, string> = {
  Strategy: "You treat social life as a system with inputs and outputs — patient, calculating, rarely surprised.",
  Detachment: "You move through rooms without leaving fingerprints. Emotion is information to you, not weather.",
  Ambition: "You build toward a version of yourself that does not exist yet, and spend comfort freely on altitude.",
  Control: "You would rather steer invisibly than lead loudly. Predictability is your form of safety.",
  Charm: "You can change the temperature of a room on purpose, and you know precisely when you are doing it.",
  Defiance: "Authority reads as a suggestion. You would rather own the consequence than inherit the instruction.",
};

export const DARK_ARCHETYPES: Record<string, { name: string; blurb: string; edge: string }> = {
  Strategy: {
    name: "The Mastermind",
    blurb: "Three moves ahead, visibly relaxed, quietly counting. You win arguments that started weeks ago.",
    edge: "Your risk is treating people as variables long after they became friends.",
  },
  Detachment: {
    name: "The Phantom",
    blurb: "You are remembered as an impression rather than a set of details. Nothing sticks to you.",
    edge: "Your risk is mistaking distance for peace.",
  },
  Ambition: {
    name: "The Architect",
    blurb: "You are always building the next version of yourself, and the current one is scaffolding.",
    edge: "Your risk is arriving somewhere excellent and refusing to notice.",
  },
  Control: {
    name: "The Ghost",
    blurb: "You steer without touching the wheel in public. Chaos is something you quietly pre-empt.",
    edge: "Your risk is exhaustion disguised as competence.",
  },
  Charm: {
    name: "The Siren",
    blurb: "You calibrate to whoever is in front of you, and they leave feeling unusually understood.",
    edge: "Your risk is being fluent with everyone and known by no one.",
  },
  Defiance: {
    name: "The Outlaw",
    blurb: "You would rather pay the price of your own decision than accept a free one from someone else.",
    edge: "Your risk is resisting the good instruction along with the bad one.",
  },
};
