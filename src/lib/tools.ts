import {
  BrainCircuit,
  Flame,
  FolderDown,
  HeartCrack,
  HeartHandshake,
  VenetianMask,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import coverChildTrauma from "@/assets/cover-child-trauma.jpg.asset.json";
import coverIq from "@/assets/cover-iq.jpg.asset.json";
import coverDark from "@/assets/cover-dark-personality.jpg.asset.json";
import coverLove from "@/assets/cover-love-match.jpg.asset.json";
import coverRoast from "@/assets/cover-roast.jpg.asset.json";
import coverPrompt from "@/assets/cover-prompt-maker.jpg.asset.json";
import coverVault from "@/assets/cover-vault.jpg.asset.json";

export type ToolMeta = {
  slug: string;
  path: string;
  name: string;
  tagline: string;
  description: string;
  category: "Psyche" | "Cognition" | "Social" | "AI" | "Assets";
  keywords: string[];
  duration: string;
  icon: LucideIcon;
  /** Design-token reference used as --tool-accent for per-tool theming. */
  accent: string;
  highlights: [string, string, string];
  /** CDN cover art giving each tool its own visual identity. */
  cover: string;
  /** One-line promise shown under the cover on mobile cards. */
  promise: string;
  /** "What you'll get" facts rendered on the tool intro card. */
  facts: { steps: string; time: string; output: string };
  /** A teaser line that shows what the first screen feels like. */
  teaser: string;
  /** Slugs suggested after a result, to chain the session. */
  related: string[];
};

export const TOOLS: ToolMeta[] = [
  {
    slug: "child-trauma",
    path: "/tools/child-trauma",
    name: "Child Trauma Test",
    tagline: "Map the echoes you grew up with",
    description:
      "Eighteen randomised statements build a radar of six emotional dimensions, with a written reflection per band.",
    category: "Psyche",
    keywords: ["trauma", "childhood", "emotional", "reflection", "radar", "pdf"],
    duration: "~3 min",
    icon: HeartCrack,
    accent: "var(--chart-2)",
    highlights: ["6 emotional axes", "Fresh set each try", "HD share card"],
    cover: coverChildTrauma.url,
    promise: "See which childhood patterns still shape how you react today.",
    facts: { steps: "18 randomised questions", time: "about 3 minutes", output: "Radar + HD share card" },
    teaser: "“When plans changed suddenly at home, I usually…”",
    related: ["dark-personality", "love-match"],
  },
  {
    slug: "iq",
    path: "/tools/iq",
    name: "Quick IQ Test",
    tagline: "Twenty puzzles, twenty seconds each",
    description:
      "Twenty timed items across five reasoning categories, ending in a shareable cognitive performance certificate.",
    category: "Cognition",
    keywords: ["iq", "logic", "pattern", "math", "certificate", "timer"],
    duration: "~5 min",
    icon: BrainCircuit,
    accent: "var(--chart-4)",
    highlights: ["20 timed items", "Category breakdown", "PNG certificate"],
    cover: coverIq.url,
    promise: "Twenty timed puzzles, then a certificate with your score band.",
    facts: { steps: "20 items · 20s each", time: "about 5 minutes", output: "PNG certificate" },
    teaser: "“2, 6, 12, 20, 30, … what comes next?”",
    related: ["prompt-maker", "dark-personality"],
  },
  {
    slug: "dark-personality",
    path: "/tools/dark-personality",
    name: "Dark Personality Test",
    tagline: "Meet the archetype in your shadow",
    description:
      "Eighteen randomised statements score six psychometric axes to reveal one of eight dark archetypes and its edge.",
    category: "Psyche",
    keywords: ["dark", "personality", "machiavellian", "shadow", "archetype", "sliders"],
    duration: "~3 min",
    icon: VenetianMask,
    accent: "var(--chart-5)",
    highlights: ["6 psychometric axes", "8 archetypes", "VIP dossier"],
    cover: coverDark.url,
    promise: "Answer eighteen and meet the archetype hiding in your shadow.",
    facts: { steps: "18 randomised questions", time: "about 3 minutes", output: "Archetype share card" },
    teaser: "“I read the room before I say what I actually think.”",
    related: ["child-trauma", "roast"],
  },
  {
    slug: "love-match",
    path: "/tools/love-match",
    name: "Love & Vibe Matcher",
    tagline: "Five dimensions of real chemistry",
    description:
      "Fifteen randomised questions score banter, trust, adventure, calm and spark into a verdict card built for stories.",
    category: "Social",
    keywords: ["love", "match", "vibe", "compatibility", "names", "share"],
    duration: "~2 min",
    icon: HeartHandshake,
    accent: "var(--chart-3)",
    highlights: ["5 vibe dimensions", "Radar breakdown", "One-tap share"],
    cover: coverLove.url,
    promise: "Fifteen questions, one honest chemistry read — ready for stories.",
    facts: { steps: "15 questions", time: "about 2 minutes", output: "Score + share card" },
    teaser: "“We can turn a boring errand into a bit.”",
    related: ["dark-personality", "roast"],
  },
  {
    slug: "roast",
    path: "/tools/roast",
    name: "AI Roast Me",
    tagline: "Feed it your bio. Brace yourself.",
    description:
      "Streamed AI roasts at three intensities, rendered live in a terminal. Rate limited to keep it fair.",
    category: "AI",
    keywords: ["roast", "ai", "bio", "github", "savage", "terminal"],
    duration: "~30 sec",
    icon: Flame,
    accent: "var(--chart-1)",
    highlights: ["Live token stream", "3 intensities", "10 free per hour"],
    cover: coverRoast.url,
    promise: "Paste your bio and watch an AI take you apart, live, line by line.",
    facts: { steps: "1 bio · 3 intensities", time: "about 30 seconds", output: "Streamed roast" },
    teaser: "“$ roast --intensity brutal”",
    related: ["prompt-maker", "love-match"],
  },
  {
    slug: "prompt-maker",
    path: "/tools/prompt-maker",
    name: "AI Prompt Maker",
    tagline: "Compose model-ready prompt syntax",
    description:
      "Pick a target model, style and render stack, and get optimized copy-ready prompt strings instantly.",
    category: "AI",
    keywords: ["prompt", "midjourney", "flux", "chatgpt", "cyberpunk", "builder"],
    duration: "instant",
    icon: Wand2,
    accent: "var(--secondary)",
    highlights: ["Model-aware syntax", "Style presets", "Copy ready"],
    cover: coverPrompt.url,
    promise: "Build a Midjourney or Flux prompt that actually renders what you meant.",
    facts: { steps: "Pick model + style", time: "instant", output: "Copy-ready prompt" },
    teaser: "“cyberpunk portrait, volumetric rim light --ar 16:9”",
    related: ["roast", "iq"],
  },
  {
    slug: "this-or-that",
    path: "/tools/this-or-that",
    name: "This or That",
    tagline: "Twenty dilemmas, no middle ground",
    description:
      "Twenty forced-choice dilemmas score impulse, loyalty, risk and candour, then name the profile you actually decide with.",
    category: "Psyche",
    keywords: ["this or that", "would you rather", "choices", "decisions", "profile", "quiz"],
    duration: "~2 min",
    icon: VenetianMask,
    accent: "var(--chart-1)",
    highlights: ["20 forced choices", "4 decision axes", "Share card"],
    cover: coverDark.url,
    promise: "Pick one, twenty times, and meet the profile behind your choices.",
    facts: { steps: "20 forced choices", time: "about 2 minutes", output: "Profile + share card" },
    teaser: "“Book the trip tonight — or build the spreadsheet first?”",
    related: ["dark-personality", "love-match"],
  },
  {
    slug: "vault",
    path: "/vault",
    name: "Free Drive Vault",
    tagline: "UI kits, boilerplates, prompt packs",
    description:
      "A curated, always-free asset library: design systems, developer starters, AI prompt megapacks and reading notes.",
    category: "Assets",
    keywords: ["vault", "drive", "download", "ui kit", "boilerplate", "free", "assets"],
    duration: "browse",
    icon: FolderDown,
    accent: "var(--primary)",
    highlights: ["Curated assets", "Always free", "Direct Drive links"],
    cover: coverVault.url,
    promise: "Download UI kits, starters and prompt packs — free, no signup.",
    facts: { steps: "Browse by category", time: "as long as you like", output: "Direct downloads" },
    teaser: "“Glass UI Kit · 240 components · free”",
    related: ["prompt-maker", "iq"],
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

export function relatedTools(slug: string): ToolMeta[] {
  const tool = getTool(slug);
  if (!tool) return [];
  return tool.related
    .map((s) => getTool(s))
    .filter((t): t is ToolMeta => Boolean(t));
}

export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  return TOOLS.filter((tool) =>
    [tool.name, tool.tagline, tool.description, tool.category, ...tool.keywords]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}
