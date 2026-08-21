import { useEffect, useState } from "react";

const KEY = "sov.cookies";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        setVisible(!window.localStorage.getItem(KEY));
      } catch {
        setVisible(false);
      }
    };
    check();
    window.addEventListener("sov:cookies-reset", check);
    return () => window.removeEventListener("sov:cookies-reset", check);
  }, []);

  if (!visible) return null;

  const choose = (value: "all" | "essential") => {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      /* storage unavailable */
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="glass fixed inset-x-4 bottom-20 z-40 mx-auto max-w-2xl rounded-xl p-4 sm:bottom-4 sm:left-4 sm:mx-0 sm:max-w-sm"
    >
      <p className="text-sm text-muted-foreground">
        We use essential storage to remember your preferences, and advertising cookies to keep the
        tools free.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => choose("all")}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Accept all
        </button>
        <button
          type="button"
          onClick={() => choose("essential")}
          className="flex-1 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
        >
          Essential only
        </button>
      </div>
    </div>
  );
}
