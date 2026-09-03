/**
 * Red Flag Radar — relationship-behaviour self-report.
 *
 * Deliberately framed as self-reflection ("how do I behave"), not as a way to
 * diagnose someone else. Each statement loads one of five behaviour axes that
 * relationship research consistently flags as friction sources. Nothing here
 * is a clinical instrument, and the copy says so on the result screen.
 */

import type { Likert } from "@/lib/quiz-engine";

export const RF_AXES = ["Control", "Jealousy", "Avoidance", "Volatility", "Honesty"] as const;
export type RfAxis = (typeof RF_AXES)[number];

export const RF_PER_AXIS = 4;
export const RF_SESSION_SIZE = RF_PER_AXIS * RF_AXES.length;

export const RF_BANK: Likert[] = [
  // Control
  { id: "c1", dim: "Control", text: "I get uneasy when my partner makes plans without telling me first." },
  { id: "c2", dim: "Control", text: "I have opinions about who my partner should spend time with." },
  { id: "c3", dim: "Control", text: "I like being the one who decides how we spend the weekend." },
  { id: "c4", dim: "Control", text: "I'm comfortable when someone close to me changes plans on their own.", reverse: true },
  { id: "c5", dim: "Control", text: "I check in more often than the other person seems to need." },
  { id: "c6", dim: "Control", text: "I find it easy to let people do things their own way.", reverse: true },

  // Jealousy
  { id: "j1", dim: "Jealousy", text: "Seeing my partner laugh with someone else stays on my mind afterwards." },
  { id: "j2", dim: "Jealousy", text: "I have looked at someone's phone or messages without being asked to." },
  { id: "j3", dim: "Jealousy", text: "I trust people close to me by default.", reverse: true },
  { id: "j4", dim: "Jealousy", text: "I compare myself to my partner's friends or exes." },
  { id: "j5", dim: "Jealousy", text: "A slow reply can make me assume something is wrong." },
  { id: "j6", dim: "Jealousy", text: "I can hear about a good time I wasn't part of without any sting.", reverse: true },

  // Avoidance
  { id: "a1", dim: "Avoidance", text: "When a conversation gets heavy, I change the subject." },
  { id: "a2", dim: "Avoidance", text: "I go quiet for a while instead of saying what upset me." },
  { id: "a3", dim: "Avoidance", text: "I say what I need clearly, even when it's awkward.", reverse: true },
  { id: "a4", dim: "Avoidance", text: "I would rather let something go than have the argument." },
  { id: "a5", dim: "Avoidance", text: "I pull back when someone gets emotionally close." },
  { id: "a6", dim: "Avoidance", text: "I stay in the room until a disagreement is actually resolved.", reverse: true },

  // Volatility
  { id: "v1", dim: "Volatility", text: "My reaction is bigger than the situation more often than I'd like." },
  { id: "v2", dim: "Volatility", text: "I say things in an argument that I regret the next day." },
  { id: "v3", dim: "Volatility", text: "I stay level even when I'm provoked.", reverse: true },
  { id: "v4", dim: "Volatility", text: "Small annoyances can flip my whole mood for the evening." },
  { id: "v5", dim: "Volatility", text: "I threaten to end things when I'm hurt." },
  { id: "v6", dim: "Volatility", text: "People describe me as steady under pressure.", reverse: true },

  // Honesty
  { id: "h1", dim: "Honesty", text: "I soften the truth to avoid a difficult reaction." },
  { id: "h2", dim: "Honesty", text: "I have left out details that would have changed how someone felt." },
  { id: "h3", dim: "Honesty", text: "I own my mistakes quickly, without a defence first.", reverse: true },
  { id: "h4", dim: "Honesty", text: "I let people believe a version of events that flatters me." },
  { id: "h5", dim: "Honesty", text: "I keep promises even when they become inconvenient.", reverse: true },
  { id: "h6", dim: "Honesty", text: "I tell people what they want to hear in the moment." },
];

export type RfProfile = { name: string; blurb: string; band: "Green" | "Amber" | "Red" };

/** Highest axis names the profile; the overall average sets the flag colour. */
export function rfProfile(scores: { dim: string; value: number }[]): RfProfile {
  const avg = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.value, 0) / scores.length)
    : 0;
  const top = [...scores].sort((a, b) => b.value - a.value)[0];
  const band: RfProfile["band"] = avg >= 60 ? "Red" : avg >= 38 ? "Amber" : "Green";

  const names: Record<string, string> = {
    Control: "The Steering Wheel",
    Jealousy: "The Watchtower",
    Avoidance: "The Vanishing Act",
    Volatility: "The Weather Front",
    Honesty: "The Soft Edit",
  };
  const blurbs: Record<string, string> = {
    Control:
      "Your strongest pull is toward steering the plan. It reads as reliability on good days and as pressure on bad ones. The fix is small: ask before you decide, once a day.",
    Jealousy:
      "You track closeness carefully, and your mind fills silence with stories. Naming the fear out loud usually deflates it faster than checking for evidence does.",
    Avoidance:
      "You protect the peace by stepping back. It keeps things calm short-term and unresolved long-term. One sentence said early beats a week of distance.",
    Volatility:
      "Your feelings arrive at full volume, which makes you honest and hard to sit next to mid-argument. A twenty-minute pause before replying changes almost every outcome.",
    Honesty:
      "You edit reality to keep the room comfortable. It rarely starts as a lie, but the gap compounds. Saying the awkward version first is the whole repair.",
  };

  const key = top?.dim ?? "Honesty";
  const prefix =
    band === "Green"
      ? "Mostly green. "
      : band === "Amber"
        ? "Amber — worth watching. "
        : "Red flags worth working on. ";

  return {
    name: names[key] ?? "The Mixed Signal",
    band,
    blurb: prefix + (blurbs[key] ?? ""),
  };
}
