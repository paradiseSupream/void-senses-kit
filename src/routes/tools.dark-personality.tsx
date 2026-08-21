import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Ghost } from "lucide-react";
import { toast } from "sonner";

import { ToolShell } from "@/components/layout/ToolShell";
import { useActionGate } from "@/components/monetization/ActionGate";
import { drawBrandedCard, downloadCanvas } from "@/lib/canvas-card";

export const Route = createFileRoute("/tools/dark-personality")({
  head: () => ({
    meta: [
      { title: "Dark Personality Test — Find Your Shadow Archetype" },
      {
        name: "description",
        content:
          "Eight sliders weigh strategy, detachment, ambition and control to reveal your dominant shadow archetype, with a one-click shareable card.",
      },
      { property: "og:title", content: "Dark Personality Test — Senses of Void" },
      {
        property: "og:description",
        content:
          "Mastermind, Phantom, Architect or Ghost? Eight sliders, one archetype. For entertainment only.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DarkPersonality,
});

type Axis = "strategy" | "detachment" | "ambition" | "control";

const ITEMS: { id: string; label: string; hint: string; axis: Axis }[] = [
  {
    id: "q1",
    label: "I read the room for leverage before I speak.",
    hint: "never · always",
    axis: "strategy",
  },
  { id: "q2", label: "Plans matter more to me than moods.", hint: "never · always", axis: "strategy" },
  {
    id: "q3",
    label: "I can watch drama unfold without feeling pulled in.",
    hint: "never · always",
    axis: "detachment",
  },
  {
    id: "q4",
    label: "I keep parts of myself deliberately unreadable.",
    hint: "never · always",
    axis: "detachment",
  },
  {
    id: "q5",
    label: "Being the most capable person present matters to me.",
    hint: "never · always",
    axis: "ambition",
  },
  {
    id: "q6",
    label: "I would trade comfort now for status later.",
    hint: "never · always",
    axis: "ambition",
  },
  {
    id: "q7",
    label: "I dislike outcomes that depend on other people.",
    hint: "never · always",
    axis: "control",
  },
  {
    id: "q8",
    label: "I quietly steer group decisions toward my preference.",
    hint: "never · always",
    axis: "control",
  },
];

const ARCHETYPES: Record<
  string,
  { name: string; blurb: string }
> = {
  strategy: {
    name: "The Mastermind",
    blurb:
      "You treat social life as a system with inputs and outputs. Patient, calculating, three moves ahead — and rarely surprised.",
  },
  detachment: {
    name: "The Phantom",
    blurb:
      "You move through rooms without leaving fingerprints. Emotion is information to you, not weather. People remember the impression, not the details.",
  },
  ambition: {
    name: "The Architect",
    blurb:
      "You build toward a version of yourself that does not exist yet. Comfort is a currency you spend freely on altitude.",
  },
  control: {
    name: "The Ghost",
    blurb:
      "You would rather steer invisibly than lead loudly. Predictability is your form of safety, and you engineer it constantly.",
  },
};

function DarkPersonality() {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(ITEMS.map((i) => [i.id, 50])),
  );
  const runGated = useActionGate();

  const result = useMemo(() => {
    const axes: Record<Axis, number[]> = { strategy: [], detachment: [], ambition: [], control: [] };
    ITEMS.forEach((item) => axes[item.axis].push(values[item.id] ?? 50));
    const scores = Object.entries(axes).map(([axis, list]) => ({
      axis: axis as Axis,
      score: Math.round(list.reduce((a, b) => a + b, 0) / list.length),
    }));
    const top = [...scores].sort((a, b) => b.score - a.score)[0]!;
    const intensity = Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length);
    return { scores, top, intensity, archetype: ARCHETYPES[top.axis]! };
  }, [values]);

  const share = async () => {
    await runGated();
    const canvas = drawBrandedCard({
      eyebrow: "Dark Personality Test",
      title: "Shadow archetype",
      headline: result.archetype.name,
      lines: [
        result.archetype.blurb,
        `Shadow intensity: ${result.intensity}/100 · dominant axis: ${result.top.axis}`,
      ],
    });
    downloadCanvas(canvas, "senses-of-void-shadow-archetype.png");
    toast.success("Share card downloaded.");
  };

  return (
    <ToolShell
      eyebrow="Tool 03 · Psyche"
      slug="dark-personality"
      title="Dark Personality Test"
      intro="Eight statements, eight sliders. Move each one to how true it feels, then read the archetype your answers lean toward."
    >
      <div className="glass rounded-xl p-5">
        <ul className="space-y-6">
          {ITEMS.map((item, index) => (
            <li key={item.id}>
              <label htmlFor={item.id} className="block text-sm text-foreground">
                <span className="label-mono mr-2">{String(index + 1).padStart(2, "0")}</span>
                {item.label}
              </label>
              <input
                id={item.id}
                type="range"
                min={0}
                max={100}
                step={1}
                value={values[item.id] ?? 50}
                aria-valuetext={`${values[item.id] ?? 50} out of 100`}
                onChange={(e) => setValues((v) => ({ ...v, [item.id]: Number(e.target.value) }))}
                className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-primary"
                style={{
                  background: `linear-gradient(to right, var(--primary) ${values[item.id] ?? 50}%, var(--surface-2) ${values[item.id] ?? 50}%)`,
                }}
              />
              <div className="mt-1 flex justify-between">
                <span className="label-mono">{item.hint}</span>
                <span className="font-mono text-xs text-primary">{values[item.id] ?? 50}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass mt-6 rounded-xl p-6">
        <span className="label-mono flex items-center gap-2">
          <Ghost className="size-3.5 text-secondary" aria-hidden="true" /> live result
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold text-primary">
          {result.archetype.name}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{result.archetype.blurb}</p>

        <ul className="mt-6 space-y-3">
          {result.scores.map((s) => (
            <li key={s.axis}>
              <div className="flex justify-between text-sm capitalize">
                <span className="text-foreground">{s.axis}</span>
                <span className="font-mono text-muted-foreground">{s.score}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                  style={{ width: `${s.score}%` }}
                />
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={share}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Download className="size-4" aria-hidden="true" /> Generate Shareable Card
        </button>
      </div>
    </ToolShell>
  );
}
