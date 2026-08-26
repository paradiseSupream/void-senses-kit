import type { Likert } from "@/lib/quiz-engine";

/**
 * Relational-vibe bank — 45 statements across five dimensions.
 * A session draws 3 per dimension (15 items) and combines them with the name
 * pair so the score is part self-report, part chemistry read.
 */
export const LOVE_DIMS = ["Banter", "Trust", "Adventure", "Calm", "Spark"] as const;

export const LOVE_BANK: Likert[] = [
  // Banter
  { id: "b1", dim: "Banter", text: "We can turn a boring errand into a bit." },
  { id: "b2", dim: "Banter", text: "Our arguments usually end in laughing." },
  { id: "b3", dim: "Banter", text: "I send them things no one else would find funny." },
  { id: "b4", dim: "Banter", text: "Silence between us feels awkward.", reverse: true },
  { id: "b5", dim: "Banter", text: "We have a private vocabulary." },
  { id: "b6", dim: "Banter", text: "Teasing between us never leaves a bruise." },
  { id: "b7", dim: "Banter", text: "I edit my humour around them.", reverse: true },
  { id: "b8", dim: "Banter", text: "We finish each other's chaos." },
  { id: "b9", dim: "Banter", text: "Conversation with them runs out quickly.", reverse: true },

  // Trust
  { id: "t1", dim: "Trust", text: "I would tell them the version of a story that makes me look bad." },
  { id: "t2", dim: "Trust", text: "When they say they will handle it, I stop thinking about it." },
  { id: "t3", dim: "Trust", text: "I check their tone for hidden meaning.", reverse: true },
  { id: "t4", dim: "Trust", text: "I could disagree with them without fearing the aftermath." },
  { id: "t5", dim: "Trust", text: "They keep what I tell them." },
  { id: "t6", dim: "Trust", text: "I would want them in the room during bad news." },
  { id: "t7", dim: "Trust", text: "I keep a small part of myself in reserve with them.", reverse: true },
  { id: "t8", dim: "Trust", text: "Their apology means something changes." },
  { id: "t9", dim: "Trust", text: "I feel watched rather than seen around them.", reverse: true },

  // Adventure
  { id: "a1", dim: "Adventure", text: "We say yes to plans made twenty minutes ago." },
  { id: "a2", dim: "Adventure", text: "Travelling together sounds easy rather than risky." },
  { id: "a3", dim: "Adventure", text: "We push each other into new things." },
  { id: "a4", dim: "Adventure", text: "We would rather repeat what works than try something new.", reverse: true },
  { id: "a5", dim: "Adventure", text: "Boredom with them is rare." },
  { id: "a6", dim: "Adventure", text: "We have a running list of things to do together." },
  { id: "a7", dim: "Adventure", text: "One of us always talks the other out of it.", reverse: true },
  { id: "a8", dim: "Adventure", text: "Getting lost together would be a good story, not a fight." },
  { id: "a9", dim: "Adventure", text: "Our best memories involve doing something unplanned." },

  // Calm
  { id: "c1", dim: "Calm", text: "Being around them lowers my heart rate." },
  { id: "c2", dim: "Calm", text: "We can spend hours in the same room saying nothing." },
  { id: "c3", dim: "Calm", text: "Conflict between us resolves within a day." },
  { id: "c4", dim: "Calm", text: "I brace myself before difficult conversations with them.", reverse: true },
  { id: "c5", dim: "Calm", text: "They are steady when I am not." },
  { id: "c6", dim: "Calm", text: "Small annoyances stack up unsaid between us.", reverse: true },
  { id: "c7", dim: "Calm", text: "Their presence makes decisions feel less heavy." },
  { id: "c8", dim: "Calm", text: "We rarely misread each other's mood." },
  { id: "c9", dim: "Calm", text: "I need recovery time after seeing them.", reverse: true },

  // Spark
  { id: "s1", dim: "Spark", text: "I still notice when they walk into a room." },
  { id: "s2", dim: "Spark", text: "Their attention feels like a small event." },
  { id: "s3", dim: "Spark", text: "We flirt even when nothing is at stake." },
  { id: "s4", dim: "Spark", text: "The chemistry is more comfortable than electric.", reverse: true },
  { id: "s5", dim: "Spark", text: "I think about them at random points in the day." },
  { id: "s6", dim: "Spark", text: "Their good news feels like mine." },
  { id: "s7", dim: "Spark", text: "I would recognise their footsteps." },
  { id: "s8", dim: "Spark", text: "The pull between us has faded with time.", reverse: true },
  { id: "s9", dim: "Spark", text: "Being chosen by them would still feel like a win." },
];

export const LOVE_PER_DIM = 4;
export const LOVE_SESSION_SIZE = LOVE_PER_DIM * LOVE_DIMS.length;

export const LOVE_VERDICTS: { min: number; title: string; line: string }[] = [
  { min: 85, title: "Suspiciously Synced", line: "This is the pairing group chats gossip about. High trust, high spark, almost no static." },
  { min: 70, title: "Strong Signal", line: "You two run on the same frequency most of the time, with just enough friction to stay interesting." },
  { min: 55, title: "Good With Effort", line: "The foundation is real. What you have needs maintenance more than it needs magic." },
  { min: 40, title: "Beautiful Static", line: "Great on paper, better after coffee. You balance each other — sometimes on purpose." },
  { min: 0, title: "Different Frequencies", line: "Friction now, folklore later. Same city, different playlists." },
];

export function loveVerdict(score: number) {
  return LOVE_VERDICTS.find((v) => score >= v.min) ?? LOVE_VERDICTS[LOVE_VERDICTS.length - 1]!;
}
