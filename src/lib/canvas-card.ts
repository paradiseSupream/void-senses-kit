export type CardMetric = { label: string; value: number };

type CardOptions = {
  width?: number;
  height?: number;
  eyebrow: string;
  title: string;
  headline: string;
  lines: string[];
  footer?: string;
  /** Per-result accent colour — personalises archetype / vibe cards. */
  accent?: string;
  /** Small pill in the top-right: rarity, band or verdict. */
  badge?: string;
  /** Name / pair label rendered beside the eyebrow. */
  subject?: string;
  /** Up to 4 axis bars (0–100) rendered above the footer. */
  metrics?: CardMetric[];
};

const OBSIDIAN = "#09090b";
const SLATE = "#18181b";
const LINE = "#27272a";
const EMERALD = "#10b981";
const VIOLET = "#7c3aed";

/**
 * Deterministic accent colour for a result seed (archetype name, verdict,
 * score band) so every share card looks specific to that person's outcome.
 */
export function accentFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  return `hsl(${hash} 78% 58%)`;
}

function drawBadge(ctx: CanvasRenderingContext2D, text: string, right: number, top: number, accent: string) {
  ctx.font = "600 16px 'JetBrains Mono', monospace";
  const width = ctx.measureText(text.toUpperCase()).width + 28;
  const x = right - width;
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.16;
  roundRect(ctx, x, top, width, 34, 17);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.2;
  roundRect(ctx, x, top, width, 34, 17);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillText(text.toUpperCase(), x + 14, top + 23);
}

function drawMetrics(
  ctx: CanvasRenderingContext2D,
  metrics: CardMetric[],
  x: number,
  y: number,
  width: number,
  accent: string,
) {
  const items = metrics.slice(0, 4);
  const gap = 14;
  const colWidth = (width - gap * (items.length - 1)) / Math.max(1, items.length);
  items.forEach((metric, index) => {
    const cx = x + index * (colWidth + gap);
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "500 13px 'JetBrains Mono', monospace";
    ctx.fillText(metric.label.toUpperCase().slice(0, 14), cx, y);
    ctx.fillStyle = "#27272a";
    roundRect(ctx, cx, y + 10, colWidth, 8, 4);
    ctx.fill();
    ctx.fillStyle = accent;
    const pct = Math.max(0, Math.min(100, metric.value)) / 100;
    roundRect(ctx, cx, y + 10, Math.max(8, colWidth * pct), 8, 4);
    ctx.fill();
    ctx.fillStyle = "#fafafa";
    ctx.font = "600 15px 'Space Grotesk', sans-serif";
    ctx.fillText(String(Math.round(metric.value)), cx, y + 40);
  });
}


/** Draws a branded 2x-resolution share card and returns the canvas. */
export function drawBrandedCard(options: CardOptions): HTMLCanvasElement {
  const w = options.width ?? 1200;
  const h = options.height ?? 675;
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  ctx.fillStyle = OBSIDIAN;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, 0, h);
  glow.addColorStop(0, "rgba(124,58,237,0.35)");
  glow.addColorStop(1, "rgba(9,9,11,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 56) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const pad = 64;
  ctx.fillStyle = SLATE;
  ctx.globalAlpha = 0.72;
  roundRect(ctx, pad / 2, pad / 2, w - pad, h - pad, 28);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad / 2, pad / 2, w - pad, h - pad, 28);
  ctx.stroke();

  const accent = options.accent ?? EMERALD;

  // logo mark
  const cx = pad + 8;
  const cy = pad + 14;
  ctx.strokeStyle = VIOLET;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fafafa";
  ctx.font = "600 22px 'Space Grotesk', sans-serif";
  ctx.fillText("Senses of Void", cx + 30, cy + 8);

  if (options.badge) drawBadge(ctx, options.badge, w - pad, pad - 4, accent);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 14px 'JetBrains Mono', monospace";
  const eyebrow = options.subject
    ? `${options.eyebrow} · ${options.subject}`
    : options.eyebrow;
  ctx.fillText(eyebrow.toUpperCase(), pad, pad + 78);

  ctx.fillStyle = "#fafafa";
  ctx.font = "700 46px 'Space Grotesk', sans-serif";
  ctx.fillText(options.title, pad, pad + 136);

  ctx.fillStyle = accent;
  ctx.font = "700 76px 'Space Grotesk', sans-serif";
  ctx.fillText(options.headline, pad, pad + 226);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = "400 22px Inter, sans-serif";
  let y = pad + 292;
  options.lines.forEach((line) => {
    wrapText(ctx, line, pad, y, w - pad * 2, 32).forEach((segment, i) => {
      ctx.fillText(segment, pad, y + i * 32);
    });
    y += 32 * Math.max(1, wrapText(ctx, line, pad, y, w - pad * 2, 32).length) + 8;
  });

  if (options.metrics?.length) {
    drawMetrics(ctx, options.metrics, pad, h - pad - 96, w - pad * 2, accent);
  }

  ctx.fillStyle = "#71717a";
  ctx.font = "400 16px 'JetBrains Mono', monospace";
  ctx.fillText(options.footer ?? "sensesofvoid.app · entertainment & self-reflection only", pad, h - pad);

  return canvas;
}


