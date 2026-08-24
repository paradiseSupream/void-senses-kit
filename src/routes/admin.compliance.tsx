import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { adminGetSettings, adminSaveSettings } from "@/lib/admin.functions";
import type { AdsSettings, SiteSettings } from "@/lib/admin-types";
import { auditMetaCompliance, type ComplianceFinding } from "@/lib/fb-compliance";

export const Route = createFileRoute("/admin/compliance")({
  head: () => ({
    meta: [
      { title: "Meta Ad Compliance Checker — Senses of Void" },
      {
        name: "description",
        content:
          "Scan the live landing configuration for Facebook / Meta ad policy risks: interstitials, pop-unders and third-party scripts.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Meta Ad Compliance Checker" },
      { property: "og:description", content: "Private operator policy-risk scanner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompliancePage,
});

const TOKEN_KEY = "sov.adminToken";

const ICONS = {
  blocker: XCircle,
  warn: AlertTriangle,
  pass: CheckCircle2,
} as const;

const TONE = {
  blocker: "text-destructive",
  warn: "text-amber-400",
  pass: "text-primary",
} as const;

function FindingRow({ finding }: { finding: ComplianceFinding }) {
  const Icon = ICONS[finding.severity];
  return (
    <li className="flex gap-3 border-t border-hairline/60 py-3 first:border-t-0">
      <Icon className={`mt-0.5 size-4 shrink-0 ${TONE[finding.severity]}`} aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{finding.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{finding.detail}</p>
        {finding.severity === "pass" ? null : (
          <p className="mt-1 text-xs text-foreground/80">
            <span className="label-mono">fix</span> — {finding.fix}
          </p>
        )}
      </div>
    </li>
  );
}

function CompliancePage() {
  const load = useServerFn(adminGetSettings);
  const save = useServerFn(adminSaveSettings);
  const [token, setToken] = useState<string | null>(null);
  const [ads, setAds] = useState<AdsSettings | null>(null);
  const [site, setSite] = useState<SiteSettings | null>(null);

  useEffect(() => {
    try {
      setToken(window.sessionStorage.getItem(TOKEN_KEY));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const loader = useMutation({
    mutationFn: (input: { token: string }) => load({ data: input }),
    onSuccess: (data) => {
      setAds(data.ads);
      setSite(data.site);
    },
    onError: () => toast.error("Could not load settings — sign in from /admin first."),
  });

  const saver = useMutation({
    mutationFn: (input: { token: string; ads: AdsSettings }) => save({ data: input }),
    onSuccess: (data) => {
      setAds(data.ads);
      toast.success("Saved. Live within a few minutes.");
    },
    onError: () => toast.error("Save failed."),
  });

  useEffect(() => {
    if (token) loader.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Operator access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to the control panel to run the Meta compliance scan.
        </p>
        <Link to="/admin" className="btn-glow mt-5 inline-block rounded-lg px-4 py-2.5 text-sm font-semibold">
          Go to /admin
        </Link>
      </div>
    );
  }

  if (!ads || !site) return <p className="label-mono px-4 py-10">loading…</p>;

  const audit = auditMetaCompliance({
    enabled: ads.enabled,
    lean_mode: ads.lean_mode ?? false,
    monetag_inpage_push: ads.monetag_inpage_push,
    monetag_vignette: ads.monetag_vignette,
    monetag_popunder: ads.monetag_popunder,
    adsterra_social_bar: ads.adsterra_social_bar,
    adsterra_social_bar_src: ads.adsterra_social_bar_src,
    smartlink_url: ads.smartlink_url,
    gateSlotEnabled: ads.slots?.gate,
    stickyMobileEnabled: ads.slots?.sticky_mobile,
    consentRequired: ads.privacy?.consent_required,
  });

  const verdictCopy =
    audit.verdict === "ready"
      ? { label: "Ready for Meta review", tone: "text-primary" }
      : audit.verdict === "risky"
        ? { label: "Risky — review the warnings", tone: "text-amber-400" }
        : { label: "Likely disapproval — fix the blockers", tone: "text-destructive" };

  const toggleLean = (value: boolean) =>
    saver.mutate({ token, ads: { ...ads, lean_mode: value } });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="label-mono flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" /> meta ad policy
          </span>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
            FB / Meta compliance checker
          </h1>
        </div>
        <Link
          to="/admin"
          className="rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Back to panel
        </Link>
      </div>

      <div className="panel mt-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label-mono">policy score</p>
            <p className={`mt-1 font-display text-4xl font-semibold ${verdictCopy.tone}`}>
              {audit.score}
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
            <p className={`mt-1 text-sm font-medium ${verdictCopy.tone}`}>{verdictCopy.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {audit.blockers} blocker(s), {audit.warnings} warning(s) on the current landing config.
            </p>
          </div>
          <div className="rounded-xl border border-hairline p-3">
            <p className="label-mono">lean mode (FB safe)</p>
            <button
              type="button"
              onClick={() => toggleLean(!(ads.lean_mode ?? false))}
              disabled={saver.isPending}
              aria-pressed={ads.lean_mode ?? false}
              className={`mt-2 w-40 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                ads.lean_mode
                  ? "bg-primary/15 text-primary"
                  : "border border-hairline text-muted-foreground"
              }`}
            >
              {saver.isPending ? "Saving…" : ads.lean_mode ? "ON — FB safe" : "OFF — full stack"}
            </button>
            <p className="mt-2 max-w-52 text-xs text-muted-foreground">
              ON = only Free Vault + smartlink anchors. No pop-under, vignette or push script loads.
            </p>
          </div>
        </div>
      </div>

      <div className="panel mt-4 p-4">
        <h2 className="font-display text-sm font-semibold">Checklist</h2>
        <ul className="mt-2">
          {audit.findings.map((finding) => (
            <FindingRow key={finding.id} finding={finding} />
          ))}
        </ul>
      </div>

      <div className="panel mt-4 p-4 text-sm text-muted-foreground">
        <h2 className="font-display text-sm font-semibold text-foreground">Campaign checklist</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Turn Lean Mode ON before submitting the ad for review.</li>
          <li>
            Use <code className="font-mono">sensesofvoid.app/?t=&lt;tool&gt;&amp;utm_source=&lt;creative&gt;</code>{" "}
            as the destination — never a smartlink URL.
          </li>
          <li>Keep the ad promise identical to the tool headline the visitor lands on.</li>
          <li>Re-run this scan after any ad-settings change.</li>
        </ol>
      </div>
    </div>
  );
}
