import type { Likert } from "@/lib/quiz-engine";

/**
 * Childhood responsiveness bank — 48 statements across six dimensions.
 * A session draws 3 per dimension (18 items). Higher score = the dimension
 * felt more dependable growing up. `reverse` items are worded negatively.
 */
export const TRAUMA_DIMS = [
  "Safety",
  "Trust",
  "Voice",
  "Attachment",
  "Self-worth",
  "Regulation",
] as const;

export type TraumaDim = (typeof TRAUMA_DIMS)[number];

export const TRAUMA_BANK: Likert[] = [
  // Safety
  { id: "sa1", dim: "Safety", text: "When the house got loud, I still knew I would be okay." },
  { id: "sa2", dim: "Safety", text: "I could predict how the adults around me would react to bad news." },
  { id: "sa3", dim: "Safety", text: "I often scanned for a change of mood before I spoke.", reverse: true },
  { id: "sa4", dim: "Safety", text: "Home felt like a place I could relax my shoulders in." },
  { id: "sa5", dim: "Safety", text: "I had a plan for where to go when things got tense.", reverse: true },
  { id: "sa6", dim: "Safety", text: "Rules at home stayed the same from one day to the next." },
  { id: "sa7", dim: "Safety", text: "Small mistakes could turn into a very big deal.", reverse: true },
  { id: "sa8", dim: "Safety", text: "I slept easily without listening for what was happening in the house." },

  // Trust
  { id: "tr1", dim: "Trust", text: "When I told someone a secret, it stayed a secret." },
  { id: "tr2", dim: "Trust", text: "Promises made to me were usually kept." },
  { id: "tr3", dim: "Trust", text: "I learned early that people say things they do not mean.", reverse: true },
  { id: "tr4", dim: "Trust", text: "If an adult said they would come, they came." },
  { id: "tr5", dim: "Trust", text: "I checked whether help was genuine before accepting it.", reverse: true },
  { id: "tr6", dim: "Trust", text: "I could ask for something without preparing for a reason why not." },
  { id: "tr7", dim: "Trust", text: "Apologies at home came with real change afterwards." },
  { id: "tr8", dim: "Trust", text: "I assumed kindness usually had a cost attached.", reverse: true },

  // Voice
  { id: "vo1", dim: "Voice", text: "Disagreeing with an adult felt safe to do out loud." },
  { id: "vo2", dim: "Voice", text: "My preferences changed what actually happened at home." },
  { id: "vo3", dim: "Voice", text: "I kept opinions to myself to keep the peace.", reverse: true },
  { id: "vo4", dim: "Voice", text: "Saying “no” was something I was allowed to do." },
  { id: "vo5", dim: "Voice", text: "When I explained my side, someone actually listened." },
  { id: "vo6", dim: "Voice", text: "I learned that being quiet caused fewer problems.", reverse: true },
  { id: "vo7", dim: "Voice", text: "My feelings were treated as information, not as a nuisance." },
  { id: "vo8", dim: "Voice", text: "I rehearsed what I would say before asking for anything.", reverse: true },

  // Attachment
  { id: "at1", dim: "Attachment", text: "There was at least one person I could go to without warning." },
  { id: "at2", dim: "Attachment", text: "Being comforted felt natural rather than awkward." },
  { id: "at3", dim: "Attachment", text: "I handled hard things alone because that was simpler.", reverse: true },
  { id: "at4", dim: "Attachment", text: "Someone noticed when my mood changed." },
  { id: "at5", dim: "Attachment", text: "Affection at home was steady rather than conditional." },
  { id: "at6", dim: "Attachment", text: "I worried that needing people would push them away.", reverse: true },
  { id: "at7", dim: "Attachment", text: "Goodbyes did not feel like something to brace for." },
  { id: "at8", dim: "Attachment", text: "I had to earn closeness by being useful.", reverse: true },

  // Self-worth
  { id: "sw1", dim: "Self-worth", text: "I believed I was worth someone's time even when I failed." },
  { id: "sw2", dim: "Self-worth", text: "Praise at home was about who I was, not only what I achieved." },
  { id: "sw3", dim: "Self-worth", text: "I felt like an inconvenience more often than not.", reverse: true },
  { id: "sw4", dim: "Self-worth", text: "My interests were treated as worth taking seriously." },
  { id: "sw5", dim: "Self-worth", text: "I compared myself to a sibling or cousin and came out short.", reverse: true },
  { id: "sw6", dim: "Self-worth", text: "I could take up space in a room without apologising for it." },
  { id: "sw7", dim: "Self-worth", text: "Being “good” felt like a requirement for being loved.", reverse: true },
  { id: "sw8", dim: "Self-worth", text: "I grew up expecting to be liked by new people." },

  // Regulation
  { id: "rg1", dim: "Regulation", text: "When I got upset, I could come back down on my own." },
  { id: "rg2", dim: "Regulation", text: "Someone helped me name what I was feeling." },
  { id: "rg3", dim: "Regulation", text: "Strong feelings were something to hide until they passed.", reverse: true },
  { id: "rg4", dim: "Regulation", text: "Crying was allowed without consequences." },
  { id: "rg5", dim: "Regulation", text: "I could stay calm when someone else lost their temper." },
  { id: "rg6", dim: "Regulation", text: "I went numb rather than upset when things got hard.", reverse: true },
  { id: "rg7", dim: "Regulation", text: "Conflict ended with repair rather than silence." },
  { id: "rg8", dim: "Regulation", text: "I still tense up when a room goes suddenly quiet.", reverse: true },
];