export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  _x: number,
  _y: number,
  maxWidth: number,
  _lineHeight: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines;
}

/**
 * Vertical 1080x1920 story card tuned for TikTok / Reels / Stories.
 * Big centred headline, QR-free clean footer with the domain.
 */
export function drawStoryCard(options: CardOptions): HTMLCanvasElement {
  const w = 1080;
  const h = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = OBSIDIAN;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.18, 0, w * 0.5, h * 0.18, h * 0.8);
  glow.addColorStop(0, "rgba(124,58,237,0.4)");
  glow.addColorStop(0.55, "rgba(16,185,129,0.09)");
  glow.addColorStop(1, "rgba(9,9,11,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 90) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const pad = 88;
  ctx.fillStyle = SLATE;
  ctx.globalAlpha = 0.7;
  roundRect(ctx, pad - 32, 300, w - (pad - 32) * 2, 1140, 48);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  roundRect(ctx, pad - 32, 300, w - (pad - 32) * 2, 1140, 48);
  ctx.stroke();

  const accent = options.accent ?? EMERALD;

  // logo mark, centred
  ctx.strokeStyle = VIOLET;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(w / 2, 170, 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(w / 2, 170, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fafafa";
  ctx.font = "600 40px 'Space Grotesk', sans-serif";
  ctx.fillText("Senses of Void", w / 2, 258);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 26px 'JetBrains Mono', monospace";
  const eyebrow = options.subject
    ? `${options.eyebrow} · ${options.subject}`
    : options.eyebrow;
  ctx.fillText(eyebrow.toUpperCase(), w / 2, 400);

  ctx.fillStyle = "#fafafa";
  ctx.font = "700 62px 'Space Grotesk', sans-serif";
  wrapText(ctx, options.title, 0, 0, w - pad * 2, 74).forEach((line, i) => {
    ctx.fillText(line, w / 2, 490 + i * 74);
  });

  ctx.fillStyle = accent;
  const headlineFont = options.headline.length > 12 ? 84 : 150;
  ctx.font = `700 ${headlineFont}px 'Space Grotesk', sans-serif`;
  ctx.fillText(options.headline, w / 2, 720);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = "400 34px Inter, sans-serif";
  let y = 860;
  options.lines.forEach((line) => {
    const segments = wrapText(ctx, line, 0, 0, w - pad * 2, 48);
    segments.forEach((segment, i) => {
      ctx.fillText(segment, w / 2, y + i * 48);
    });
    y += segments.length * 48 + 18;
  });

  if (options.badge) {
    ctx.textAlign = "left";
    drawBadge(ctx, options.badge, w / 2 + 170, 1080, accent);
    ctx.textAlign = "center";
  }

  if (options.metrics?.length) {
    ctx.textAlign = "left";
    drawMetrics(ctx, options.metrics, pad, 1180, w - pad * 2, accent);
    ctx.textAlign = "center";
  }


  ctx.fillStyle = VIOLET;
  ctx.font = "600 38px 'Space Grotesk', sans-serif";
  ctx.fillText("Can you beat this?", w / 2, 1330);
  ctx.fillStyle = "#fafafa";
  ctx.font = "700 44px 'Space Grotesk', sans-serif";
  ctx.fillText("sensesofvoid.app", w / 2, 1392);

  ctx.fillStyle = "#71717a";
  ctx.font = "400 24px 'JetBrains Mono', monospace";
  ctx.fillText(
    options.footer ?? "free · no signup · entertainment only",
    w / 2,
    h - 120,
  );
  ctx.textAlign = "left";

  return canvas;
}

/** Converts a rendered card canvas into a PNG File for the Web Share API. */
export async function canvasToPngFile(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<File | null> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) return null;
  return new File([blob], filename.endsWith(".png") ? filename : `${filename}.png`, {
    type: "image/png",
  });
}

/**
 * Shares the card image itself (Web Share API level 2) so the recipient sees
 * the visual, not just a link. Returns false when file sharing is unavailable
 * so the caller can fall back to a download.
 */
export async function shareCanvasImage(
  canvas: HTMLCanvasElement,
  { filename, title, text }: { filename: string; title: string; text: string },
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  const file = await canvasToPngFile(canvas, filename);
  if (!file) return false;
  const payload = { files: [file], title, text };
  if (navigator.canShare && !navigator.canShare(payload)) return false;
  try {
    await navigator.share(payload);
    return true;
  } catch {
    // User dismissed the sheet — treat as handled, no noisy fallback.
    return true;
  }
}
