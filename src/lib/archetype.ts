/**
 * Six-axis shadow scoring → one of eight core archetypes, plus every piece of
 * text the VIP dossier renders. Pure data + pure functions: no React, no DOM,
 * so both the result page and the PDF exporter read from the same source.
 */

import { bandOf, type Band } from "@/lib/quiz-engine";
import { DARK_DIMS, type DarkDim } from "@/lib/banks/dark";

export type AxisScore = { dim: string; value: number };

export type ArchetypeKey =
  | "sovereign-manipulator"
  | "velvet-ghost"
  | "machiavellian-architect"
  | "dark-empath"
  | "stoic-predator"
  | "narcissistic-visionary"
  | "shadow-mirror"
  | "nihilistic-sovereign";

export type Archetype = {
  key: ArchetypeKey;
  name: string;
  tagline: string;
  blurb: string;
  edge: string;
  /** Signed affinity weights per axis; the highest weighted score wins. */
  weights: Partial<Record<DarkDim, number>>;
  pressure: string;
  betrayal: string;
  romance: string;
  /** Deep analysis paragraphs — the spine of the 1,500+ word VIP report. */
  analysis: string[];
  mastery: string[];
  /** Relationship module (post-purchase $9 Shadow Matrix add-on). */
  matrix: {
    attracts: string;
    destroys: string;
    triggers: string[];
    defense: string[];
    compatible: string[];
    volatile: string[];
  };
};

