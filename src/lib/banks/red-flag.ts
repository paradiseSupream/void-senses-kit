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

export const RF_PER_AXIS = 5;
export const RF_SESSION_SIZE = RF_PER_AXIS * RF_AXES.length;

export const RF_BANK: Likert[] = [
  // Control
  { id: "c1", dim: "Control", text: "I get uneasy when my partner makes plans without telling me first." },
  { id: "c2", dim: "Control", text: "I have opinions about who my partner should spend time with." },
  { id: "c3", dim: "Control", text: "I like being the one who decides how we spend the weekend." },
  { id: "c4", dim: "Control", text: "I'm comfortable when someone close to me changes plans on their own.", reverse: true },
  { id: "c5", dim: "Control", text: "I check in more often than the other person seems to need." },
  { id: "c6", dim: "Control", text: "I find it easy to let people do things their own way.", reverse: true },
  { id: "c7", dim: "Control", text: "I re-do things other people did because my way is better." },
  { id: "c8", dim: "Control", text: "I ask where someone is more than they'd like." },
  { id: "c9", dim: "Control", text: "I can hand over a decision completely and not revisit it.", reverse: true },
  { id: "c10", dim: "Control", text: "A plan changing at the last minute genuinely doesn't rattle me.", reverse: true },

  // Jealousy
  { id: "j1", dim: "Jealousy", text: "Seeing my partner laugh with someone else stays on my mind afterwards." },
  { id: "j2", dim: "Jealousy", text: "I have looked at someone's phone or messages without being asked to." },
  { id: "j3", dim: "Jealousy", text: "I trust people close to me by default.", reverse: true },
  { id: "j4", dim: "Jealousy", text: "I compare myself to my partner's friends or exes." },
  { id: "j5", dim: "Jealousy", text: "A slow reply can make me assume something is wrong." },
  { id: "j6", dim: "Jealousy", text: "I can hear about a good time I wasn't part of without any sting.", reverse: true },
  { id: "j7", dim: "Jealousy", text: "I notice who likes my partner's posts." },
  { id: "j8", dim: "Jealousy", text: "I need reassurance more often than I admit." },
  { id: "j9", dim: "Jealousy", text: "My partner having close friends I don't know feels normal to me.", reverse: true },
  { id: "j10", dim: "Jealousy", text: "I feel calm when I can't reach someone for a few hours.", reverse: true },

  // Avoidance
  { id: "a1", dim: "Avoidance", text: "When a conversation gets heavy, I change the subject." },
  { id: "a2", dim: "Avoidance", text: "I go quiet for a while instead of saying what upset me." },
  { id: "a3", dim: "Avoidance", text: "I say what I need clearly, even when it's awkward.", reverse: true },
  { id: "a4", dim: "Avoidance", text: "I would rather let something go than have the argument." },
  { id: "a5", dim: "Avoidance", text: "I pull back when someone gets emotionally close." },
  { id: "a6", dim: "Avoidance", text: "I stay in the room until a disagreement is actually resolved.", reverse: true },
  { id: "a7", dim: "Avoidance", text: "I answer serious questions with a joke." },
  { id: "a8", dim: "Avoidance", text: "I disappear from messages when I'm overwhelmed." },
  { id: "a9", dim: "Avoidance", text: "I bring up the difficult topic myself instead of waiting.", reverse: true },
  { id: "a10", dim: "Avoidance", text: "I can sit with someone else's tears without needing to leave.", reverse: true },

  // Volatility
  { id: "v1", dim: "Volatility", text: "My reaction is bigger than the situation more often than I'd like." },
  { id: "v2", dim: "Volatility", text: "I say things in an argument that I regret the next day." },
  { id: "v3", dim: "Volatility", text: "I stay level even when I'm provoked.", reverse: true },
  { id: "v4", dim: "Volatility", text: "Small annoyances can flip my whole mood for the evening." },
  { id: "v5", dim: "Volatility", text: "I threaten to end things when I'm hurt." },
  { id: "v6", dim: "Volatility", text: "People describe me as steady under pressure.", reverse: true },
  { id: "v7", dim: "Volatility", text: "My tone changes before I notice my mood has." },
  { id: "v8", dim: "Volatility", text: "I slam doors, hang up or walk out when I'm angry." },
  { id: "v9", dim: "Volatility", text: "I can be criticised without my body reacting first.", reverse: true },
  { id: "v10", dim: "Volatility", text: "I come back to a conflict calmly after time has passed.", reverse: true },

  // Honesty
  { id: "h1", dim: "Honesty", text: "I soften the truth to avoid a difficult reaction." },
  { id: "h2", dim: "Honesty", text: "I have left out details that would have changed how someone felt." },
  { id: "h3", dim: "Honesty", text: "I own my mistakes quickly, without a defence first.", reverse: true },
  { id: "h4", dim: "Honesty", text: "I let people believe a version of events that flatters me." },
  { id: "h5", dim: "Honesty", text: "I keep promises even when they become inconvenient.", reverse: true },
  { id: "h6", dim: "Honesty", text: "I tell people what they want to hear in the moment." },
  { id: "h7", dim: "Honesty", text: "I have said \u201cnothing's wrong\u201d when something clearly was." },
  { id: "h8", dim: "Honesty", text: "I downplay how much something cost, took or hurt." },
  { id: "h9", dim: "Honesty", text: "I volunteer information that makes me look worse.", reverse: true },
  { id: "h10", dim: "Honesty", text: "People get the same version of a story from me twice.", reverse: true },
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

/**
 * Written interpretation per axis and band. Higher values mean the behaviour
 * shows up more often, so "High" is the costly end on every axis here.
 */
export const RF_NOTES: Record<string, { High: string; Moderate: string; Low: string }> = {
  Control: {
    High: "You manage the plan, the pace and often the other person's choices. It buys order and costs autonomy — the repair is asking before deciding, out loud, once a day.",
    Moderate: "You steer when the stakes feel high and let go when they don't. Watch the moments where 'helping' is really deciding for someone.",
    Low: "You leave room for other people to run their own lives, which is the single best predictor of low-friction relationships.",
  },
  Jealousy: {
    High: "Silence gets filled with stories. Checking for evidence calms you for an hour; naming the fear out loud calms you for a week.",
    Moderate: "You notice closeness carefully but usually let it pass. The sting arrives, then leaves — that is normal range.",
    Low: "You extend trust as a default and don't audit the people close to you.",
  },
  Avoidance: {
    High: "You protect peace by stepping back, so problems stay unresolved but quiet. One sentence said early beats a week of distance.",
    Moderate: "You raise the easy things and postpone the heavy ones. The backlog is where this gets expensive.",
    Low: "You stay in the room until the thing is actually finished, which is rarer than it sounds.",
  },
  Volatility: {
    High: "Feelings arrive at full volume. You are honest and hard to sit beside mid-argument; a twenty-minute pause changes nearly every outcome.",
    Moderate: "You spike occasionally and recover. Fatigue and hunger are your real triggers more often than the topic is.",
    Low: "You stay level when provoked, which lets other people say difficult things to you safely.",
  },
  Honesty: {
    High: "You edit reality to keep the room comfortable. It rarely starts as a lie, but the gap compounds — the awkward version first is the whole repair.",
    Moderate: "You are honest with softening. Mostly kind, occasionally confusing for the person on the other side.",
    Low: "People get the same story from you twice. That is what makes you safe to rely on.",
  },
};

/** Practical next step for the axis that scored highest. */
export const RF_ACTIONS: Record<string, string> = {
  Control: "This week: let one decision you'd normally make be made entirely by someone else, and don't revisit it.",
  Jealousy: "Next time silence stretches, write the story your mind is telling, then send the feeling instead of the accusation.",
  Avoidance: "Say the difficult sentence within 24 hours, not after it has cooled into distance.",
  Volatility: "Set a 20-minute rule: no replies while your heart rate is up. Come back, don't disappear.",
  Honesty: "Deliver the unflattering version of one story this week and watch what it does to trust.",
};
