import type { Likert } from "@/lib/quiz-engine";

/**
 * Six-axis shadow psychometric bank — 48 statements, 8 per axis.
 * A session draws 3 per axis (18 items). Higher = the axis is more expressed.
 *
 * Axes:
 *  1. Machiavellianism   — strategic calculation & manipulation
 *  2. Narcissism         — ego & grandiosity
 *  3. Psychopathy        — cold empathy & risk tolerance
 *  4. Detachment         — vulnerability shield
 *  5. Cognition          — cognitive dominance / intellectual control
 *  6. Shadow             — integration & awareness of dark instincts
 */
export const DARK_DIMS = [
  "Machiavellianism",
  "Narcissism",
  "Psychopathy",
  "Detachment",
  "Cognition",
  "Shadow",
] as const;

export type DarkDim = (typeof DARK_DIMS)[number];

export const DARK_BANK: Likert[] = [
  // Machiavellianism — strategic calculation & manipulation
  { id: "mc1", dim: "Machiavellianism", text: "I read the room for leverage before I speak." },
  { id: "mc2", dim: "Machiavellianism", text: "I say things now because of where they lead later." },
  { id: "mc3", dim: "Machiavellianism", text: "I keep a mental map of who owes whom a favour." },
  { id: "mc4", dim: "Machiavellianism", text: "I release information at the moment it is worth the most." },
  { id: "mc5", dim: "Machiavellianism", text: "I prefer to improvise rather than plan people.", reverse: true },
  { id: "mc6", dim: "Machiavellianism", text: "I know what most people in my life want from me." },
  { id: "mc7", dim: "Machiavellianism", text: "I quietly steer group decisions toward my preference." },
  { id: "mc8", dim: "Machiavellianism", text: "It feels wrong to shape how someone sees a situation.", reverse: true },

  // Narcissism — ego & grandiosity
  { id: "nr1", dim: "Narcissism", text: "Being the most capable person present matters to me." },
  { id: "nr2", dim: "Narcissism", text: "I quietly rank myself against the people in the room." },
  { id: "nr3", dim: "Narcissism", text: "Recognition motivates me more than I admit out loud." },
  { id: "nr4", dim: "Narcissism", text: "I believe I am built for something larger than my current life." },
  { id: "nr5", dim: "Narcissism", text: "I am comfortable being ordinary.", reverse: true },
  { id: "nr6", dim: "Narcissism", text: "Losing to someone I respect still stings for days." },
  { id: "nr7", dim: "Narcissism", text: "Being underestimated is the insult I forget the slowest." },
  { id: "nr8", dim: "Narcissism", text: "I rarely think about how I am perceived.", reverse: true },

  // Psychopathy — cold empathy & risk tolerance
  { id: "ps1", dim: "Psychopathy", text: "Other people's panic barely moves my pulse." },
  { id: "ps2", dim: "Psychopathy", text: "Guilt rarely changes a decision I have already made." },
  { id: "ps3", dim: "Psychopathy", text: "I have burned a bridge on purpose and slept fine." },
  { id: "ps4", dim: "Psychopathy", text: "Risk sharpens me instead of scaring me." },
  { id: "ps5", dim: "Psychopathy", text: "Someone else's tears change my plans immediately.", reverse: true },
  { id: "ps6", dim: "Psychopathy", text: "I can end something cleanly the moment it stops making sense." },
  { id: "ps7", dim: "Psychopathy", text: "Rules I did not agree to feel optional." },
  { id: "ps8", dim: "Psychopathy", text: "I need to feel safe before I act.", reverse: true },

  // Detachment — vulnerability shield
  { id: "dt1", dim: "Detachment", text: "I keep parts of myself deliberately unreadable." },
  { id: "dt2", dim: "Detachment", text: "I can watch drama unfold without being pulled in." },
  { id: "dt3", dim: "Detachment", text: "I decide how much of the story other people get." },
  { id: "dt4", dim: "Detachment", text: "I wear my feelings openly.", reverse: true },
  { id: "dt5", dim: "Detachment", text: "I withdraw before I explain when something hurts." },
  { id: "dt6", dim: "Detachment", text: "I need people around me to feel steady.", reverse: true },
  { id: "dt7", dim: "Detachment", text: "I would rather be respected than known." },
  { id: "dt8", dim: "Detachment", text: "Being needed feels heavier than being alone." },

  // Cognition — intellectual control
  { id: "cg1", dim: "Cognition", text: "I win arguments by reframing the question." },
  { id: "cg2", dim: "Cognition", text: "I dislike outcomes that depend on other people's thinking." },
  { id: "cg3", dim: "Cognition", text: "I prepare a second version of the plan without telling anyone." },
  { id: "cg4", dim: "Cognition", text: "I would rather do it myself than explain it twice." },
  { id: "cg5", dim: "Cognition", text: "I rarely think more than one step ahead.", reverse: true },
  { id: "cg6", dim: "Cognition", text: "I can predict how a conversation ends before it starts." },
  { id: "cg7", dim: "Cognition", text: "Logic settles my decisions more often than feeling does." },
  { id: "cg8", dim: "Cognition", text: "I am happy to let others define the terms of a debate.", reverse: true },

  // Shadow — integration & self-awareness of dark instincts
  { id: "sh1", dim: "Shadow", text: "I know exactly which part of me is dangerous." },
  { id: "sh2", dim: "Shadow", text: "I can name the moment I choose control over honesty." },
  { id: "sh3", dim: "Shadow", text: "I study my own worst impulses instead of denying them." },
  { id: "sh4", dim: "Shadow", text: "I have never really examined my darker motives.", reverse: true },
  { id: "sh5", dim: "Shadow", text: "I notice myself performing before other people do." },
  { id: "sh6", dim: "Shadow", text: "I can admit when my kindness was strategic." },
  { id: "sh7", dim: "Shadow", text: "I think my flaws are mostly other people's fault.", reverse: true },
  { id: "sh8", dim: "Shadow", text: "I observe my own emotions as if from slightly outside them." },
];

export const DARK_PER_DIM = 4;
export const DARK_SESSION_SIZE = DARK_PER_DIM * DARK_DIMS.length;

/** Short labels used on the radar so six axes fit on a phone. */
export const DARK_SHORT: Record<string, string> = {
  Machiavellianism: "MACH",
  Narcissism: "EGO",
  Psychopathy: "COLD",
  Detachment: "SHIELD",
  Cognition: "MIND",
  Shadow: "SHADOW",
};

export const DARK_NOTES: Record<string, string> = {
  Machiavellianism:
    "Strategic calculation. You treat social life as a system with inputs and outputs — patient, positional, rarely surprised.",
  Narcissism:
    "Ego and grandiosity. You are building toward a version of yourself that does not exist yet, and you keep score while you do it.",
  Psychopathy:
    "Cold empathy and risk tolerance. Distress is information to you, not weather; consequences arrive after the decision, not before.",
  Detachment:
    "Vulnerability shield. You control the aperture — how much of you any person is allowed to see, and when it closes.",
  Cognition:
    "Intellectual control. You win by owning the frame: definitions, sequence and the second version of the plan nobody saw.",
  Shadow:
    "Shadow integration. How clearly you see your own dark instincts — the difference between a weapon you carry and one that carries you.",
};