export const ARCHETYPES: Archetype[] = [
  {
    key: "sovereign-manipulator",
    name: "The Sovereign Manipulator",
    tagline: "Command disguised as generosity",
    blurb:
      "You do not ask for power, you arrange the conditions under which it is handed to you. People leave your conversations feeling they chose something you had already decided.",
    edge: "Your risk is winning so quietly that nobody, including you, can tell what you actually wanted.",
    weights: { Machiavellianism: 1.35, Narcissism: 1, Cognition: 0.6, Detachment: 0.3, Psychopathy: 0.2 },
    pressure:
      "Under extreme pressure you get warmer, not colder. Charm becomes the instrument: you widen your circle of obligations until someone else's resources absorb the shock.",
    betrayal:
      "Betrayal is not answered, it is repriced. You keep the relationship functionally alive while quietly removing every dependency the other person had on you.",
    romance:
      "You court by making someone feel uniquely legible. The danger arrives later, when your partner realises they cannot tell which parts of the intimacy were engineered.",
    analysis: [
      "Your profile is dominated by strategic calculation running on top of a high-voltage ego. That combination produces an unusually stable operator: you are not impulsive, you are positional. Where most people experience a conversation as an exchange of feelings, you experience it as a sequence of moves with a cost attached to each one. You are rarely the loudest person in a room because volume is a bad trade — it spends credibility that quieter framing would keep in reserve.",
      "The engine underneath is a need for confirmed superiority that you are too sophisticated to state out loud. You convert that need into service. You become the person who solves things, connects people, remembers details, absorbs other people's chaos. Each act of usefulness is real, and each one also creates a small, unspoken account balance in your favour. Over years this compounds into what looks from the outside like effortless influence and feels from the inside like carrying an entire social system on your back.",
      "Your empathy is functional rather than absent. You read emotion with precision, which is exactly why you can move it. That is the most misunderstood part of your type: you are not cold, you are instrumentally warm. The moral question in your life is never whether you can feel what someone else feels — it is whether you will let their feeling change your plan once you have already priced it in.",
      "Your primary blind spot is the invisible ledger. Because you never name the debt, other people never agree to it, and you end up resentful about obligations they never accepted. The second blind spot is the gap between the version of you that manages the room and the version that goes home. When those two drift far enough apart, you lose the ability to be comforted, because comfort requires being seen without a strategy in play.",
      "Your defence mechanisms are pre-emptive generosity, controlled disclosure and strategic retreat. You give first, so nobody can demand. You tell nine true things so the tenth stays private. And when a situation becomes genuinely unmanageable, you disappear from it with a plausible reason rather than admit you were overwhelmed. None of these are pathologies; they are extremely effective tactics with a maintenance cost you usually pay alone.",
    ],
    mastery: [
      "Name one debt out loud per week. Converting a silent ledger entry into an explicit ask kills the resentment loop before it starts.",
      "Keep one relationship with zero strategy in it. No positioning, no management. It is the only reliable way to keep your baseline calibrated.",
      "Before any big move, write the sentence you would say if you had to be direct instead of elegant. If the direct version is stronger, use it.",
      "Watch for over-engineering: when three moves would do and you have planned seven, you are managing anxiety, not the situation.",
    ],
    matrix: {
      attracts:
        "You attract people who are tired of being misread. Your accuracy about them feels like intimacy long before intimacy exists.",
      destroys:
        "You break relationships by administrating them. The moment your partner senses management instead of mutuality, trust converts into surveillance.",
      triggers: [
        "Being handled by someone using your own techniques on you.",
        "Public correction from a person you consider less capable.",
        "Being told you are calculating — because the accusation is close enough to hurt.",
      ],
      defense: [
        "When triggered, you extend warmth to buy time. Notice the reflex and delay your response by an hour instead.",
        "Replace 'I'll handle it' with 'here is what I need' at least once a conflict.",
        "If you are rehearsing a conversation more than twice, the issue is your need for a guaranteed outcome, not their behaviour.",
      ],
      compatible: ["The Dark Empath", "The Shadow Mirror", "The Narcissistic Visionary"],
      volatile: ["The Stoic Predator", "The Nihilistic Sovereign"],
    },
  },
  {
    key: "velvet-ghost",
    name: "The Velvet Ghost",
    tagline: "Present, warm, and completely unreachable",
    blurb:
      "You are remembered as an atmosphere rather than a set of facts. People feel close to you and later cannot name a single thing you disclosed.",
    edge: "Your risk is mistaking distance for peace and calling an empty room freedom.",
    weights: { Detachment: 1.4, Machiavellianism: 0.7, Cognition: 0.5, Psychopathy: 0.4, Narcissism: -0.2 },
    pressure:
      "Under pressure you go quiet and elegant. You keep functioning at a high level while withdrawing every emotional signal, so nobody realises you are in crisis until it is already resolved or already over.",
    betrayal:
      "You do not confront betrayal, you evaporate from it. The other person keeps talking to a version of you that has already left the building.",
    romance:
      "You are magnetic early because you give attention without demanding it. The rupture comes when your partner asks for access rather than affection and finds a door with no handle.",
    analysis: [
      "Your defining structure is a vulnerability shield operated with unusual finesse. Most guarded people are visibly guarded; you are not. You are soft, attentive, generous with interest and almost impossible to pin down. The shield is not built from hostility, it is built from aperture control: you decide, continuously and mostly unconsciously, exactly how much of you enters the room.",
      "This developed as an efficiency. Somewhere early, being fully legible cost you something — leverage, safety, dignity — and you learned that partial presence produces most of the benefits of connection with a fraction of the exposure. It works. It works so well that it is now automatic, which is the actual problem: a shield you cannot lower is not protection, it is architecture.",
      "Your strategic layer is quiet but real. You know who is safe, who is useful and who is neither, and you route information accordingly. People rarely feel manipulated by you because you take nothing loudly. What you take is optionality — the ability to leave any situation without it costing you a narrative.",
      "Blind spots: you interpret other people's requests for closeness as demands for control, which lets you exit before anything can actually be negotiated. And because you rarely state a need, you accumulate an unspoken list of ways people failed to guess it. From the inside this feels like patience. From the outside it looks like a sudden, unexplained ending.",
      "Defence mechanisms: aesthetic distance (turning feeling into observation), pre-emptive exit, and warmth-as-camouflage. You will comfort someone else all night rather than say one true sentence about yourself, and you will genuinely enjoy doing it, which is how the pattern keeps renewing itself.",
    ],
    mastery: [
      "Disclose one uncomfortable, unflattering true thing per week to one person. Not a confession — a data point.",
      "When you feel the exit reflex, say 'I need a day' instead of taking it silently. Announced distance is not abandonment.",
      "Track the gap: how long between feeling something and anyone knowing? Shorten it by a single step, not to zero.",
      "Ask directly for one thing you would normally hope someone notices.",
    ],
    matrix: {
      attracts:
        "You attract intense, curious people who read your restraint as depth and want to be the exception that gets inside.",
      destroys:
        "You end things by attrition, not conflict. Your partner ends up performing louder and louder to get a reaction and eventually leaves exhausted.",
      triggers: [
        "Being asked to explain a feeling in real time.",
        "Someone announcing they 'know you' with confidence.",
        "Emotional escalation that makes leaving look cruel.",
      ],
      defense: [
        "Name the shield when it rises: 'I'm closing, give me an hour.' That single sentence prevents most breakups your type has.",
        "Do not use logistics as an emotional exit. Busyness is your most convincing lie.",
        "Choose partners who can tolerate silence without reading abandonment into it.",
      ],
      compatible: ["The Machiavellian Architect", "The Shadow Mirror", "The Stoic Predator"],
      volatile: ["The Narcissistic Visionary", "The Sovereign Manipulator"],
    },
  },
  {
    key: "machiavellian-architect",
    name: "The Machiavellian Architect",
    tagline: "Systems where other people see situations",
    blurb:
      "You do not argue, you redesign the frame until the argument becomes unnecessary. Most of your wins were decided weeks before anyone noticed a contest.",
    edge: "Your risk is treating people as variables long after they became friends.",
    weights: { Cognition: 1.3, Machiavellianism: 1.2, Detachment: 0.5, Narcissism: 0.3 },
    pressure:
      "Pressure makes you more systematic. You escalate into planning: contingencies, sequences, fallbacks. You are dangerous in a crisis and unbearable in an argument about feelings.",
    betrayal:
      "You audit. You reconstruct the timeline, find the exact decision point, and revise your model of the person permanently and without drama.",
    romance:
      "You love by optimising someone's life. The failure mode is solving problems your partner wanted witnessed, not fixed.",
    analysis: [
      "Your dominant axis is intellectual control paired with strategic calculation — the rarest and most operationally powerful of the shadow combinations. You do not experience the world as events; you experience it as mechanisms with inputs, delays and failure modes. This gives you an unusual ability to be calm in situations that terrify competent people, because you have already simulated the bad branch.",
      "Control, for you, is not domination. It is the elimination of dependency on other people's thinking. You would rather own the whole task than inherit someone else's error, which makes you both the most reliable person in any system and the most structurally lonely one. The load never distributes, because distributing it requires accepting a lower standard for a while.",
      "Your manipulation, where it exists, is definitional rather than emotional. You do not lie about facts; you choose which facts are relevant, set the sequence in which they are considered, and let the conclusion arrive on its own. People rarely feel pushed by you, which is exactly why the influence is so durable.",
      "Blind spots: you mistake being correct for being persuasive, and you underestimate how much a decision's legitimacy depends on people feeling consulted rather than routed. You also confuse emotional processing with inefficiency — so you deliver the right answer twenty minutes before anyone can hear it, then conclude they are irrational.",
      "Defence mechanisms: intellectualisation, contingency hoarding and unilateral competence. When something hurts, you convert it into a design problem. When you are anxious, you build a second plan you do not tell anyone about. When you are hurt, you quietly become self-sufficient in that specific area and never mention it again.",
    ],
    mastery: [
      "Say the feeling before the solution. One sentence. Then solve.",
      "Ship the 80% version to a person you trust; let them touch it. Distributed load is a skill, not a compromise.",
      "When you have a secret plan B, tell someone. A hidden contingency is a hidden exit.",
      "Ask 'do you want help or company?' before intervening. It resolves half of your relational friction.",
    ],
    matrix: {
      attracts:
        "You attract people who feel chaotic and want a structure to lean into. Your competence reads as safety.",
      destroys:
        "You collapse relationships by turning them into projects. Being improved feels, over time, exactly like being insufficient.",
      triggers: [
        "Being managed emotionally instead of answered directly.",
        "Decisions made without the information you were holding.",
        "Being told your logic is 'cold' when you were being careful.",
      ],
      defense: [
        "Refuse to argue the frame for the first five minutes. Just receive the complaint.",
        "Do not present analysis as reassurance. They are not the same currency.",
        "Schedule unstructured time with your partner where no problem is allowed to be solved.",
      ],
      compatible: ["The Dark Empath", "The Velvet Ghost", "The Shadow Mirror"],
      volatile: ["The Narcissistic Visionary", "The Nihilistic Sovereign"],
    },
  },
  {
    key: "dark-empath",
    name: "The Dark Empath",
    tagline: "Full-spectrum empathy with a strategic mind behind it",
    blurb:
      "You feel everything in the room and understand precisely what could be done with it. That is a rare and heavy combination: the accuracy of a manipulator with the conscience of someone who cannot un-feel the cost.",
    edge: "Your risk is exhaustion — you carry other people's states and audit your own motives at the same time.",
    weights: { Shadow: 1.2, Machiavellianism: 0.9, Cognition: 0.8, Psychopathy: -0.9, Detachment: -0.2 },
    pressure:
      "Under pressure you over-attune. You start managing everyone's emotional weather and lose track of your own position until the pressure is over and you crash.",
    betrayal:
      "You understand the betrayal from the other side, in detail, and that understanding is its own wound. You forgive far too fast intellectually and far too slowly in the body.",
    romance:
      "You are an extraordinary partner and a self-erasing one. You know what your partner needs before they ask, and you can go years without stating a need of your own.",
    analysis: [
      "Your profile shows something unusual: high awareness of your own dark instincts alongside genuine emotional resonance and a strategic mind. You have the manipulator's toolkit and you refuse to use most of it, which is a moral achievement almost nobody around you sees, because they only ever meet the restraint.",
      "This is why your type is so often mistaken for softness. You are not soft. You know exactly which sentence would end an argument by damaging someone, and you decline to say it. That declining is effortful. It costs you, repeatedly, in situations where a colder person would simply take the win.",
      "Your emotional accuracy is your leverage and your leak. Because you feel the other person's state, you absorb responsibility for it, which means you negotiate against yourself. You will accept a worse outcome to spare someone a bad ten minutes, then privately resent a fairness nobody was ever asked to provide.",
      "Blind spots: you interpret your own needs as impositions, and you use insight as a substitute for boundaries — understanding why someone treats you badly becomes the reason you keep tolerating it. You also mistake your restraint for invisibility, assuming others see the version of the conflict you are being generous about.",
      "Defence mechanisms: reframing (making their behaviour make sense so it stops hurting), caretaking (staying useful so you cannot be discarded) and self-audit spirals (turning conflict into an investigation of your own motives). The last one is the most expensive: it looks like humility and functions like self-erasure.",
    ],
    mastery: [
      "State the need before the reason. 'I need X' first; justification only if asked.",
      "When you catch yourself explaining someone's cruelty, stop and describe the behaviour in one flat sentence instead.",
      "Budget your empathy like a resource with a daily cap. It is not infinite and pretending it is makes you unreliable later.",
      "Practice keeping a fair win. Do not hand back an advantage just to relieve someone's discomfort.",
    ],
    matrix: {
      attracts:
        "You attract intense people, including takers, because your attention is unusually high quality and freely given.",
      destroys:
        "You break relationships by finally, suddenly leaving — after years in which you never once said clearly that something was wrong.",
      triggers: [
        "Being called manipulative when you were being careful.",
        "Someone dismissing a feeling you named at great cost.",
        "Being needed by two people at once with no exit.",
      ],
      defense: [
        "Say the hard sentence within 48 hours, not after 8 months of accommodation.",
        "Screen for reciprocity early: does this person ever ask what you need, unprompted?",
        "Insight is not a boundary. Understanding the reason does not obligate you to absorb the cost.",
      ],
      compatible: ["The Machiavellian Architect", "The Shadow Mirror", "The Sovereign Manipulator"],
      volatile: ["The Nihilistic Sovereign", "The Stoic Predator"],
    },
  },
  {
    key: "stoic-predator",
    name: "The Stoic Predator",
    tagline: "Still water, decided in advance",
    blurb:
      "You are calm in the exact places other people panic, and you act while they are still processing. Nothing about you looks aggressive until the moment it is already done.",
    edge: "Your risk is calling numbness discipline, and paying for it years later in the body.",
    weights: { Psychopathy: 1.3, Detachment: 1, Cognition: 0.6, Shadow: 0.2, Narcissism: -0.1 },
    pressure:
      "Pressure is where you are best. Heart rate flat, options ranked, decision made. You will do the necessary thing while everyone else is still negotiating with reality.",
    betrayal:
      "You cut, once, cleanly, and do not revisit it. The relationship is not punished, it is simply ended and archived.",
    romance:
      "You are steady, unshockable and hard to reach. Partners feel safe with you and starved by you in the same month.",
    analysis: [
      "Your dominant axes are cold empathy and vulnerability shielding — a nervous system that decouples decision from distress. This is not an absence of feeling; it is a delay. Emotion arrives after the action, quietly, often days later and usually attributed to something else.",
      "Operationally this makes you formidable. You tolerate risk that would immobilise other people, you can hold a boundary without needing it validated, and you are almost impossible to destabilise through social pressure. In crisis you are the person everyone quietly hopes is in the room.",
      "The cost is calibration. Because distress signals are muted, you routinely discover you were badly overdrawn only after the damage is structural — burnout, a dead relationship, a body that starts sending bills. You did not ignore the warnings; you genuinely did not receive them at normal volume.",
      "Blind spots: you assume other people are choosing to be overwhelmed, since you are not. And you mistake your own low reactivity for a complete emotional read of a situation, which is why you can end something important with a clarity you later cannot reconstruct.",
      "Defence mechanisms: clean severance, tactical silence and physical outlet. When something threatens the interior, you remove it entirely rather than renegotiate. When you are hurt, you say less, not more. And you discharge what you cannot name into training, work or risk — which works, until the outlet is unavailable.",
    ],
    mastery: [
      "Delay severance by 72 hours. Your cuts are correct maybe two thirds of the time; the delay recovers the other third.",
      "Install external instruments: sleep, resting heart rate, one honest friend. You cannot self-report load reliably.",
      "Say one sentence about impact rather than one about the decision. 'That mattered to me' is more effective than any explanation.",
      "Treat other people's slower processing as physics, not weakness.",
    ],
    matrix: {
      attracts:
        "You attract people who want an anchor. Your stillness reads as certainty and, to anxious partners, as home.",
      destroys:
        "You end relationships in a single conversation the other person did not know was on the calendar.",
      triggers: [
        "Emotional escalation aimed at forcing a reaction.",
        "Being managed, monitored or checked up on.",
        "Loss of autonomy over your own time.",
      ],
      defense: [
        "Announce the shutdown instead of executing it: 'I'm going flat, this isn't disinterest.'",
        "Give one piece of interior per week, unprompted, even if it feels pointless.",
        "Choose partners who do not require constant emotional confirmation to feel secure.",
      ],
      compatible: ["The Velvet Ghost", "The Machiavellian Architect", "The Nihilistic Sovereign"],
      volatile: ["The Narcissistic Visionary", "The Dark Empath"],
    },
  },
  {
    key: "narcissistic-visionary",
    name: "The Narcissistic Visionary",
    tagline: "A future so vivid the present looks like scaffolding",
    blurb:
      "You are always building the next version of yourself, and everyone near you gets recruited into it. Your certainty is contagious, and it is genuinely productive — until it is asked to bend.",
    edge: "Your risk is arriving somewhere excellent and refusing to notice.",
    weights: { Narcissism: 1.45, Cognition: 0.7, Machiavellianism: 0.4, Detachment: -0.2 },
    pressure:
      "Pressure makes you bigger. You escalate the vision, raise the stakes and pull people forward — brilliant when the plan is right, catastrophic when it needs revising.",
    betrayal:
      "Betrayal registers as insult before injury. Your first instinct is to succeed loudly enough that the betrayal becomes a footnote in your story.",
    romance:
      "You love expansively and interpret your partner's needs through your trajectory. Devotion is real; the difficulty is that the mission never pauses.",
    analysis: [
      "Ego and grandiosity dominate your profile, supported by real cognitive horsepower. This is the engine of most visible achievement in the world: a self-concept that runs ahead of current evidence and then drags reality up to meet it. You are not deluded — you are pre-committed, and the commitment does a great deal of the work.",
      "Your relationship with recognition is more complex than the label suggests. You do not simply want applause; you want confirmation that the internal projection is real. Applause is the only external instrument you trust for that, which makes praise addictive and its absence destabilising in a way you would rather not discuss.",
      "You energise systems. People perform above their baseline near you because you narrate a future in which their contribution matters. This is genuine leadership, and it is also a mechanism: the vision requires participants, and participants require a story about themselves inside it.",
      "Blind spots: you cannot easily tell the difference between a plan being criticised and you being diminished, so useful correction gets filtered out as disloyalty. And you systematically undercount the maintenance labour other people do to keep your momentum possible.",
      "Defence mechanisms: escalation (when doubted, aim higher), narrative repair (rewriting a setback into a chapter) and selective audience (keeping close only people who reflect the projection back). All three protect the engine and slowly starve you of the correction that would make it accurate.",
    ],
    mastery: [
      "Institutionalise one critic: one person whose job is to tell you the plan is wrong, with the standing to be heard.",
      "Separate 'the idea is flawed' from 'I am flawed' explicitly, out loud, in the moment.",
      "Log arrivals. Write down what you achieved and stop for 24 hours before starting the next thing.",
      "Name the maintenance work others do for you, by name, in public. It costs nothing and buys years of loyalty.",
    ],
    matrix: {
      attracts:
        "You attract people who want to be part of something larger. Your certainty gives them permission to be ambitious.",
      destroys:
        "You lose partners to chronic secondariness — never a fight, just a decade of the mission winning.",
      triggers: [
        "Being unimpressive in front of people whose opinion you rate.",
        "A partner's need arriving at a moment of momentum.",
        "Someone reframing your ambition as ego.",
      ],
      defense: [
        "When insulted, wait an hour before responding. Your first move is always scale, and scale is rarely the fix.",
        "Ask 'what did this cost you?' once a week and hold silence for the answer.",
        "Book non-negotiable time that the mission is not allowed to touch.",
      ],
      compatible: ["The Dark Empath", "The Sovereign Manipulator", "The Shadow Mirror"],
      volatile: ["The Stoic Predator", "The Velvet Ghost", "The Machiavellian Architect"],
    },
  },
  {
    key: "shadow-mirror",
    name: "The Shadow Mirror",
    tagline: "Fully aware of the weapon you are carrying",
    blurb:
      "You have looked directly at your own darker instincts and kept the knowledge. That awareness makes you unusually honest, unusually hard to manipulate, and unusually tired.",
    edge: "Your risk is confusing insight with change — knowing the pattern is not the same as interrupting it.",
    weights: { Shadow: 1.5, Cognition: 0.6, Detachment: 0.3, Machiavellianism: 0.2 },
    pressure:
      "Under pressure you narrate. You observe yourself in real time, which slows the panic and can also delay action past the point where action mattered.",
    betrayal:
      "You see your own contribution to it immediately, sometimes too generously. The wound is real but it is filed inside a fair account of both sides.",
    romance:
      "You are honest to a degree most people are not prepared for. Partners feel unusually safe with you and occasionally over-exposed by your accuracy.",
    analysis: [
      "Shadow integration is the leading axis of your profile: you have unusual conscious access to your own dark instincts. Most people run their manipulation, ego and coldness automatically and explain it afterwards. You watch it happen, in the moment, and know what it is called. That is genuinely rare, and it changes the ethics of every other axis you carry.",
      "The practical effect is that you are very hard to run a play on. You recognise techniques because you own them. Flattery lands and you notice it landing. Guilt arrives and you can see the shape of it. This makes you a poor target and an excellent witness, and it is why people bring you their real problems rather than the presentable versions.",
      "The cost is friction and fatigue. Self-observation consumes bandwidth. You cannot enjoy simple things simply; there is always a second track running commentary. And because you refuse to flatter yourself, you can sit with a clear-eyed account of your own worst behaviour for years without it converting into different behaviour.",
      "Blind spots: you over-credit awareness. Naming a pattern feels like handling it, and it is not — the pattern needs a mechanical interruption, not a better description. You also use fairness against yourself, granting other people's motives a generosity you never extend to your own.",
      "Defence mechanisms: pre-emptive confession (disclosing the flaw before anyone can use it), meta-analysis (moving into observer position when feeling gets close) and radical fairness (dissolving a legitimate grievance by understanding it from every side until nothing is left to demand).",
    ],
    mastery: [
      "Convert one insight into one mechanical rule this month — a rule you could break visibly. Insight alone changes nothing.",
      "Ban 'I know, I know' from your own mouth for a week. Answer with what you will do instead.",
      "When you go into observer mode mid-conflict, say so and come back into the conversation.",
      "Extend to yourself the exact generosity you extend to the person who hurt you.",
    ],
    matrix: {
      attracts:
        "You attract people looking for someone who will not flinch. Your honesty is a relief in a world of performance.",
      destroys:
        "You harm relationships by being right about your partner out loud, too early, with too much precision.",
      triggers: [
        "Someone performing an emotion you can see through.",
        "Being flattered by a person who wants something.",
        "Being told you overthink, when the thinking is what keeps you honest.",
      ],
      defense: [
        "Hold accurate observations for 24 hours before delivering them. Accuracy is not consent.",
        "Do not confess flaws pre-emptively to defuse conflict; it moves the conversation onto your terms unfairly.",
        "Choose partners who can hear the truth without needing you to soften it into fiction.",
      ],
      compatible: ["The Dark Empath", "The Machiavellian Architect", "The Velvet Ghost"],
      volatile: ["The Narcissistic Visionary", "The Nihilistic Sovereign"],
    },
  },
  {
    key: "nihilistic-sovereign",
    name: "The Nihilistic Sovereign",
    tagline: "Free because nothing has authority over you",
    blurb:
      "You have quietly concluded that most rules are agreements you were never asked about. That makes you unusually free, unusually capable in chaos, and genuinely hard to govern.",
    edge: "Your risk is burning something down for the pleasure of proving it could burn.",
    weights: { Psychopathy: 1.2, Narcissism: 0.7, Detachment: 0.7, Shadow: -0.6, Cognition: 0.3 },
    pressure:
      "Pressure liberates you. Constraints fall away and you act with a speed and disregard that looks like courage from outside and feels like clarity from inside.",
    betrayal:
      "You answer betrayal decisively and disproportionately, and you rarely regret it in the moment. The bill arrives much later, in the shape of an empty network.",
    romance:
      "You are electric, present and unpredictable. Intensity is easy for you; continuity is the hard problem.",
    analysis: [
      "Your profile combines risk tolerance and muted guilt with a strong self-concept and a low score on shadow integration. The result is unusual autonomy: you are not constrained by rules you did not consent to, and you are not slowed by the anticipatory anxiety that governs most people's decisions. This is real power. It is also the least self-correcting configuration on the map.",
      "You are excellent in environments where consequences are fast, visible and personal — crisis, competition, anything requiring someone to move first. You are poorest in environments where the cost of an action is delayed and lands mostly on other people, because that is precisely the feedback your system does not register at full volume.",
      "The low integration score is the operative variable here, not the coldness. A high-risk operator who watches himself is dangerous to opponents. A high-risk operator who does not is dangerous to himself. Most of the damage in your history was not caused by an enemy; it was caused by a decision that felt obvious for about ninety seconds.",
      "Blind spots: you read escalation as strength and repair as submission, so you win exchanges and lose networks. And you attribute your isolation to other people's inability to handle you, which is comfortable and prevents the one adjustment that would change your trajectory.",
      "Defence mechanisms: contempt (pre-emptively devaluing what could reject you), scorched exit (making return impossible so ambivalence cannot torture you) and stimulation-seeking (replacing the discomfort of stillness with intensity that requires no interior work).",
    ],
    mastery: [
      "Install a hard 24-hour delay on any irreversible decision. This one rule changes more outcomes than any insight will.",
      "Repair one bridge you burned. Not to be liked — to prove to yourself that reversal is available.",
      "Track cost in relationships and years, not in the moment. Your instrument for the immediate is excellent and for the delayed is broken.",
      "Find one person authorised to say 'this is the pattern' whom you have decided in advance not to dismiss.",
    ],
    matrix: {
      attracts:
        "You attract people who feel caged. Your disregard for rules gives them a temporary taste of freedom.",
      destroys:
        "You end relationships in flames, usually over something the other person considered survivable.",
      triggers: [
        "Being told what to do by an institution or a partner.",
        "Predictability that feels like a slow death.",
        "Any hint of being controlled through affection.",
      ],
      defense: [
        "When you feel the urge to detonate, name the constraint you are actually reacting to. It is almost never the person in front of you.",
        "Trade intensity for continuity once per week, deliberately: the boring version of the evening.",
        "Choose partners who set limits calmly. Anxious limits will make you escalate.",
      ],
      compatible: ["The Stoic Predator", "The Velvet Ghost"],
      volatile: ["The Dark Empath", "The Shadow Mirror", "The Machiavellian Architect"],
    },
  },
];