export const TRAUMA_PER_DIM = 3;
export const TRAUMA_SESSION_SIZE = TRAUMA_PER_DIM * TRAUMA_DIMS.length;

/** Written interpretation for each dimension at each band. */
export const TRAUMA_NOTES: Record<string, { High: string; Moderate: string; Low: string }> = {
  Safety: {
    High: "Predictability was available to you, so your nervous system learned that calm is normal rather than suspicious.",
    Moderate: "Home was safe in patches. You can settle, but you still read the room before you relax fully.",
    Low: "Unpredictability taught you to stay alert. Today that shows up as scanning for tone changes long before anything is wrong.",
  },
  Trust: {
    High: "You extend trust as a default, which makes new relationships fast to form and easy to maintain.",
    Moderate: "You trust in stages. People get access in layers, and the last layer takes a while.",
    Low: "Broken promises taught you to verify. You are rarely blindsided, but closeness costs you more effort than it should.",
  },
  Voice: {
    High: "You learned your words change outcomes, so you say the difficult thing early instead of storing it.",
    Moderate: "You speak up when the stakes are clear, and go quiet when the room feels fragile.",
    Low: "Silence was the safer strategy, so you often notice your real opinion only after the conversation ends.",
  },
  Attachment: {
    High: "Being close feels ordinary rather than risky. You ask for support without an internal negotiation first.",
    Moderate: "You want closeness and keep an exit visible at the same time.",
    Low: "Self-reliance arrived early. Needing someone still registers as exposure rather than intimacy.",
  },
  "Self-worth": {
    High: "Your worth is not conditional on output, so criticism lands as feedback instead of a verdict.",
    Moderate: "You believe in yourself most clearly when you are performing well.",
    Low: "You learned to earn your place. Rest feels unearned and praise feels like it was aimed at someone else.",
  },
  Regulation: {
    High: "You can feel something strongly and still think clearly, which is the single best predictor of steady relationships.",
    Moderate: "You recover, but big feelings still take a detour through control or distraction first.",
    Low: "Regulation was never modelled for you, so intensity tends to arrive as either flood or shutdown.",
  },
};

/** Archetype named from the two strongest dimensions. */
export function traumaArchetype(top: string, low: string): { name: string; punch: string } {
  const map: Record<string, string> = {
    Safety: "Sentinel",
    Trust: "Open Signal",
    Voice: "Clear Speaker",
    Attachment: "Anchor",
    "Self-worth": "Steady Flame",
    Regulation: "Still Water",
  };
  const shadow: Record<string, string> = {
    Safety: "on quiet alert",
    Trust: "verifying first",
    Voice: "holding the sentence back",
    Attachment: "self-contained",
    "Self-worth": "earning the room",
    Regulation: "managing the surge",
  };
  return {
    name: `The ${map[top] ?? "Observer"}`,
    punch: `Strongest in ${top}, still ${shadow[low] ?? "learning"} when it comes to ${low}.`,
  };
}
