import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { ToolShell } from "@/components/layout/ToolShell";
import { useActionGate } from "@/components/monetization/ActionGate";

export const Route = createFileRoute("/tools/prompt-maker")({
  head: () => ({
    meta: [
      { title: "AI Prompt Maker — Build Midjourney, Flux & ChatGPT Prompts" },
      {
        name: "description",
        content:
          "Compose optimized, copy-ready prompt syntax for Midjourney v6, Flux and ChatGPT with style, lighting and render presets. Free, instant, client-side.",
      },
      { property: "og:title", content: "AI Prompt Maker — Senses of Void" },
      {
        property: "og:description",
        content: "Structured prompt builder for Midjourney v6, Flux and ChatGPT. Zero API cost.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PromptMaker,
});

const TARGETS = ["Midjourney v6", "Flux", "ChatGPT"] as const;
const QUALITY = ["8K", "4K", "HD", "photoreal"] as const;
const ENGINE = ["Unreal Engine 5", "Octane Render", "Blender Cycles", "none"] as const;
const STYLE = ["Cyberpunk", "Brutalist", "Ethereal", "Noir", "Retrofuturism"] as const;
const LIGHT = ["Cinematic Lighting", "Volumetric Fog", "Rim Light", "Golden Hour"] as const;
const RATIO = ["16:9", "1:1", "9:16", "3:2"] as const;

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  const id = `sel-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="label-mono mb-1.5 block">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-hairline bg-surface-2/70 px-3 py-2 text-sm text-foreground focus:border-primary/50"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function PromptMaker() {
  const [keyword, setKeyword] = useState("a lone monolith in a flooded city");
  const [target, setTarget] = useState<(typeof TARGETS)[number]>("Midjourney v6");
  const [quality, setQuality] = useState<(typeof QUALITY)[number]>("8K");
  const [engine, setEngine] = useState<(typeof ENGINE)[number]>("Unreal Engine 5");
  const [style, setStyle] = useState<(typeof STYLE)[number]>("Cyberpunk");
  const [light, setLight] = useState<(typeof LIGHT)[number]>("Cinematic Lighting");
  const [ratio, setRatio] = useState<(typeof RATIO)[number]>("16:9");

  const prompt = useMemo(() => {
    const subject = keyword.trim() || "an undefined subject";
    const parts = [subject, style, light, quality, engine !== "none" ? engine : null].filter(
      Boolean,
    ) as string[];

    if (target === "Midjourney v6") {
      return `${parts.join(", ")}, ultra detailed, sharp focus --ar ${ratio} --style raw --v 6.1`;
    }
    if (target === "Flux") {
      return `${parts.join(", ")}, high dynamic range, physically based materials, aspect ratio ${ratio}, guidance 3.5, 40 steps`;
    }
    return [
      `Act as a senior concept artist and art director.`,
      `Describe an image of ${subject} in vivid, concrete visual language.`,
      `Style: ${style}. Lighting: ${light}. Fidelity: ${quality}.`,
      engine !== "none" ? `Render as if produced in ${engine}.` : "",
      `Aspect ratio: ${ratio}. Return the description as one dense paragraph, no preamble.`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [keyword, target, quality, engine, style, light, ratio]);

  const runGated = useActionGate();

  const copy = async () => {
    await runGated({ toolSlug: "prompt-maker" });
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied to clipboard.");
    } catch {
      toast.error("Clipboard blocked — select the text and copy manually.");
    }
  };

  return (
    <ToolShell
      eyebrow="Tool 06 · AI"
      slug="prompt-maker"
      title="AI Prompt Maker"
      intro="Pick a target model and stack your modifiers. Everything is composed in your browser, so it is instant and costs nothing."
    >
      <div className="glass rounded-xl p-5">
        <label htmlFor="keyword" className="label-mono mb-1.5 block">
          Subject / keyword
        </label>
        <input
          id="keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="a lone monolith in a flooded city"
          className="w-full rounded-lg border border-hairline bg-surface-2/70 px-3 py-2.5 text-sm focus:border-primary/50"
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Select label="Target model" value={target} options={TARGETS} onChange={setTarget} />
          <Select label="Style" value={style} options={STYLE} onChange={setStyle} />
          <Select label="Lighting" value={light} options={LIGHT} onChange={setLight} />
          <Select label="Fidelity" value={quality} options={QUALITY} onChange={setQuality} />
          <Select label="Render engine" value={engine} options={ENGINE} onChange={setEngine} />
          <Select label="Aspect ratio" value={ratio} options={RATIO} onChange={setRatio} />
        </div>
      </div>

      <div className="glass mt-6 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="label-mono flex items-center gap-2">
            <Wand2 className="size-3.5 text-primary" aria-hidden="true" /> generated prompt
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Copy className="size-3.5" aria-hidden="true" /> Copy
          </button>
        </div>
        <pre className="mt-4 max-h-72 overflow-auto rounded-lg border border-hairline bg-background/60 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-foreground">
          {prompt}
        </pre>
      </div>
    </ToolShell>
  );
}