const BY_KEY = new Map(ARCHETYPES.map((a) => [a.key, a]));

export function archetypeByKey(key: ArchetypeKey): Archetype {
  return BY_KEY.get(key) ?? ARCHETYPES[0]!;
}

/** Axis-level breakdown text: what the band means, the blind spot, the defence. */
export const AXIS_DETAIL: Record<
  DarkDim,
  {
    label: string;
    meaning: string;
    bands: Record<Band, string>;
    blindSpot: string;
    defense: string;
  }
> = {
  Machiavellianism: {
    label: "Machiavellianism",
    meaning: "Strategic calculation and willingness to shape other people's decisions.",
    bands: {
      High: "You plan people the way others plan projects. Conversations are positional, and you rarely enter one without knowing what you want out of it.",
      Moderate:
        "You are strategic when the stakes justify it and straightforward when they do not — a flexible, low-cost setting.",
      Low: "You operate face-up. You lose some positional advantage and gain a reputation that needs no maintenance.",
    },
    blindSpot:
      "The invisible ledger: debts you never state and therefore can never collect, only resent.",
    defense: "Pre-emptive generosity and controlled disclosure — giving first so nothing can be demanded.",
  },
  Narcissism: {
    label: "Narcissism",
    meaning: "Ego intensity, grandiosity and the need for confirmed superiority.",
    bands: {
      High: "Your self-concept runs ahead of the evidence and then pulls reality forward. It is productive fuel with a high sensitivity to being diminished.",
      Moderate:
        "You want to be excellent without requiring an audience for it. Criticism lands but does not restructure you.",
      Low: "Status is genuinely not the currency you trade in, which frees you and occasionally leaves you under-claimed.",
    },
    blindSpot: "Reading criticism of a plan as an attack on your worth, and filtering it out as disloyalty.",
    defense: "Escalation and narrative repair — aiming higher when doubted, rewriting setbacks into chapters.",
  },
  Psychopathy: {
    label: "Psychopathy",
    meaning: "Cold empathy under pressure and tolerance for risk and consequence.",
    bands: {
      High: "Decisions decouple from distress. You act while others process, and the emotional bill arrives days later, if at all.",
      Moderate:
        "You can be hard when it is required and still feel the weight of it afterwards — the most functional setting on this axis.",
      Low: "Other people's distress reaches you at full volume, which makes you humane and slow to do necessary damage.",
    },
    blindSpot: "Assuming your low reactivity means you have read the situation completely.",
    defense: "Clean severance — removing what threatens the interior instead of renegotiating it.",
  },
  Detachment: {
    label: "Emotional Detachment",
    meaning: "The vulnerability shield: how much of you any person is allowed to see.",
    bands: {
      High: "You control the aperture continuously. People feel close to you and cannot name what you disclosed.",
      Moderate: "You open selectively and close cleanly. Access is a decision, not a reflex.",
      Low: "You are legible. It costs you leverage and buys you the kind of intimacy the guarded rarely reach.",
    },
    blindSpot: "Hearing a request for closeness as a demand for control, then exiting before anything is negotiated.",
    defense: "Warmth as camouflage and pre-emptive exit — leaving with a plausible reason instead of admitting overwhelm.",
  },
  Cognition: {
    label: "Cognitive Dominance",
    meaning: "Control of the frame: definitions, sequence, contingency and the second plan.",
    bands: {
      High: "You win by owning the question. You are calm in crises because you already simulated the bad branch.",
      Moderate: "You think ahead without needing to run the room. You can be led by a better argument.",
      Low: "You stay in the present tense, which keeps you responsive and leaves the frame to whoever sets it.",
    },
    blindSpot: "Mistaking being correct for being persuasive, and treating emotional processing as inefficiency.",
    defense: "Intellectualisation and contingency hoarding — converting hurt into a design problem, building a hidden plan B.",
  },
  Shadow: {
    label: "Shadow Integration",
    meaning: "Conscious access to your own dark instincts — a weapon you carry versus one that carries you.",
    bands: {
      High: "You watch your own manipulation, ego and coldness as they happen and know their names. Hard to run a play on.",
      Moderate: "You recognise the pattern afterwards, usually accurately, occasionally too late to change the move.",
      Low: "Your darker instincts operate automatically and get explained after the fact — the highest-risk setting on the map.",
    },
    blindSpot: "Over-crediting awareness: naming a pattern feels like handling it, and it is not.",
    defense: "Meta-analysis and pre-emptive confession — moving to observer position, disclosing the flaw before it can be used.",
  },
};


