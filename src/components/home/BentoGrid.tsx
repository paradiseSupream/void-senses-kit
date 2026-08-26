import type { ReactNode } from "react";

/**
 * Layout primitive for the home bento composition. Presentation only — it
 * never owns content, just the asymmetric 6-column rhythm.
 */
export function BentoGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-3 sm:gap-4 lg:grid-cols-6 ${className}`}>{children}</div>;
}

export function BentoTile({
  children,
  span = "lg:col-span-3",
  className = "",
}: {
  children: ReactNode;
  span?: string;
  className?: string;
}) {
  return <div className={`${span} ${className}`}>{children}</div>;
}
