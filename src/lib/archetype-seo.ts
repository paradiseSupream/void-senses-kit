/**
 * SEO landing-page content for the eight shadow archetypes.
 *
 * Purely editorial: no scoring maths, no premium dossier prose. Each entry
 * powers one indexable page at /archetypes/{slug} whose job is to rank for
 * "<archetype name> personality" style queries and funnel the reader into the
 * free Dark Personality test.
 */

import { PUBLIC_ARCHETYPES, type ArchetypeKey, type PublicArchetype } from "@/lib/archetype-core";

export type ArchetypeSeo = {
  key: ArchetypeKey;
  /** Short label used in cards, breadcrumbs and the hub grid. */
  short: string;
  /** Rarity blurb — social proof for the share loop. */
  rarity: string;
  title: string;
  description: string;
  intro: string[];
  signs: string[];
  strengths: string[];
  risks: string[];
  relationships: string;
  career: string;
  growth: string[];
  faq: { q: string; a: string }[];
  related: ArchetypeKey[];
  keywords: string[];
};

export const ARCHETYPE_SEO: Record<ArchetypeKey, ArchetypeSeo> = {
  "sovereign-manipulator": {
    key: "sovereign-manipulator",
    short: "Sovereign Manipulator",
    rarity: "≈ 11% of test takers",
    title: "The Sovereign Manipulator — Traits, Strengths & Shadow Side",
    description:
      "The Sovereign Manipulator archetype: high Machiavellianism paired with warm narcissism. Learn the signs, strengths, blind spots and how it scores on the free Dark Personality test.",
    intro: [
      "The Sovereign Manipulator is the archetype of influence that never looks like influence. On the six-axis shadow profile this pattern sits high on Machiavellianism and Narcissism while keeping Cognitive Dominance well above average — a combination that produces someone who arranges outcomes rather than argues for them.",
      "People with this profile rarely raise their voice. They set the conditions, offer the options they can live with, and let the other person feel authorship over a decision that was effectively made in advance. It reads as generosity, and often genuinely is — the intent is usually order, not harm.",
    ],
    signs: [
      "You would rather change the situation than win the argument inside it.",
      "People routinely thank you for a choice you engineered.",
      "You track who owes whom, socially, without ever writing it down.",
      "You are comfortable being underestimated if it keeps the room relaxed.",
      "You feel physically uneasy in environments you cannot influence.",
      "Your favours tend to arrive slightly before they are needed.",
    ],
    strengths: [
      "Exceptional political intelligence in teams and families",
      "De-escalates conflict by redesigning it out of existence",
      "Long time horizons — plans measured in seasons, not days",
      "Rarely burns a bridge, even with people they have outmanoeuvred",
    ],
    risks: [
      "Winning so quietly that nobody, including you, knows what you wanted",
      "Intimacy replaced by management",
      "Resentment that surfaces years late because it was never voiced",
      "Difficulty accepting help that you did not orchestrate",
    ],
    relationships:
      "In close relationships the Sovereign Manipulator is steady, protective and quietly controlling. Partners describe feeling looked after and slightly unread. The healthy version of this archetype learns to state a want plainly — an unarranged, unstrategic request — and tolerate the vulnerability of possibly being refused.",
    career:
      "This profile clusters into operations, founder roles, politics, negotiation-heavy sales and any job where the real work happens between meetings. It underperforms in rigid hierarchies where the ability to shape context is removed.",
    growth: [
      "Name the outcome you want out loud, once a day, before arranging it.",
      "Let one low-stakes situation resolve without your intervention.",
      "Ask someone close what they think you are optimising for — and listen.",
      "Separate the reflex to manage from the decision to care.",
    ],
    faq: [
      {
        q: "Is the Sovereign Manipulator a bad personality type?",
        a: "No. High Machiavellianism measures strategic social reasoning, not malice. The same trait profile appears in exploitative operators and in extremely effective, ethical leaders. What differs is whether the strategy is used with consent.",
      },
      {
        q: "How rare is this archetype?",
        a: "It is one of the more common results on the Dark Personality test, appearing in roughly one in nine completed profiles, though the intensity score varies widely inside that group.",
      },
      {
        q: "Which archetype is it most often confused with?",
        a: "The Machiavellian Architect. Both plan ahead, but the Architect optimises systems while the Sovereign Manipulator optimises relationships.",
      },
    ],
    related: ["machiavellian-architect", "dark-empath"],
    keywords: [
      "sovereign manipulator personality",
      "machiavellian personality traits",
      "dark triad archetype test",
    ],
  },
  "velvet-ghost": {
    key: "velvet-ghost",
    short: "Velvet Ghost",
    rarity: "≈ 14% of test takers",
    title: "The Velvet Ghost — Warm, Present and Completely Unreachable",
    description:
      "The Velvet Ghost archetype: very high emotional detachment behind genuine warmth. Signs, strengths, attachment patterns and how to score it on the free Dark Personality test.",
    intro: [
      "The Velvet Ghost is defined by an unusual gap: extremely high Emotional Detachment combined with real social warmth. This is not coldness. People enjoy the Velvet Ghost, feel comfortable around them, and afterwards cannot name a single thing they learned.",
      "The profile is most often built, not born — a nervous system that concluded early that being known is more expensive than being liked. The result is an atmosphere rather than a disclosure.",
    ],
    signs: [
      "You are described as easy to talk to by people who know almost nothing about you.",
      "You answer personal questions with a better question.",
      "Leaving a group chat, a job or a city costs you less than it should.",
      "Your closest friendships have long, unremarked gaps.",
      "You confuse solitude with recovery, and never test the difference.",
      "You notice the exact moment a conversation is about to become intimate.",
    ],
    strengths: [
      "Unshakeable in crisis — the last calm person in the room",
      "Almost impossible to manipulate through emotional pressure",
      "Genuinely non-judgemental listener",
      "Recovers from rejection faster than almost any other profile",
    ],
    risks: [
      "Mistaking distance for peace",
      "Relationships that stall at the same depth for years",
      "Delayed grief — feelings arriving months after the event",
      "Loneliness misread as introversion",
    ],
    relationships:
      "Partners of a Velvet Ghost often report the same paradox: nothing is wrong, and nothing is close. The growth edge is not more talking but riskier talking — one unfinished, unedited disclosure at a time, before the urge to smooth it over arrives.",
    career:
      "Strong in negotiation, medicine, emergency response, moderation, security and any role where other people's panic is an occupational input. Weakest where sustained emotional visibility is the product.",
    growth: [
      "Answer one personal question this week without redirecting it.",
      "Tell someone a fact about yourself that has no strategic value.",
      "Notice the physical signal that precedes withdrawal, and stay 60 seconds longer.",
      "Track whether solitude actually restored you, or just postponed something.",
    ],
    faq: [
      {
        q: "Is the Velvet Ghost the same as being avoidant?",
        a: "They overlap but are not identical. Avoidant attachment is a relational strategy; the Velvet Ghost archetype describes the full six-axis profile, including the warmth and social fluency that make the detachment hard to spot.",
      },
      {
        q: "Can this archetype change?",
        a: "It is one of the most movable profiles. Detachment scores shift measurably when disclosure becomes routine rather than exceptional.",
      },
      {
        q: "Which archetype is closest to it?",
        a: "The Stoic Predator shares the detachment axis but adds decisiveness and risk tolerance where the Velvet Ghost adds warmth.",
      },
    ],
    related: ["stoic-predator", "shadow-mirror"],
    keywords: [
      "velvet ghost personality type",
      "emotional detachment test",
      "avoidant personality archetype",
    ],
  },
  "machiavellian-architect": {
    key: "machiavellian-architect",
    short: "Machiavellian Architect",
    rarity: "≈ 12% of test takers",
    title: "The Machiavellian Architect — Systems Where Others See Situations",
    description:
      "The Machiavellian Architect archetype: peak cognitive dominance plus strategic reasoning. Traits, strengths, blind spots and how to measure it on the free Dark Personality test.",
    intro: [
      "The Machiavellian Architect scores at the top of both Cognitive Dominance and Machiavellianism. Where most people experience a disagreement, this profile experiences a badly designed system that is producing a predictable disagreement.",
      "Architects do not usually argue. They change the inputs — the schedule, the incentive, the seating, the deadline — until the conflict has nowhere left to live. Most of their wins were decided before anyone noticed a contest existed.",
    ],
    signs: [
      "You solve recurring problems by changing the process, not the people.",
      "You can predict how a group will behave with uncomfortable accuracy.",
      "You get bored by problems you have already solved in your head.",
      "You find emotional appeals inefficient rather than moving.",
      "You keep a mental model of everyone's incentives, updated automatically.",
      "You dislike improvisation and are unusually good at it.",
    ],
    strengths: [
      "Rare structural thinking — sees three moves past the visible problem",
      "Extremely reliable judgement under incomplete information",
      "Builds durable systems that outlive their attention",
      "Immune to hype cycles and social pressure",
    ],
    risks: [
      "Treating people as variables long after they became friends",
      "Optimising a relationship that needed presence, not design",
      "Contempt for slower thinkers, expressed as patience",
      "Isolation from being the only one who sees the whole board",
    ],
    relationships:
      "The Architect loves through logistics — the fixed problem, the removed friction, the anticipated need. It is real love, and it can be received as coldness. The growth work is offering unengineered presence: staying in a problem you cannot fix.",
    career:
      "Overrepresented in engineering leadership, strategy, law, quant finance and founding teams. Struggles in roles that reward visible enthusiasm over correctness.",
    growth: [
      "Sit with one unsolved problem for a full day without designing around it.",
      "Ask a question you already know the answer to, and hear it out.",
      "Say 'that sounds hard' before saying 'here is what I would do'.",
      "Audit one system you built for whether it still serves people or only itself.",
    ],
    faq: [
      {
        q: "Is high Machiavellianism a sign of a dark triad personality?",
        a: "It is one of the three classical dark-triad traits, but on its own it measures strategic social cognition. Combined with high Shadow Integration — as it often is in Architects — it tends to be used constructively.",
      },
      {
        q: "What is the difference between the Architect and the Sovereign Manipulator?",
        a: "Same planning horizon, different target. Architects redesign structures; Sovereign Manipulators redesign relationships.",
      },
      {
        q: "Does a high IQ produce this archetype?",
        a: "Not directly. Cognitive Dominance measures how strongly reasoning overrides instinct in social settings, which is related to but distinct from measured IQ.",
      },
    ],
    related: ["sovereign-manipulator", "nihilistic-sovereign"],
    keywords: [
      "machiavellian architect personality",
      "strategic thinker personality type",
      "cognitive dominance test",
    ],
  },
  "dark-empath": {
    key: "dark-empath",
    short: "Dark Empath",
    rarity: "≈ 13% of test takers",
    title: "The Dark Empath — Full Empathy With a Strategic Mind Behind It",
    description:
      "The Dark Empath archetype: high shadow integration and strategic reasoning with low psychopathy. Signs, strengths, burnout risk and how to measure it on the free Dark Personality test.",
    intro: [
      "The Dark Empath is the rarest useful combination in the model: the accuracy of a manipulator with the conscience of someone who cannot un-feel the cost. Shadow Integration and Machiavellianism both run high while Psychopathy runs distinctly low.",
      "This profile reads a room completely — including exactly what could be done with it — and then declines most of those options. That double awareness is why Dark Empaths are unusually trustworthy and unusually tired.",
    ],
    signs: [
      "You know what would work on someone and choose not to use it.",
      "You feel other people's mood shifts before they mention them.",
      "You audit your own motives so often it slows you down.",
      "You are the person friends bring their worst news to.",
      "You resent being needed and would not change it.",
      "You have declined an easy win because of how it would feel afterwards.",
    ],
    strengths: [
      "Reads intent with near-diagnostic accuracy",
      "Extremely persuasive without deception",
      "Natural mediator between people who cannot hear each other",
      "Strong ethical self-correction under pressure",
    ],
    risks: [
      "Chronic exhaustion from carrying other people's states",
      "Over-responsibility for outcomes that were never yours",
      "Resentment disguised as understanding",
      "Attracting people who need managing rather than partners",
    ],
    relationships:
      "Dark Empaths give more context, patience and repair effort than they receive, and often pair with people who cannot match it. The corrective is boundaries stated early, while the situation is still small, rather than a rupture after months of quiet accounting.",
    career:
      "Therapy, HR, teaching, brand and product design, investigative work, community leadership — anywhere accurate reading of people is the core asset. Burns out fastest of any profile in high-volume emotional labour.",
    growth: [
      "Say no once this week without supplying a reason.",
      "Notice when understanding someone is replacing a boundary.",
      "Let a friend sit in a feeling without translating it for them.",
      "Schedule recovery before you need it, not after.",
    ],
    faq: [
      {
        q: "Is a dark empath dangerous?",
        a: "Not inherently. The term describes empathy plus strategic reasoning. The risk is real when psychopathy is also elevated — which is exactly what this archetype scores low on.",
      },
      {
        q: "Why do dark empaths burn out?",
        a: "They run two expensive processes at once: absorbing other people's emotional states, and continuously auditing their own motives. Neither switches off automatically.",
      },
      {
        q: "Which archetype conflicts most with it?",
        a: "The Nihilistic Sovereign. One optimises for freedom from obligation, the other cannot stop feeling obligated.",
      },
    ],
    related: ["shadow-mirror", "sovereign-manipulator"],
    keywords: [
      "dark empath test",
      "dark empath personality traits",
      "empathy and machiavellianism",
    ],
  },
  "stoic-predator": {
    key: "stoic-predator",
    short: "Stoic Predator",
    rarity: "≈ 9% of test takers",
    title: "The Stoic Predator — Still Water, Decided in Advance",
    description:
      "The Stoic Predator archetype: high psychopathy-axis composure and emotional detachment. Traits, strengths, numbness risk and how to score it on the free Dark Personality test.",
    intro: [
      "The Stoic Predator sits high on the Psychopathy axis — which in this model measures fearlessness and low emotional reactivity rather than criminality — with Emotional Detachment close behind. The visible result is calm in the exact places other people panic.",
      "This profile acts while others are still processing. Nothing about it looks aggressive until the moment it is already done, which is why the archetype is common among surgeons, pilots, fighters and crisis operators.",
    ],
    signs: [
      "Your heart rate drops when a situation becomes serious.",
      "You have made a hard decision before others realised one was needed.",
      "You do not rehearse conversations; you have them.",
      "Physical or social risk registers as information, not threat.",
      "You are hard to insult and easy to underestimate.",
      "You go quiet rather than loud when angry.",
    ],
    strengths: [
      "Best-in-model performance under acute pressure",
      "Decisiveness without drama",
      "High pain and ambiguity tolerance",
      "Loyal in a concrete, unspoken way",
    ],
    risks: [
      "Calling numbness discipline and paying for it in the body",
      "Missing the early signals of other people's distress",
      "Escalating past the point required, calmly",
      "Long-term isolation from never appearing to need anything",
    ],
    relationships:
      "Partners feel safe and occasionally unseen. This archetype protects by absorbing, which means the other person often learns about a problem after it is solved. Growth means narrating the pressure while it is happening, not after.",
    career:
      "Emergency medicine, military and security, professional sport, trading floors, turnaround management. Poorly matched to roles requiring constant emotional expressiveness.",
    growth: [
      "Name one physical sensation each day before interpreting it.",
      "Tell someone about a decision while you are still making it.",
      "Ask whether calm is regulation or shutdown — the two feel identical from the inside.",
      "Book the medical check-up you have been ignoring.",
    ],
    faq: [
      {
        q: "Does a high psychopathy score mean I am a psychopath?",
        a: "No. This axis measures fearlessness, low emotional reactivity and comfort with risk on a continuous scale. Clinical psychopathy is a diagnosis, not a quiz result, and this test is not diagnostic.",
      },
      {
        q: "Is the Stoic Predator good in relationships?",
        a: "Often very stable, occasionally distant. The failure mode is unshared pressure, not disloyalty.",
      },
      {
        q: "How rare is this profile?",
        a: "One of the less common results — roughly one in eleven completed profiles.",
      },
    ],
    related: ["velvet-ghost", "nihilistic-sovereign"],
    keywords: [
      "stoic predator personality",
      "fearlessness personality test",
      "low emotional reactivity traits",
    ],
  },
  "narcissistic-visionary": {
    key: "narcissistic-visionary",
    short: "Narcissistic Visionary",
    rarity: "≈ 15% of test takers",
    title: "The Narcissistic Visionary — A Future So Vivid the Present Looks Like Scaffolding",
    description:
      "The Narcissistic Visionary archetype: peak narcissism paired with strong cognition. Signs, magnetism, blind spots and how it scores on the free Dark Personality test.",
    intro: [
      "The Narcissistic Visionary scores highest of all archetypes on the Narcissism axis, supported by strong Cognitive Dominance. In this model narcissism measures self-concept intensity and the drive to be significant — not cruelty.",
      "The result is genuinely productive: a person always building the next version of themselves, recruiting everyone nearby into a future that does not exist yet. The certainty is contagious. It only becomes a problem when reality asks it to bend.",
    ],
    signs: [
      "You are already three versions ahead of the person you are today.",
      "Praise lands less than progress does.",
      "You can make other people believe in a plan with no evidence yet.",
      "Criticism of the vision feels like criticism of you.",
      "You struggle to enjoy an achievement for longer than a day.",
      "You would rather be exceptional than comfortable.",
    ],
    strengths: [
      "Rare ability to move groups toward something unproven",
      "High output and unusual resilience to setbacks",
      "Sets standards that lift everyone around them",
      "Recovers from public failure faster than most profiles",
    ],
    risks: [
      "Arriving somewhere excellent and refusing to notice",
      "Confusing loyal disagreement with disloyalty",
      "Burning collaborators who cannot sustain the pace",
      "Identity collapse when the project fails",
    ],
    relationships:
      "Magnetic at the start, demanding over time. Partners describe being inspired and slightly secondary to the mission. The healthy version separates worth from performance — practising being ordinary in private without treating it as failure.",
    career:
      "Founders, creative directors, performers, sales leadership, anything where conviction is the product. Suffers in flat, credit-diffuse environments.",
    growth: [
      "Finish something and do nothing with it for a week.",
      "Let one criticism stand without rebutting it.",
      "Name a person who helped, out loud, in front of others.",
      "Practise a hobby you are visibly bad at.",
    ],
    faq: [
      {
        q: "Does this mean I have narcissistic personality disorder?",
        a: "No. This is a trait score on a continuum, measured for self-reflection. NPD is a clinical diagnosis made by a professional, and no online test can produce one.",
      },
      {
        q: "Can narcissism be a strength?",
        a: "In the trait sense, yes — elevated self-concept correlates with leadership emergence, persistence and risk tolerance. The cost is feedback sensitivity.",
      },
      {
        q: "Which archetype balances it best?",
        a: "The Shadow Mirror. It supplies the self-audit that the Visionary skips.",
      },
    ],
    related: ["sovereign-manipulator", "shadow-mirror"],
    keywords: [
      "narcissistic visionary personality",
      "narcissism trait test",
      "visionary leader personality type",
    ],
  },
  "shadow-mirror": {
    key: "shadow-mirror",
    short: "Shadow Mirror",
    rarity: "≈ 16% of test takers",
    title: "The Shadow Mirror — Fully Aware of the Weapon You Are Carrying",
    description:
      "The Shadow Mirror archetype: peak shadow integration — dark instincts fully seen and consciously held. Traits, strengths, insight traps and the free Dark Personality test.",
    intro: [
      "The Shadow Mirror scores highest on Shadow Integration, the axis that measures how much of your own darker machinery you can look at without flinching. This profile has already met its capacity for manipulation, cruelty or withdrawal — and kept the knowledge.",
      "That awareness makes Shadow Mirrors unusually honest, extremely hard to manipulate, and unusually tired. They cannot use the shortcut without noticing they used it.",
    ],
    signs: [
      "You can describe your worst impulse accurately and calmly.",
      "Flattery does not work on you; you can see the mechanism.",
      "You catch yourself mid-pattern more often than you break it.",
      "You are drawn to people who tell you uncomfortable truths.",
      "You find performative goodness harder to tolerate than open selfishness.",
      "You have apologised for something nobody else noticed.",
    ],
    strengths: [
      "Near-immunity to manipulation and social pressure",
      "Highest self-honesty of any profile in the model",
      "Trusted with information other people cannot hold",
      "Rarely surprised by their own behaviour",
    ],
    risks: [
      "Confusing insight with change — knowing the pattern is not interrupting it",
      "Over-disclosure that burdens the listener",
      "Cynicism about people who have not looked at themselves",
      "Analysis used as a substitute for action",
    ],
    relationships:
      "Deeply honest, sometimes exhaustingly so. Shadow Mirrors describe their flaws so precisely that partners assume the flaws are handled. The growth edge is behavioural: one changed action beats ten accurate descriptions.",
    career:
      "Writing, therapy, research, ethics and compliance, senior advisory roles. Struggles in cultures that require enthusiastic pretence.",
    growth: [
      "Convert one insight into one small changed behaviour this week.",
      "Stop explaining a flaw and just stop doing it once.",
      "Notice when self-criticism is buying you an exemption.",
      "Give someone credit for growth you cannot yet verify.",
    ],
    faq: [
      {
        q: "Is Shadow Mirror the 'best' result?",
        a: "There is no best archetype. High shadow integration correlates with self-honesty, but it does not guarantee change and it carries its own trap: analysis replacing action.",
      },
      {
        q: "How is shadow integration measured?",
        a: "Through items about self-recognition of darker motives, tolerance for uncomfortable feedback, and consistency between stated values and admitted behaviour — with reverse-scored and attention-check items to catch inflated self-reporting.",
      },
      {
        q: "Which archetype is its opposite?",
        a: "The Nihilistic Sovereign, which scores negatively on shadow integration.",
      },
    ],
    related: ["dark-empath", "velvet-ghost"],
    keywords: [
      "shadow integration test",
      "shadow work personality type",
      "self awareness dark traits",
    ],
  },
  "nihilistic-sovereign": {
    key: "nihilistic-sovereign",
    short: "Nihilistic Sovereign",
    rarity: "≈ 10% of test takers",
    title: "The Nihilistic Sovereign — Free Because Nothing Has Authority Over You",
    description:
      "The Nihilistic Sovereign archetype: high psychopathy and narcissism with low shadow integration. Traits, freedom, destructive risk and the free Dark Personality test.",
    intro: [
      "The Nihilistic Sovereign combines a high Psychopathy axis with elevated Narcissism, Detachment and notably low Shadow Integration. The defining conclusion of this profile is that most rules are agreements it was never asked about.",
      "That makes it unusually free, exceptionally capable in chaos and genuinely difficult to govern. It is also the profile most likely to break something valuable to prove that it could be broken.",
    ],
    signs: [
      "Authority has to earn your compliance every single time.",
      "You are calmest when the structure collapses.",
      "You have walked away from something stable with no plan.",
      "Guilt is a short-lived visitor.",
      "You test limits to see whether they were real.",
      "You would rather be free than approved of.",
    ],
    strengths: [
      "Highest crisis tolerance in the model",
      "Independent thinking, immune to consensus",
      "Willing to say the thing everyone is avoiding",
      "Rebuilds quickly after loss",
    ],
    risks: [
      "Burning something down for the pleasure of proving it burns",
      "Low shadow integration means the pattern repeats unseen",
      "Relationships treated as temporary by default",
      "Freedom that gradually becomes an absence of anything worth keeping",
    ],
    relationships:
      "Intense, honest and hard to hold. This archetype leaves before it can be left, and calls it clarity. The corrective is staying through one boring, unglamorous stretch of a relationship to find out what exists on the other side.",
    career:
      "Crisis response, turnaround work, independent trades, combat sport, entrepreneurship at the risk-tolerant end. Corrodes in bureaucratic or credentialist environments.",
    growth: [
      "Keep one commitment that has stopped being interesting.",
      "Ask what you were escaping the last three times you left.",
      "Write down the cost of the last thing you broke.",
      "Let someone hold you to a standard for 30 days.",
    ],
    faq: [
      {
        q: "Is this the darkest archetype?",
        a: "It scores highest on unconstrained traits with the lowest self-audit, so on paper yes — but the model measures freedom and rule-scepticism, not violence, and many people with this profile are simply unusually independent.",
      },
      {
        q: "Can this profile change?",
        a: "Yes, and the lever is shadow integration rather than restraint. Seeing the pattern is what turns impulse into choice.",
      },
      {
        q: "What is the closest archetype?",
        a: "The Stoic Predator — same composure and risk tolerance, but with far less appetite for destruction.",
      },
    ],
    related: ["stoic-predator", "machiavellian-architect"],
    keywords: [
      "nihilistic personality type",
      "rebellious dark personality test",
      "low agreeableness archetype",
    ],
  },
};

export type ArchetypePage = ArchetypeSeo & { archetype: PublicArchetype; path: string };

export const ARCHETYPE_PAGES: ArchetypePage[] = PUBLIC_ARCHETYPES.map((archetype) => ({
  ...ARCHETYPE_SEO[archetype.key],
  archetype,
  path: `/archetypes/${archetype.key}`,
}));

const BY_SLUG = new Map(ARCHETYPE_PAGES.map((page) => [page.key as string, page]));

export function archetypePageBySlug(slug: string): ArchetypePage | undefined {
  return BY_SLUG.get(slug);
}

/** Paths fed into the sitemap generator. */
export const ARCHETYPE_PATHS = ARCHETYPE_PAGES.map((page) => page.path);