/**
 * Score-driven paragraphs: written from the actual axis spread rather than the
 * archetype alone, so two people with the same archetype still get a different
 * report. These are what push the analysis past 1,500 words.
 */
export function contextualParagraphs(
  axes: { dim: DarkDim | string; label: string; value: number; band: Band }[],
  archetype: Archetype,
): string[] {
  const top = axes[0]!;
  const second = axes[1]!;
  const low = axes[axes.length - 1]!;
  const shadow = axes.find((a) => a.dim === "Shadow")!;
  const spread = top.value - low.value;

  return [
    `Your leading axis is ${top.label} at ${top.value}/100, supported by ${second.label} at ${second.value}. That pairing is the operational core of ${archetype.name}: the first axis decides what you reach for automatically, the second decides how you execute it once the first has committed you. In practice this means your instincts arrive before your reasoning does, and your reasoning is then extremely good at building a defensible case for whatever the instinct already chose. This is not a flaw — it is how high-functioning people move quickly — but it means the quality of your life depends almost entirely on how well-calibrated that first reflex is.`,
    `Your lowest axis is ${low.label} at ${low.value}/100, and the ${spread}-point spread between your highest and lowest axis matters more than either number alone. A wide spread produces a specialist: you are formidable inside the situations your top axes were built for and disproportionately clumsy outside them. A narrow spread produces an all-rounder who is rarely dominant and rarely helpless. Yours reads as ${spread >= 45 ? "a pronounced specialist profile, which means your failures will not be gradual — they will happen suddenly, in the one register you never developed" : spread >= 25 ? "a moderately specialised profile: strong preferences, but with enough range to improvise when your first strategy is blocked" : "an unusually balanced profile, which makes you adaptable and means your growth comes from committing harder rather than broadening further"}.`,
    `Shadow integration sits at ${shadow.value}/100 (${shadow.band}), and this is the variable that determines whether the rest of the profile is an asset or a liability. ${shadow.band === "High" ? "Because your awareness is high, your darker capacities are under conscious management. You can see the move as you make it, which means you get to choose. The cost is fatigue and a certain inability to enjoy yourself without commentary." : shadow.band === "Moderate" ? "You catch yourself after the fact more often than during. That is the most common configuration and the most improvable one: the gap between the impulse and the recognition is where all your available growth lives." : "Your darker instincts currently run without supervision and get explained afterwards. This is the single highest-leverage thing you could change, because every other axis in your profile becomes safer the moment it is observed."}`,
    `Long term, the trajectory of this profile depends on one trade. The strategies that produced your strengths were adaptive at some point — they solved a real problem, probably early, probably at a cost. They are still running now, in contexts that no longer require them. Maturity for your type is not becoming a different person; it is keeping the capability and retiring the automaticity. You should be able to run every move in ${archetype.name}'s repertoire on purpose, and be able to not run it when the situation does not call for it. That single degree of freedom is the difference between someone who is powerful and someone who is simply consistent.`,
    `The way you handle being seen accurately is diagnostic. Most people with your configuration have been described correctly at least once by someone who was not being kind about it, and the reaction to that moment tends to split into two habits: either you absorbed it and quietly used it, or you decided the person was hostile and filed them away. If you are honest about which one you did, you already know where your ceiling currently is. ${archetype.name} does not fail from lack of ability; it fails from an information problem it created itself, by making candour expensive for the people closest to it. The practical fix is unglamorous — pick one person, remove the penalty for telling you the truth, and then actually do not penalise them the first three times they use it.`,
    `Finally, consider the cost accounting. Every axis you score high on is buying you something real and charging you for it in a currency you may not be tracking: time, sleep, sincerity, or the number of relationships in which you can be unimpressive without panic. Write down what your top two axes have earned you in the last year and what they have cost, in those units, and the profile stops being a personality description and becomes a decision. That is the only use of a report like this. The archetype is not a verdict on who you are; it is an accurate description of the strategy you are currently running, and strategies are the one thing about a person that can be changed on purpose.`,
  ];
}

