import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { LogoMark } from "@/components/brand/LogoMark";
import { TOOLS } from "@/lib/tools";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline bg-surface/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="font-display text-base font-bold">Senses of Void</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Seven fast, private tools for curiosity — plus an always-free asset vault.
          </p>
        </div>

        <nav aria-label="Tools">
          <h2 className="label-mono">Tools</h2>
          <ul className="mt-3 space-y-2">
            {TOOLS.map((tool) => (
              <li key={tool.slug}>
                <Link
                  to={tool.path}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {tool.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="label-mono">Legal</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                to="/privacy"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  try {
                    window.localStorage.removeItem("sov.cookies");
                  } catch {
                    /* storage unavailable */
                  }
                  toast.success("Cookie preferences reset. The banner will show again.");
                  window.dispatchEvent(new Event("sov:cookies-reset"));
                }}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Cookie Consent settings
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline px-4 py-6 sm:px-6">
        <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
          All tests and tools are for entertainment and self-reflection only, not clinical
          psychological or medical assessment.
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Senses of Void · sensesofvoid.app
        </p>
      </div>
    </footer>
  );
}
