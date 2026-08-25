import { useState } from "react";
import { Crosshair, Download, HeartCrack, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { RadarChart } from "@/components/tools/RadarChart";
import { DARK_SHORT } from "@/lib/banks/dark";
import type { Dossier } from "@/lib/archetype-core";
import { downloadDossierPdf } from "@/lib/dossier-pdf";
import { MatrixModule } from "@/components/monetization/MatrixUpsellModal";

/**
 * The unlocked VIP report: interactive six-axis radar, per-axis breakdown,
 * behavioural prediction matrix, deep analysis and the PDF export.
 *
 * Every string here arrives from the entitlement-checked server function, and
 * the export button only forwards a short-lived signed token — the PDF itself is
 * rendered server-side.
 */
export function ShadowDossier({
  dossier,
  name,
  pdfToken,
  onTokenExpired,
}: {
  dossier: Dossier;
  name?: string;
  pdfToken: string | null;
  onTokenExpired?: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(dossier.axes[0]?.dim ?? null);
  const [busy, setBusy] = useState(false);
  const axis = dossier.axes.find((a) => a.dim === selected) ?? dossier.axes[0]!;

  const exportPdf = async () => {
    if (busy) return;
    if (!pdfToken) {
      toast.error("Report session expired — refreshing your access.");
      onTokenExpired?.();
      return;
    }
    setBusy(true);
    try {
      await downloadDossierPdf(pdfToken);
    } catch (error) {
      if (error instanceof Error && error.message === "locked") {
        toast.error("Download link expired — refreshing your VIP access.");
        onTokenExpired?.();
      } else {
        toast.error("PDF export failed — try again.");
      }
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-hairline bg-surface-2/30 p-4 sm:p-5">
        <span className="label-mono">
          Official archetype dossier{name ? ` for ${name}` : ""}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap any point on the radar to expand that axis: what the score means, the blind spot it
          creates and the defence mechanism it runs.
        </p>

        <div className="mt-4">
          <RadarChart
            data={dossier.axes.map((a) => ({ dim: a.dim, value: a.value }))}
            labels={DARK_SHORT}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {dossier.axes.map((a) => (
            <button
              key={a.dim}
              type="button"
              onClick={() => setSelected(a.dim)}
              aria-pressed={selected === a.dim}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors ${
                selected === a.dim
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-hairline bg-surface-2/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {DARK_SHORT[a.dim] ?? a.dim} {a.value}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-hairline bg-background/40 p-4">
          <h4 className="font-display text-base font-semibold">
            {axis.label} — {axis.band} · {axis.value}/100
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">{axis.meaning}</p>
          <p className="mt-3 text-sm leading-relaxed">{axis.reading}</p>
          <p className="mt-3 flex gap-2 text-sm text-foreground/80">
            <Crosshair className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Blind spot:</strong> {axis.blindSpot}
            </span>
          </p>
          <p className="mt-2 flex gap-2 text-sm text-foreground/80">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Defence mechanism:</strong> {axis.defense}
            </span>
          </p>
        </div>
      </div>

      <section>
        <span className="label-mono">Behavioural prediction matrix</span>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {[
            { k: "Extreme pressure", v: dossier.archetype.pressure },
            { k: "Betrayal", v: dossier.archetype.betrayal },
            { k: "Romance", v: dossier.archetype.romance },
          ].map((cell) => (
            <div key={cell.k} className="rounded-xl border border-hairline bg-surface-2/40 p-3.5">
              <span className="label-mono">{cell.k}</span>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">{cell.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <span className="label-mono">VIP shadow analysis</span>
        <div className="mt-3 space-y-3.5">
          {[...dossier.archetype.analysis, ...dossier.context].map((para) => (
            <p key={para.slice(0, 24)} className="text-sm leading-relaxed text-foreground/85">
              {para}
            </p>
          ))}
          {dossier.axes.map((a) => (
            <p key={a.dim} className="text-sm leading-relaxed text-foreground/85">
              <strong className="font-semibold">
                {a.label} ({a.band}, {a.value}/100):
              </strong>{" "}
              {a.reading} {a.blindSpot} The mechanism you run here is {a.defense.toLowerCase()}
            </p>
          ))}
          <p className="text-sm leading-relaxed text-foreground/85">
            Your secondary signature is <strong>{dossier.runnerUp.name}</strong>.{" "}
            {dossier.runnerUp.blurb} When your dominant strategy fails or is blocked, this is the
            register you fall back into — and it is usually the version of you that surprises the
            people who thought they had you mapped.
          </p>
        </div>
      </section>

      <section>
        <span className="label-mono">Tactical mastery guide</span>
        <ol className="mt-3 space-y-2.5">
          {dossier.archetype.mastery.map((item, i) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-[11px] text-primary">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <MatrixModule dossier={dossier} />

      <button
        type="button"
        onClick={() => void exportPdf()}
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        Download Official Archetype Dossier (PDF)
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Sparkles className="size-3.5" aria-hidden="true" /> {dossier.words.toLocaleString()}+ words
        of personalised analysis · dark-themed, print-ready
      </p>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <HeartCrack className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> For self-reflection
        and entertainment. This is not a clinical assessment or a diagnosis.
      </p>
    </div>
  );
}