/** Clamp any raw axis value into the deterministic 0–100 report range. */
function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Normalise raw axis scores and pick the winning archetype by weighted affinity.
 *
 * Deterministic by construction: the axis vector is always the full six axes in
 * canonical order, values are clamped to 0–100, and both the axis ranking and
 * the archetype ranking break ties by declaration order — so the same answers
 * always produce the same archetype, and every valid answer set produces one.
 */
export function resolveArchetype(scores: AxisScore[]): {
  archetype: Archetype;
  runnerUp: Archetype;
  intensity: number;
  dominant: string;
  support: string;
  ordered: AxisScore[];
} {
  const byDim = new Map(scores.map((s) => [s.dim, s.value]));
  // Always score all six axes: a missing axis reads as 0 rather than vanishing,
  // so the affinity maths can never be computed over a short vector.
  const axes: AxisScore[] = DARK_DIMS.map((dim) => ({ dim, value: clamp(byDim.get(dim) ?? 0) }));
  // Ties broken by the canonical axis order so the ranking is deterministic.
  const ordered = [...axes].sort(
    (a, b) => b.value - a.value || DARK_DIMS.indexOf(a.dim as DarkDim) - DARK_DIMS.indexOf(b.dim as DarkDim),
  );
  const intensity = Math.round(axes.reduce((a, b) => a + b.value, 0) / axes.length);

  const ranked = ARCHETYPES.map((archetype, index) => {
    let total = 0;
    for (const dim of DARK_DIMS) {
      const weight = archetype.weights[dim] ?? 0;
      const value = axes.find((a) => a.dim === dim)!.value;
      // A negative weight scores the *absence* of the axis, and is applied once.
      total += weight * (weight < 0 ? 100 - value : value);
    }
    return { archetype, total, index };
  }).sort((a, b) => b.total - a.total || a.index - b.index);

  return {
    archetype: ranked[0]!.archetype,
    runnerUp: ranked[1]!.archetype,
    intensity,
    dominant: ordered[0]?.dim ?? "Machiavellianism",
    support: ordered[1]?.dim ?? "Cognition",
    ordered,
  };
}

