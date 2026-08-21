import logo from "@/assets/logo-void.png";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`}>
      <span className="absolute inset-0 rounded-full bg-primary/25 blur-lg" aria-hidden="true" />
      <img
        src={logo}
        alt="Senses of Void logo"
        width={1024}
        height={1024}
        loading="lazy"
        decoding="async"
        className="relative size-full rounded-full object-contain"
      />
    </span>
  );
}
