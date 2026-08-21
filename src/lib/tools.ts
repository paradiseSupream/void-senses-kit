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
};

export const TOOLS: ToolMeta[] = [
  {
    slug: "child-trauma",
    path: "/tools/child-trauma",
    name: "Child Trauma Test",
    tagline: "Map the echoes you grew up with",
    description:
      "Ten scenario questions build a radar of six emotional dimensions, with a written reflection and a downloadable report.",
    category: "Psyche",
    keywords: ["trauma", "childhood", "emotional", "reflection", "radar", "pdf"],
    duration: "~4 min",
    icon: HeartCrack,
    accent: "var(--chart-2)",
    highlights: ["6 emotional axes", "Radar visual", "PDF report"],
  },
  {
    slug: "iq",
    path: "/tools/iq",
    name: "Quick IQ Test",
    tagline: "Fifteen puzzles, fifteen seconds each",
    description:
      "Timed pattern recognition and numeric reasoning, ending in a shareable cognitive performance certificate.",
    category: "Cognition",
    keywords: ["iq", "logic", "pattern", "math", "certificate", "timer"],
    duration: "~4 min",
    icon: BrainCircuit,
    accent: "var(--chart-4)",
    highlights: ["15 timed items", "Percentile band", "PNG certificate"],
  },
  {
    slug: "dark-personality",
    path: "/tools/dark-personality",
    name: "Dark Personality Test",
    tagline: "Meet the archetype in your shadow",
    description:
      "Eight sliders weigh strategy, detachment, ambition and control to reveal your dominant shadow archetype.",
    category: "Psyche",
    keywords: ["dark", "personality", "machiavellian", "shadow", "archetype", "sliders"],
    duration: "~2 min",
    icon: VenetianMask,
    accent: "var(--chart-5)",
    highlights: ["8 calibrated sliders", "12 archetypes", "Share card"],
  },
  {
    slug: "love-match",
    path: "/tools/love-match",
    name: "Love & Vibe Matcher",
    tagline: "Deterministic chemistry, zero guesswork",
    description:
      "Two names in, one stable synergy score out — same inputs always give the same reading, ready to copy to stories.",
    category: "Social",
    keywords: ["love", "match", "vibe", "compatibility", "names", "share"],
    duration: "~1 min",
    icon: HeartHandshake,
    accent: "var(--chart-3)",
    highlights: ["Deterministic score", "Vibe breakdown", "One-tap copy"],
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
  },
];

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
