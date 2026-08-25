import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Pointer-reactive tilt + spotlight, written straight to CSS custom properties
 * so React never re-renders while the cursor moves. Fine pointers only — touch
 * devices fall back to the CSS press state.
 */
export function usePointerTilt(maxDeg = 5) {
  const raf = useRef(0);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse") return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
        el.style.setProperty("--ry", `${((px - 0.5) * 2 * maxDeg).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${((0.5 - py) * 2 * maxDeg).toFixed(2)}deg`);
      });
    },
    [maxDeg],
  );

  const onPointerLeave = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const el = e.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return { onPointerMove, onPointerLeave };
}
