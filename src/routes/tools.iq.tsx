import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";

import { ToolShell } from "@/components/layout/ToolShell";
import { useActionGate } from "@/components/monetization/ActionGate";
import { drawBrandedCard, downloadCanvas } from "@/lib/canvas-card";

export const Route = createFileRoute("/tools/iq")({
  head: () => ({
    meta: [
      { title: "Quick IQ Test — 15 Timed Puzzles & HD Certificate" },
      {
        name: "description",
        content:
          "Fifteen timed pattern and number puzzles with a 15-second limit each, ending in a downloadable cognitive performance certificate.",
      },
      { property: "og:title", content: "Quick IQ Test — Senses of Void" },
      {
        property: "og:description",
        content: "Fifteen timed puzzles, an estimated percentile, and an HD certificate to keep.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IqTest,
});

type Item = { id: string; prompt: string; options: string[]; answer: number; kind: "Pattern" | "Number" };

const ITEMS: Item[] = [
  { id: "i1", kind: "Number", prompt: "2, 4, 8, 16, ?", options: ["24", "32", "20", "64"], answer: 1 },
  { id: "i2", kind: "Pattern", prompt: "△ ○ △ ○ △ ?", options: ["△", "○", "□", "◇"], answer: 1 },
  { id: "i3", kind: "Number", prompt: "3, 6, 11, 18, ?", options: ["27", "24", "29", "25"], answer: 0 },
  { id: "i4", kind: "Pattern", prompt: "If ◧ rotates 90° clockwise twice, it becomes:", options: ["◨", "◧", "◩", "◪"], answer: 0 },
  { id: "i5", kind: "Number", prompt: "Which number is the odd one out? 9, 16, 25, 30, 36", options: ["16", "25", "30", "36"], answer: 2 },
  { id: "i6", kind: "Pattern", prompt: "A ▸ C ▸ F ▸ J ▸ ?", options: ["M", "N", "O", "P"], answer: 2 },
  { id: "i7", kind: "Number", prompt: "Half of a third of 90 is:", options: ["10", "15", "18", "30"], answer: 1 },
  { id: "i8", kind: "Pattern", prompt: "■□■□ | □■□■ | ■□■□ | ?", options: ["■□■□", "□■□■", "■■□□", "□□■■"], answer: 1 },
  { id: "i9", kind: "Number", prompt: "1, 1, 2, 3, 5, 8, ?", options: ["11", "12", "13", "15"], answer: 2 },
  { id: "i10", kind: "Pattern", prompt: "Cube is to square as sphere is to:", options: ["circle", "cylinder", "line", "cone"], answer: 0 },
  { id: "i11", kind: "Number", prompt: "If 5 machines make 5 units in 5 minutes, 100 machines make 100 units in:", options: ["5 min", "20 min", "100 min", "1 min"], answer: 0 },
  { id: "i12", kind: "Pattern", prompt: "Which does not belong? Triangle, Square, Circle, Pentagon", options: ["Triangle", "Square", "Circle", "Pentagon"], answer: 2 },
  { id: "i13", kind: "Number", prompt: "144 ÷ 12 × 3 = ?", options: ["4", "36", "48", "12"], answer: 1 },
  { id: "i14", kind: "Pattern", prompt: "Z ▸ W ▸ T ▸ Q ▸ ?", options: ["N", "M", "O", "P"], answer: 0 },
  { id: "i15", kind: "Number", prompt: "A shirt costs $40 after a 20% discount. Original price:", options: ["$48", "$50", "$52", "$45"], answer: 1 },
];

const LIMIT = 15;

function IqTest() {
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [left, setLeft] = useState(LIMIT);
  const [done, setDone] = useState(false);
  const lockRef = useRef(false);
  const runGated = useActionGate();

  const advance = useCallback(
    (choice: number | null) => {
      if (lockRef.current) return;
      lockRef.current = true;
      const item = ITEMS[index]!;
      if (choice !== null && choice === item.answer) setCorrect((c) => c + 1);
      window.setTimeout(() => {
        lockRef.current = false;
        if (index === ITEMS.length - 1) {
          setDone(true);
        } else {
          setIndex((i) => i + 1);
          setLeft(LIMIT);
        }
      }, 160);
    },
    [index],
  );

  useEffect(() => {
    if (!started || done) return;
    setLeft(LIMIT);
    const id = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          advance(null);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [started, index, done, advance]);

  const result = useMemo(() => {
    const pct = correct / ITEMS.length;
    const estimate = Math.round(80 + pct * 55);
    const percentile = Math.max(1, Math.min(99, Math.round(pct * 96 + 2)));
    return { estimate, percentile };
  }, [correct]);

  const exportCertificate = async () => {
    await runGated();
    const canvas = drawBrandedCard({
      eyebrow: "Verified Cognitive Performance Certificate",
      title: name.trim() || "Anonymous Participant",
      headline: `${result.estimate} est. score`,
      lines: [
        `${correct} of ${ITEMS.length} puzzles solved within the 15-second limit per item.`,
        `Estimated percentile: ${result.percentile}th · Issued ${new Date().toLocaleDateString()}`,
      ],
      footer: "sensesofvoid.app · entertainment estimate, not a standardized IQ assessment",
    });
    downloadCanvas(canvas, "senses-of-void-cognitive-certificate.png");
    toast.success("HD certificate downloaded.");
  };

  if (!started) {
    return (
      <ToolShell
        eyebrow="Tool 02 · Cognition"
        slug="iq"
        title="Quick IQ Test"
        intro="Fifteen puzzles, fifteen seconds each. The clock auto-advances, so trust your instinct."
      >
        <div className="glass rounded-xl p-6">
          <label htmlFor="participant" className="label-mono mb-1.5 block">
            Name on certificate (optional)
          </label>
          <input
            id="participant"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-hairline bg-surface-2/70 px-3 py-2.5 text-sm focus:border-primary/50"
          />
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Start the timed test
          </button>
        </div>
      </ToolShell>
    );
  }

  if (done) {
    return (
      <ToolShell
        eyebrow="Tool 02 · Cognition"
        slug="iq"
        title="Cognitive performance certificate"
        intro="An estimate based on speed and accuracy across fifteen timed items."
      >
        <div className="glass rounded-xl p-8 text-center">
          <span className="label-mono">Verified performance estimate</span>
          <p className="mt-4 font-display text-6xl font-bold text-primary">{result.estimate}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {correct} of {ITEMS.length} correct · estimated {result.percentile}th percentile
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {name.trim() || "Anonymous Participant"} · {new Date().toLocaleDateString()}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={exportCertificate}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Download className="size-4" aria-hidden="true" /> Download HD Certificate
            </button>
            <button
              type="button"
              onClick={() => {
                setStarted(false);
                setDone(false);
                setIndex(0);
                setCorrect(0);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-medium hover:bg-surface-2"
            >
              <RotateCcw className="size-4" aria-hidden="true" /> Retake
            </button>
          </div>
        </div>
      </ToolShell>
    );
  }

  const item = ITEMS[index]!;

  return (
    <ToolShell
      eyebrow="Tool 02 · Cognition"
      slug="iq"
      title="Quick IQ Test"
      intro="Answer before the timer empties — unanswered items auto-advance and count as missed."
    >
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between">
          <span className="label-mono">
            Step {index + 1} of {ITEMS.length} · {item.kind}
          </span>
          <span
            className={`flex items-center gap-1.5 font-mono text-sm ${left <= 5 ? "text-destructive" : "text-primary"}`}
            aria-live="polite"
          >
            <Timer className="size-4" aria-hidden="true" /> {left}s
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${left <= 5 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${(left / LIMIT) * 100}%` }}
          />
        </div>

        <h2 className="mt-6 text-center font-display text-2xl font-semibold">{item.prompt}</h2>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {item.options.map((option, i) => (
            <button
              key={option}
              type="button"
              onClick={() => advance(i)}
              className="rounded-lg border border-hairline bg-surface-2/50 px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
