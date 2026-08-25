/**
 * Dependency-free PDF writer for the VIP dossier — SERVER ONLY.
 *
 * Hand-rolls the PDF object graph with the base-14 Helvetica fonts so it runs
 * inside the edge worker (no jsPDF, no canvas, no native binaries) and so the
 * premium text never has to reach a browser to become a file.
 */

import type { Dossier } from "@/lib/archetype-core";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 46;

const BG = [0.035, 0.035, 0.043] as const;
const PANEL = [0.078, 0.078, 0.09] as const;
const BAR_BG = [0.12, 0.12, 0.14] as const;
const TEXT = [0.894, 0.894, 0.925] as const;
const MUTED = [0.631, 0.631, 0.667] as const;
const ACCENT = [0.063, 0.725, 0.506] as const;

/** WinAnsi octal escapes for the typography we actually emit. */
const WINANSI: Record<string, string> = {
  "—": "\\227",
  "–": "\\226",
  "’": "\\222",
  "‘": "\\221",
  "“": "\\223",
  "”": "\\224",
  "·": "\\267",
  "•": "\\225",
  "…": "\\205",
};

function escapeText(input: string): string {
  let out = "";
  for (const char of input) {
    if (WINANSI[char]) {
      out += WINANSI[char];
      continue;
    }
    const code = char.codePointAt(0)!;
    if (char === "(" || char === ")" || char === "\\") out += `\\${char}`;
    else if (code >= 32 && code <= 126) out += char;
    else if (code >= 160 && code <= 255) out += `\\${code.toString(8).padStart(3, "0")}`;
    else out += "?";
  }
  return out;
}

/** Approximate Helvetica advance widths — good enough to never overflow. */
function charWidth(char: string, bold: boolean): number {
  if ("iljt.,'`|!:;I ".includes(char)) return bold ? 0.32 : 0.29;
  if ("fr()[]{}/\\-".includes(char)) return 0.35;
  if ("mwMW@%".includes(char)) return bold ? 0.92 : 0.87;
  if (char >= "A" && char <= "Z") return bold ? 0.73 : 0.69;
  if (char >= "0" && char <= "9") return 0.56;
  return bold ? 0.58 : 0.53;
}

function textWidth(text: string, size: number, bold: boolean): number {
  let total = 0;
  for (const char of text) total += charWidth(char, bold);
  return total * size;
}

