import { useSiteConfig } from "@/lib/site-config";
import { useConsent, useConsentRequired, writeConsent, type ConsentValue } from "@/lib/consent";
import { track } from "@/lib/monetization";
import { DEFAULT_PRIVACY } from "@/lib/admin-types";

export function CookieBanner() {
  const consent = useConsent();
  const config = useSiteConfig();
  const privacy = config.ads.privacy ?? DEFAULT_PRIVACY;
  const required = useConsentRequired(config.tracking?.require_consent !== false);

  if (consent !== null || !required) return null;

  const choose = (value: ConsentValue) => {
    writeConsent(value);
    track({ event_type: "consent", slot: value, format: "consent" });
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="glass fixed inset-x-4 bottom-20 z-40 mx-auto max-w-2xl rounded-xl p-4 sm:bottom-4 sm:left-4 sm:mx-0 sm:max-w-sm"
    >
      <p className="text-sm text-muted-foreground">{privacy.banner_text}</p>
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
