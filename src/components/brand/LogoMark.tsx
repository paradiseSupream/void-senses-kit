export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <span className={`relative inline-grid place-items-center ${className}`} aria-hidden="true">
      <span className="absolute inset-0 rounded-full bg-primary/25 blur-lg" />
      <span className="absolute inset-0 animate-ping rounded-full border border-primary/40 [animation-duration:2.8s]" />
      <span className="absolute inset-[18%] rounded-full border border-secondary/60" />
      <span className="absolute inset-[38%] rounded-full bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
      <span className="absolute inset-0 rounded-full border border-hairline" />
    </span>
  );
}