function wrap(text: string, size: number, bold: boolean, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(candidate, size, bold) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

class PdfDoc {
  private pages: string[] = [];
  private stream = "";
  private y = M;

  constructor() {
    this.newPage();
  }

  private paint() {
    this.stream += `${BG.join(" ")} rg 0 0 ${PAGE_W} ${PAGE_H} re f\n`;
  }

  newPage() {
    if (this.stream) this.pages.push(this.stream);
    this.stream = "";
    this.paint();
    this.y = M + 10;
  }

  need(space: number) {
    if (this.y + space > PAGE_H - M - 20) this.newPage();
  }

  line(text: string, opts: { size?: number; bold?: boolean; color?: readonly number[] } = {}) {
    const size = opts.size ?? 10;
    const color = opts.color ?? TEXT;
    const font = opts.bold ? "/F2" : "/F1";
    this.need(size + 6);
    this.stream += `BT ${font} ${size} Tf ${color.join(" ")} rg 1 0 0 1 ${M} ${(PAGE_H - this.y).toFixed(2)} Tm (${escapeText(text)}) Tj ET\n`;
    this.y += size + 4;
  }

  paragraph(
    text: string,
    opts: { size?: number; bold?: boolean; color?: readonly number[]; gap?: number } = {},
  ) {
    const size = opts.size ?? 10;
    for (const row of wrap(text, size, Boolean(opts.bold), PAGE_W - M * 2)) {
      this.line(row, opts);
      this.y += 0.5;
    }
    this.y += opts.gap ?? 8;
  }

  heading(text: string, size = 13) {
    this.need(size + 34);
    this.line(text.toUpperCase(), { size, bold: true, color: ACCENT });
    this.y += 2;
    this.stream += `0.153 0.153 0.165 RG 1 w ${M} ${(PAGE_H - this.y).toFixed(2)} m ${PAGE_W - M} ${(PAGE_H - this.y).toFixed(2)} l S\n`;
    this.y += 14;
  }

  scorePanel(dossier: Dossier) {
    const height = dossier.axes.length * 22 + 40;
    this.need(height + 10);
    const top = PAGE_H - this.y;
    this.stream += `${PANEL.join(" ")} rg ${M} ${(top - height).toFixed(2)} ${PAGE_W - M * 2} ${height} re f\n`;
    this.y += 22;
    this.line(`SIX-AXIS PROFILE  ·  SHADOW INTENSITY ${dossier.intensity}/100`, {
      size: 9,
      bold: true,
      color: MUTED,
    });
    this.y += 6;
    for (const axis of dossier.axes) {
      const baseline = PAGE_H - this.y;
      this.stream += `BT /F1 10 Tf ${TEXT.join(" ")} rg 1 0 0 1 ${M + 16} ${baseline.toFixed(2)} Tm (${escapeText(axis.label)}) Tj ET\n`;
      const barX = M + 200;
      const barW = PAGE_W - M - 80 - barX;
      this.stream += `${BAR_BG.join(" ")} rg ${barX} ${(baseline - 1).toFixed(2)} ${barW} 7 re f\n`;
      this.stream += `${ACCENT.join(" ")} rg ${barX} ${(baseline - 1).toFixed(2)} ${Math.max(4, (barW * axis.value) / 100).toFixed(2)} 7 re f\n`;
      this.stream += `BT /F1 9 Tf ${MUTED.join(" ")} rg 1 0 0 1 ${PAGE_W - M - 72} ${baseline.toFixed(2)} Tm (${escapeText(`${axis.band} · ${axis.value}`)}) Tj ET\n`;
      this.y += 22;
    }
    this.y += 22;
  }

  footerAllPages() {
    this.pages.push(this.stream);
    this.stream = "";
    const note = escapeText(
      "sensesofvoid.app · confidential VIP dossier · for self-reflection and entertainment, not a clinical diagnosis",
    );
    this.pages = this.pages.map(
      (page) =>
        `${page}BT /F1 8 Tf ${MUTED.join(" ")} rg 1 0 0 1 ${M} 26 Tm (${note}) Tj ET\n`,
    );
  }

  build(): Uint8Array {
    if (this.stream) this.footerAllPages();
    const objects: string[] = [];
    const pageCount = this.pages.length;
    // 1 catalog, 2 pages, 3/4 fonts, then per page: page obj + content obj.
    const pageIds = this.pages.map((_, i) => 5 + i * 2);
    objects.push("<< /Type /Catalog /Pages 2 0 R >>");
    objects.push(
      `<< /Type /Pages /Count ${pageCount} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
    );
    objects.push(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    );
    objects.push(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    );
    this.pages.forEach((content, i) => {
      const contentId = pageIds[i]! + 1;
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
      );
      objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
    });

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((body, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return bytes;
  }
}

/** Renders the full premium dossier as PDF bytes. */
export function buildDossierPdf(dossier: Dossier, name?: string | null): Uint8Array {
  const doc = new PdfDoc();

  doc.line("SENSES OF VOID  ·  OFFICIAL ARCHETYPE DOSSIER", {
    size: 9,
    bold: true,
    color: MUTED,
  });
  doc.paragraph(dossier.archetype.name, { size: 24, bold: true, gap: 2 });
  doc.paragraph(dossier.archetype.tagline, { size: 11, color: ACCENT, gap: 10 });
  doc.paragraph(
    `${name ? `Prepared for ${name} · ` : ""}${new Date().toISOString().slice(0, 10)} · ${dossier.words.toLocaleString()}+ words`,
    { size: 9, color: MUTED, gap: 12 },
  );

  doc.scorePanel(dossier);

  doc.heading("Archetype summary");
  doc.paragraph(dossier.archetype.blurb);
  doc.paragraph(dossier.archetype.edge, { color: MUTED });

  doc.heading("Shadow analysis");
  for (const para of [...dossier.archetype.analysis, ...dossier.context]) doc.paragraph(para);

  doc.heading("Axis breakdown");
  for (const axis of dossier.axes) {
    doc.need(70);
    doc.paragraph(`${axis.label} — ${axis.band} (${axis.value}/100)`, { size: 11, bold: true, gap: 4 });
    doc.paragraph(axis.reading);
    doc.paragraph(`Blind spot: ${axis.blindSpot}`, { size: 9.5, color: MUTED, gap: 4 });
    doc.paragraph(`Defence mechanism: ${axis.defense}`, { size: 9.5, color: MUTED });
  }

  doc.heading("Behavioural prediction matrix");
  doc.paragraph(`Under extreme pressure — ${dossier.archetype.pressure}`);
  doc.paragraph(`After betrayal — ${dossier.archetype.betrayal}`);
  doc.paragraph(`In romance — ${dossier.archetype.romance}`);

  doc.heading("Tactical mastery guide");
  dossier.archetype.mastery.forEach((item, i) => doc.paragraph(`${i + 1}. ${item}`));

  doc.heading("Secondary signature");
  doc.paragraph(
    `Your runner-up profile is ${dossier.runnerUp.name}. ${dossier.runnerUp.blurb} When your dominant strategy fails, this is the register you fall back into.`,
  );

  return doc.build();
}
