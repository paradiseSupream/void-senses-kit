import {
  Cpu,
  Download,
  Fingerprint,
  Gauge,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

import { TOOLS } from "@/lib/tools";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Answer",
    body: "One plain question per screen, randomised every run.",
  },
  { icon: Timer, title: "2–5 minutes", body: "Scored on your device the moment you finish." },
  { icon: Download, title: "Visual report", body: "Radar map, score bands and an HD share card." },
];

const FACTS = [
  { icon: Gauge, k: "< 1.5s", v: "first paint" },
  { icon: Fingerprint, k: "On-device", v: "test scoring" },
  { icon: Download, k: "PDF · PNG", v: "instant export" },
  { icon: Sparkles, k: `${TOOLS.length} tools`, v: "one suite" },
];

const TRUST = [
  { icon: ShieldCheck, text: "Answers never leave your browser" },
  { icon: Cpu, text: "Never the same question set twice" },
];

/**
 * One band replacing the old "how it works", "pillars" and stats sections —
 * same claims, a third of the scroll.
 */
export function ProofBand() {
  return (
    <div className="bento p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className="flex items-start gap-3.5">
            <span className="accent-tile size-10 shrink-0">
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-xl">
                <span className="label-mono mr-2">0{i + 1}</span>
                {title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-2.5 border-t border-hairline pt-6 sm:grid-cols-4 sm:gap-3">
        {FACTS.map(({ icon: Icon, k, v }) => (
          <div key={k} className="hud-tile px-3 py-3 text-center">
            <Icon className="mx-auto size-4 text-primary" aria-hidden="true" />
            <dt className="mt-2 font-display text-xl">{k}</dt>
            <dd className="label-mono mt-0.5">{v}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {TRUST.map(({ icon: Icon, text }) => (
          <li key={text} className="label-mono inline-flex items-center gap-2">
            <Icon className="size-3.5 text-primary" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
