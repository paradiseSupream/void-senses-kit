type CardOptions = {
  width?: number;
  height?: number;
  eyebrow: string;
  title: string;
  headline: string;
  lines: string[];
  footer?: string;
};

const OBSIDIAN = "#09090b";
const SLATE = "#18181b";
const LINE = "#27272a";
const EMERALD = "#10b981";
const VIOLET = "#7c3aed";

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

  // logo mark
  const cx = pad + 8;
  const cy = pad + 14;
  ctx.strokeStyle = VIOLET;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = EMERALD;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fafafa";
  ctx.font = "600 22px 'Space Grotesk', sans-serif";
  ctx.fillText("Senses of Void", cx + 30, cy + 8);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 14px 'JetBrains Mono', monospace";
  ctx.fillText(options.eyebrow.toUpperCase(), pad, pad + 78);

  ctx.fillStyle = "#fafafa";
  ctx.font = "700 46px 'Space Grotesk', sans-serif";
  ctx.fillText(options.title, pad, pad + 136);

  ctx.fillStyle = EMERALD;
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

  // logo mark, centred
  ctx.strokeStyle = VIOLET;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(w / 2, 170, 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = EMERALD;
  ctx.beginPath();
  ctx.arc(w / 2, 170, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fafafa";
  ctx.font = "600 40px 'Space Grotesk', sans-serif";
  ctx.fillText("Senses of Void", w / 2, 258);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 26px 'JetBrains Mono', monospace";
  ctx.fillText(options.eyebrow.toUpperCase(), w / 2, 400);

  ctx.fillStyle = "#fafafa";
  ctx.font = "700 62px 'Space Grotesk', sans-serif";
  wrapText(ctx, options.title, 0, 0, w - pad * 2, 74).forEach((line, i) => {
    ctx.fillText(line, w / 2, 490 + i * 74);
  });

  ctx.fillStyle = EMERALD;
  ctx.font = "700 150px 'Space Grotesk', sans-serif";
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
