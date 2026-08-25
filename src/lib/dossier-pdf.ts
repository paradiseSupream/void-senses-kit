/**
 * Dark-themed PDF export of the VIP Shadow Dossier.
 *
 * jsPDF is loaded lazily so the 400 kB engine never touches the initial bundle
 * — free visitors and quiz-takers download none of it.
 */

import type { Dossier } from "@/lib/archetype";

const BG = "#09090b";
const PANEL = "#141417";
const LINE = "#27272a";
const TEXT = "#e4e4e7";
const MUTED = "#a1a1aa";
const ACCENT = "#10b981";

export async function downloadDossierPdf(dossier: Dossier, name?: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 46;
  let y = 0;

  const paintPage = () => {
    doc.setFillColor(BG);
    doc.rect(0, 0, W, H, "F");
  };

  const newPage = () => {
    doc.addPage();
    paintPage();
    y = M;
  };

  const need = (space: number) => {
    if (y + space > H - M) newPage();
  };

  const heading = (text: string, size = 13) => {
    need(size + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(ACCENT);
    doc.text(text.toUpperCase(), M, y);
    y += 8;
    doc.setDrawColor(LINE);
    doc.line(M, y, W - M, y);
    y += 16;
  };

  const body = (text: string, color = TEXT, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(color);
    for (const line of doc.splitTextToSize(text, W - M * 2) as string[]) {
      need(15);
      doc.text(line, M, y);
      y += 14;
    }
    y += 6;
  };

  paintPage();
  y = M + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text("SENSES OF VOID · OFFICIAL ARCHETYPE DOSSIER", M, y);
  y += 30;

  doc.setFontSize(26);
  doc.setTextColor(TEXT);
  for (const line of doc.splitTextToSize(dossier.archetype.name, W - M * 2) as string[]) {
    doc.text(line, M, y);
    y += 30;
  }
  doc.setFontSize(11);
  doc.setTextColor(ACCENT);
  doc.text(dossier.archetype.tagline, M, y);
  y += 26;

  if (name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    doc.text(`Prepared for ${name} · ${new Date().toLocaleDateString()}`, M, y);
    y += 22;
  }

  // Score panel
  need(dossier.axes.length * 22 + 40);
  doc.setFillColor(PANEL);
  doc.setDrawColor(LINE);
  doc.roundedRect(M, y, W - M * 2, dossier.axes.length * 22 + 34, 8, 8, "FD");
  let panelY = y + 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(`SIX-AXIS PROFILE · SHADOW INTENSITY ${dossier.intensity}/100`, M + 16, panelY);
  panelY += 18;
  for (const axis of dossier.axes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(TEXT);
    doc.text(axis.label, M + 16, panelY);
    const barX = M + 210;
    const barW = W - M - 70 - barX;
    doc.setFillColor("#1f1f23");
    doc.roundedRect(barX, panelY - 7, barW, 7, 3, 3, "F");
    doc.setFillColor(ACCENT);
    doc.roundedRect(barX, panelY - 7, Math.max(4, (barW * axis.value) / 100), 7, 3, 3, "F");
    doc.setTextColor(MUTED);
    doc.setFontSize(9);
    doc.text(`${axis.band} · ${axis.value}`, W - M - 60, panelY);
    panelY += 22;
  }
  y = panelY + 18;

  heading("Archetype summary");
  body(dossier.archetype.blurb);
  body(dossier.archetype.edge, MUTED);

  heading("Shadow analysis");
  for (const para of [...dossier.archetype.analysis, ...dossier.context]) body(para);

  heading("Axis breakdown");
  for (const axis of dossier.axes) {
    need(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(TEXT);
    doc.text(`${axis.label} — ${axis.band} (${axis.value}/100)`, M, y);
    y += 16;
    body(axis.reading);
    body(`Blind spot: ${axis.blindSpot}`, MUTED, 9.5);
    body(`Defence mechanism: ${axis.defense}`, MUTED, 9.5);
  }

  heading("Behavioural prediction matrix");
  body(`Under extreme pressure — ${dossier.archetype.pressure}`);
  body(`After betrayal — ${dossier.archetype.betrayal}`);
  body(`In romance — ${dossier.archetype.romance}`);

  heading("Tactical mastery guide");
  for (const [i, item] of dossier.archetype.mastery.entries()) body(`${i + 1}. ${item}`);

  heading("Secondary signature");
  body(
    `Your runner-up profile is ${dossier.runnerUp.name}. ${dossier.runnerUp.blurb} When your dominant strategy fails, this is the register you fall back into.`,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text(
    "sensesofvoid.app · for self-reflection and entertainment, not a clinical diagnosis",
    M,
    H - 26,
  );

  doc.save(`senses-of-void-${dossier.archetype.key}-dossier.pdf`);
}
