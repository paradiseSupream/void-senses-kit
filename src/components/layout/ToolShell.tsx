import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function ToolShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft className="size-4" aria-hidden="true" /> All tools
      </Link>
      <span className="label-mono mt-6 block">{eyebrow}</span>
      <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">{intro}</p>
      <div className="mt-8">{children}</div>
      <p className="mt-12 text-xs text-muted-foreground">
        For entertainment and self-reflection only, not clinical psychological or medical
        assessment.
      </p>
    </div>
  );
}
