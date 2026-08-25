import { useEffect, useState } from "react";

/**
 * Presentation-only helper: true when the visitor asked for reduced motion, or
 * when the device is clearly low-power (few cores). Used to skip tilt, parallax
 * and the ambient canvas so we never spend frames a device cannot afford.
 */
export function useCalmMotion() {
  const [calm, setCalm] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cores = navigator.hardwareConcurrency ?? 4;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lowPower = cores <= 4 && coarse;
    const apply = () => setCalm(mql.matches || lowPower);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  return calm;
}
