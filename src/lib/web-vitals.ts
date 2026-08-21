/**
 * Lightweight performance telemetry (FCP, LCP, CLS, INP-ish) reported through
 * the same tracking pipeline as ad events, so the admin dashboard can show the
 * performance impact of the ad scripts.
 */
import { track } from "@/lib/monetization";

let started = false;

function report(name: string, value: number) {
  if (!Number.isFinite(value)) return;
  track({
    event_type: "web_vital",
    slot: name,
    format: "vitals",
    metric_value: Math.round(value * 1000) / 1000,
  });
}

export function startWebVitals() {
  if (started || typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
    return;
  }
  started = true;

  const observers: PerformanceObserver[] = [];
  const observe = (type: string, cb: (list: PerformanceObserverEntryList) => void) => {
    try {
      const po = new PerformanceObserver(cb);
      po.observe({ type, buffered: true } as PerformanceObserverInit);
      observers.push(po);
    } catch {
      /* unsupported entry type */
    }
  };

  observe("paint", (list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === "first-contentful-paint") report("fcp", entry.startTime);
    }
  });

  let lcp = 0;
  observe("largest-contentful-paint", (list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (last) lcp = last.startTime;
  });

  let cls = 0;
  observe("layout-shift", (list) => {
    for (const entry of list.getEntries() as Array<
      PerformanceEntry & { value?: number; hadRecentInput?: boolean }
    >) {
      if (!entry.hadRecentInput) cls += entry.value ?? 0;
    }
  });

  let inp = 0;
  observe("event", (list) => {
    for (const entry of list.getEntries() as Array<PerformanceEntry & { duration: number }>) {
      if (entry.duration > inp) inp = entry.duration;
    }
  });

  let sent = false;
  const finalReport = () => {
    if (sent || document.visibilityState !== "hidden") return;
    sent = true;
    if (lcp > 0) report("lcp", lcp);
    report("cls", cls);
    if (inp > 0) report("inp", inp);
    for (const po of observers) po.disconnect();
  };

  document.addEventListener("visibilitychange", finalReport);
  window.addEventListener("pagehide", finalReport);
}
