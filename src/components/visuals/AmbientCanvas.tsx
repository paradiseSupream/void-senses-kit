import { useEffect, useRef } from "react";

import { useCalmMotion } from "@/hooks/use-reduced-motion";

/**
 * Volumetric light drift behind the hero. Deliberately tiny: three soft radial
 * pools on a low-resolution canvas, DPR-capped, paused when off-screen, and
 * skipped entirely on low-power/touch devices or with reduced motion.
 */
export function AmbientCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const calm = useCalmMotion();

  useEffect(() => {
    if (calm) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width * 0.5));
      h = Math.max(1, Math.round(rect.height * 0.5));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const pools = [
      { x: 0.22, y: 0.2, r: 0.55, hue: "16, 185, 129", sx: 0.00007, sy: 0.00005 },
      { x: 0.78, y: 0.16, r: 0.5, hue: "124, 58, 237", sx: -0.00006, sy: 0.00008 },
      { x: 0.55, y: 0.88, r: 0.6, hue: "34, 211, 238", sx: 0.00005, sy: -0.00004 },
    ];

    let running = true;
    let frame = 0;
    const draw = (t: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pools) {
        const cx = (p.x + Math.sin(t * p.sx) * 0.06) * w;
        const cy = (p.y + Math.cos(t * p.sy) * 0.05) * h;
        const rad = p.r * Math.max(w, h) * 0.6;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, `rgba(${p.hue}, 0.16)`);
        g.addColorStop(1, `rgba(${p.hue}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    const io = new IntersectionObserver(([entry]) => {
      const visible = !!entry?.isIntersecting;
      if (visible && !running) {
        running = true;
        frame = requestAnimationFrame(draw);
      } else if (!visible && running) {
        running = false;
        cancelAnimationFrame(frame);
      }
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
    };
  }, [calm]);

  if (calm) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`ambient-canvas pointer-events-none absolute inset-0 size-full ${className}`}
    />
  );
}