/** Full dossier text, assembled from archetype content plus per-axis bands. */
export function buildDossier(scores: AxisScore[]) {
  const resolved = resolveArchetype(scores);
  const axes = DARK_DIMS.map((dim) => {
    // Read the normalised vector, not the raw input, so the dossier, the radar
    // and the archetype maths can never disagree.
    const value = resolved.ordered.find((s) => s.dim === dim)?.value ?? 0;
    const detail = AXIS_DETAIL[dim];
    return {
      dim,
      label: detail.label,
      value,
      band: bandOf(value),
      meaning: detail.meaning,
      reading: detail.bands[bandOf(value)],
      blindSpot: detail.blindSpot,
      defense: detail.defense,
    };
  }).sort((a, b) => b.value - a.value);

  const context = contextualParagraphs(axes, resolved.archetype);

  const words =
    resolved.archetype.analysis.join(" ").split(/\s+/).length +
    axes.map((a) => `${a.meaning} ${a.reading} ${a.blindSpot} ${a.defense}`).join(" ").split(/\s+/).length +
    resolved.archetype.mastery.join(" ").split(/\s+/).length +
    context.join(" ").split(/\s+/).length +
    [resolved.archetype.pressure, resolved.archetype.betrayal, resolved.archetype.romance, resolved.runnerUp.blurb]
      .join(" ")
      .split(/\s+/).length;

  return { ...resolved, axes, context, words };
}

export type Dossier = ReturnType<typeof buildDossier>;
