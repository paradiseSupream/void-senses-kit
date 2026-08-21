import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

const KEY = "sov.socialbar.dismissed";

export function SocialBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(KEY) === "1";
    } catch {
      /* storage unavailable */
    }
    if (dismissed) return;
    const t = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <aside
      aria-label="Sponsored offer"
      className="glass fixed right-4 bottom-20 z-40 sm:bottom-4 flex max-w-[min(20rem,calc(100vw-2rem))] items-center gap-3 rounded-full py-2 pr-2 pl-4 duration-500 animate-in slide-in-from-bottom-4"
    >
      <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <a
        href="#sponsored-placeholder"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-primary"
      >
        <span className="label-mono mr-2">Sponsored</span>
        Free 8K asset drop this week
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss sponsored offer"
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
