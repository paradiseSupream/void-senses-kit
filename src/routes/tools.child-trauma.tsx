import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { ToolShell } from "@/components/layout/ToolShell";
import { useActionGate } from "@/components/monetization/ActionGate";

export const Route = createFileRoute("/tools/child-trauma")({
  head: () => ({
    meta: [
      { title: "Child Trauma Test — Reflective Emotional Radar" },
      {
        name: "description",
        content:
          "Ten scenario questions build a radar of six emotional dimensions with a written reflection and a downloadable PDF report. For self-reflection only.",
      },
      { property: "og:title", content: "Child Trauma Test — Senses of Void" },
      {
        property: "og:description",
        content:
          "A reflective questionnaire mapping six emotional dimensions, with a PDF report. Not a clinical assessment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChildTrauma,
});

type Dim = "Safety" | "Trust" | "Voice" | "Attachment" | "Self-worth" | "Regulation";

const DIMS: Dim[] = ["Safety", "Trust", "Voice", "Attachment", "Self-worth", "Regulation"];

type Q = { id: string; text: string; dim: Dim; options: { label: string; weight: number }[] };

const SCALE = [
  { label: "Almost never", weight: 0 },
  { label: "Sometimes", weight: 1 },
  { label: "Often", weight: 2 },
  { label: "Almost always", weight: 3 },
];

const QUESTIONS: Q[] = [
  { id: "q1", text: "As a child, when the house got loud, I knew I would still be okay.", dim: "Safety", options: SCALE },
  { id: "q2", text: "I could predict how the adults around me would react to bad news.", dim: "Safety", options: SCALE },
  { id: "q3", text: "When I told someone a secret, it stayed a secret.", dim: "Trust", options: SCALE },
  { id: "q4", text: "Promises made to me were usually kept.", dim: "Trust", options: SCALE },
  { id: "q5", text: "Disagreeing with an adult felt safe to do out loud.", dim: "Voice", options: SCALE },
  { id: "q6", text: "My preferences changed what actually happened at home.", dim: "Voice", options: SCALE },
  { id: "q7", text: "There was at least one person I could go to without warning.", dim: "Attachment", options: SCALE },
  { id: "q8", text: "Being comforted felt natural rather than awkward.", dim: "Attachment", options: SCALE },
  { id: "q9", text: "I believed I was worth someone's time even when I failed.", dim: "Self-worth", options: SCALE },
  { id: "q10", text: "When I got upset, I could come back down on my own.", dim: "Regulation", options: SCALE },
];

function ChildTrauma() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const runGated = useActionGate();

  const scores = useMemo(() => {
    const buckets: Record<Dim, number[]> = {
      Safety: [],
      Trust: [],
      Voice: [],
      Attachment: [],
      "Self-worth": [],
      Regulation: [],
    };
    QUESTIONS.forEach((q) => {
      const value = answers[q.id];
      if (value !== undefined) buckets[q.dim].push(Math.round((value / 3) * 100));
    });
    return DIMS.map((dim) => ({
      dim,
      value: buckets[dim].length
        ? Math.round(buckets[dim].reduce((a, b) => a + b, 0) / buckets[dim].length)
        : 0,
    }));
  }, [answers]);

  const overall = Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length);
  const lowest = [...scores].sort((a, b) => a.value - b.value)[0]!;
  const highest = [...scores].sort((a, b) => b.value - a.value)[0]!;

  const summary = useMemo(() => {
    const band =
      overall >= 70
        ? "Your answers describe a childhood that mostly felt predictable and responsive."
        : overall >= 45
          ? "Your answers describe a mixed childhood: dependable in some areas, unreliable in others."
          : "Your answers describe a childhood where dependability was scarce and self-reliance came early.";
    return [
      band,
      `${highest.dim} scores highest at ${highest.value}, which usually shows up today as the area where you extend trust most easily.`,
      `${lowest.dim} scores lowest at ${lowest.value}. In adult life this often looks like over-preparing, delayed vulnerability, or discomfort when things feel too calm.`,
      "None of this is a diagnosis. It is a mirror for reflection — a starting point for a conversation, journalling, or simply noticing your own patterns.",
    ];
  }, [overall, highest, lowest]);

  const exportPdf = async () => {
    await runGated();
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const width = doc.internal.pageSize.getWidth();

    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, width, doc.internal.pageSize.getHeight(), "F");
    doc.setTextColor(250, 250, 250);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Senses of Void", 48, 64);
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text("Child Trauma Test — Reflection Report", 48, 92);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(161, 161, 170);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 48, 112);

    doc.setFontSize(12);
    doc.setTextColor(250, 250, 250);
    doc.text(`Overall responsiveness index: ${overall}/100`, 48, 148);

    let y = 178;
    scores.forEach((s) => {
      doc.setTextColor(212, 212, 216);
      doc.text(`${s.dim}`, 48, y);
      doc.setTextColor(161, 161, 170);
      doc.text(`${s.value}`, 200, y);
      doc.setFillColor(39, 39, 42);
      doc.rect(230, y - 8, 280, 8, "F");
      doc.setFillColor(16, 185, 129);
      doc.rect(230, y - 8, (280 * s.value) / 100, 8, "F");
      y += 26;
    });

    y += 12;
    doc.setTextColor(250, 250, 250);
    doc.setFont("helvetica", "bold");
    doc.text("Written analysis", 48, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(212, 212, 216);
    doc.setFontSize(11);
    y += 20;
    summary.forEach((paragraph) => {
      const lines = doc.splitTextToSize(paragraph, width - 96) as string[];
      doc.text(lines, 48, y);
      y += lines.length * 15 + 10;
    });

    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text(
      "For entertainment and self-reflection only, not clinical psychological or medical assessment. sensesofvoid.app",
      48,
      doc.internal.pageSize.getHeight() - 40,
    );

    doc.save("senses-of-void-reflection-report.pdf");
    toast.success("Report downloaded.");
  };

  if (!done) {
    const q = QUESTIONS[step]!;
    return (
      <ToolShell
        eyebrow="Tool 01 · Psyche"
        slug="child-trauma"
        title="Child Trauma Test"
        intro="Ten short scenarios. Answer with your first instinct — there is no scoring against anyone else."
      >
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <span className="label-mono">
              Step {step + 1} of {QUESTIONS.length}
            </span>
            <span className="label-mono">{q.dim}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${((step + (answers[q.id] !== undefined ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <h2 className="mt-6 font-display text-xl leading-snug font-semibold">{q.text}</h2>

          <fieldset className="mt-5">
            <legend className="sr-only">{q.text}</legend>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.weight;
                return (
                  <label
                    key={opt.label}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm transition-colors ${
                      selected
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-hairline bg-surface-2/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.weight}
                      checked={selected}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt.weight }))}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`grid size-4 shrink-0 place-items-center rounded-full border transition-colors ${
                        selected ? "border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
                    </span>
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-full border border-hairline px-4 py-2 text-sm text-foreground disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={answers[q.id] === undefined}
              onClick={() => (step === QUESTIONS.length - 1 ? setDone(true) : setStep((s) => s + 1))}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {step === QUESTIONS.length - 1 ? "See results" : "Next"}
            </button>
          </div>
        </div>
        <QuizVipNudge step={step} total={QUESTIONS.length} />
      </ToolShell>

    );
  }

  return (
    <ToolShell
      eyebrow="Tool 01 · Psyche"
      slug="child-trauma"
      title="Your emotional radar"
      intro="Six dimensions, scored from your answers. Higher means the dimension felt more dependable growing up."
    >
      <div className="glass rounded-xl p-6">
        <Radar scores={scores} />
        <p className="mt-4 text-center font-display text-2xl font-bold text-primary">
          {overall}/100 overall
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {scores.map((s) => (
            <div
              key={s.dim}
              className="flex items-center justify-between rounded-lg border border-hairline bg-surface-2/50 px-3 py-2"
            >
              <span className="text-sm text-foreground">{s.dim}</span>
              <span className="font-mono text-sm text-primary">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass mt-6 space-y-3 rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold">Written analysis</h2>
        {summary.map((p) => (
          <p key={p} className="text-sm leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <FileDown className="size-4" aria-hidden="true" /> Download Analysis Report (PDF)
        </button>
        <button
          type="button"
          onClick={() => {
            setAnswers({});
            setStep(0);
            setDone(false);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" /> Retake
        </button>
      </div>
    </ToolShell>
  );
}

function Radar({ scores }: { scores: { dim: string; value: number }[] }) {
  const size = 320;
  const c = size / 2;
  const r = c - 46;
  const points = scores.map((s, i) => {
    const angle = (Math.PI * 2 * i) / scores.length - Math.PI / 2;
    const radius = (s.value / 100) * r;
    return {
      x: c + Math.cos(angle) * radius,
      y: c + Math.sin(angle) * radius,
      lx: c + Math.cos(angle) * (r + 24),
      ly: c + Math.sin(angle) * (r + 24),
      label: s.dim,
    };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto h-auto w-full max-w-sm"
      role="img"
      aria-label={scores.map((s) => `${s.dim} ${s.value}`).join(", ")}
    >
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <circle
          key={ring}
          cx={c}
          cy={c}
          r={r * ring}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
        />
      ))}
      {points.map((p) => (
        <line key={p.label} x1={c} y1={c} x2={p.lx} y2={p.ly} stroke="var(--border)" strokeWidth="1" />
      ))}
      <path d={path} fill="color-mix(in oklab, var(--primary) 25%, transparent)" stroke="var(--primary)" strokeWidth="2" />
      {points.map((p) => (
        <circle key={`${p.label}-dot`} cx={p.x} cy={p.y} r="3.5" fill="var(--primary)" />
      ))}
      {points.map((p) => (
        <text
          key={`${p.label}-label`}
          x={p.lx}
          y={p.ly}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--muted-foreground)"
          fontSize="10"
          fontFamily="var(--font-mono)"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
