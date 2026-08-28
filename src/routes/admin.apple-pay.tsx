import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { adminCheckApplePay, type ApplePayCheckResult } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/apple-pay")({
  head: () => ({
    meta: [
      { title: "Apple Pay Domain Check — Senses of Void" },
      {
        name: "description",
        content:
          "Verify Apple Pay merchant domain association file is served correctly across all domains.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Apple Pay Domain Check — Senses of Void" },
      { property: "og:description", content: "Private operator Apple Pay verification tool." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplePayCheckPage,
});

const TOKEN_KEY = "sov.adminToken";

function ApplePayCheckPage() {
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<ApplePayCheckResult | null>(null);

  useEffect(() => {
    try {
      setToken(window.sessionStorage.getItem(TOKEN_KEY));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const check = useServerFn(adminCheckApplePay);

  const mutation = useMutation({
    mutationFn: (input: { token: string }) => check({ data: input }),
    onSuccess: (data) => {
      setResult(data);
      if (data.allOk) toast.success("All domains verified ✅");
      else toast.error("One or more domains need attention.");
    },
    onError: () => toast.error("Session expired — sign in again."),
  });

  useEffect(() => {
    if (token) mutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <div className="panel p-6 text-center">
          <AlertTriangle className="mx-auto size-6 text-amber-400" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to the admin panel first.
          </p>
          <Link
            to="/admin"
            className="btn-glow mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Go to admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            to="/admin"
            className="label-mono flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" aria-hidden="true" /> back to admin
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Apple Pay Domain Check
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifies <code className="font-mono text-xs text-foreground/80">
              /.well-known/apple-developer-merchantid-domain-association
            </code> is served with HTTP 200 and contains the Whop PSP ID.
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutation.mutate({ token })}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${mutation.isPending ? "animate-spin" : ""}`} aria-hidden="true" />
          Re-check
        </button>
      </div>

      {/* Summary banner */}
      {result ? (
        <div
          className={`mt-6 flex items-center gap-3 rounded-xl border p-4 ${
            result.allOk
              ? "border-primary/40 bg-primary/10"
              : "border-amber-400/40 bg-amber-400/10"
          }`}
        >
          {result.allOk ? (
            <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-5 text-amber-400" aria-hidden="true" />
          )}
          <div>
            <p className="font-display text-sm font-semibold">
              {result.allOk
                ? "All domains serving the Apple Pay association file correctly."
                : "Some domains are not ready — see details below."}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Last checked: {new Date(result.checkedAt).toLocaleString()}
            </p>
          </div>
        </div>
      ) : null}

      {/* Per-domain results */}
      <div className="mt-6 space-y-4">
        {result ? (
          result.results.map((r) => (
            <div key={r.url} className="panel overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-foreground/80">{r.url}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-1 font-mono text-xs font-semibold ${
                      r.ok
                        ? "bg-primary/15 text-primary"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    HTTP {r.status || "—"}
                  </span>
                  {r.ok && r.hasPspId ? (
                    <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                  ) : (
                    <XCircle className="size-4 text-destructive" aria-hidden="true" />
                  )}
                </div>
              </div>
              <div className="space-y-2 px-4 py-3 text-sm">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Content-Type:{" "}
                    <span className="font-mono text-foreground/80">
                      {r.contentType || "—"}
                    </span>
                  </span>
                  <span>
                    PSP ID:{" "}
                    <span
                      className={`font-mono ${
                        r.hasPspId ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {r.hasPspId ? "found ✓" : "missing ✗"}
                    </span>
                  </span>
                </div>
                {r.bodyPreview ? (
                  <pre className="max-h-32 overflow-auto rounded-lg border border-hairline bg-surface-2 p-3 font-mono text-xs text-muted-foreground">
                    {r.bodyPreview}
                  </pre>
                ) : null}
              </div>
            </div>
          ))
        ) : mutation.isPending ? (
          <div className="panel p-8 text-center">
            <RefreshCw className="mx-auto size-5 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">Checking all domains…</p>
          </div>
        ) : null}
      </div>

      {/* Instructions */}
      <div className="mt-6 panel p-4">
        <h2 className="font-display text-sm font-semibold">How to fix</h2>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="label-mono">1.</span> In Whop → Apple Pay →{" "}
            <span className="text-foreground/80">Verify domain</span>, download the
            verification file.
          </li>
          <li>
            <span className="label-mono">2.</span> Upload it here (or tell the agent the
            file contents) so it lands at{" "}
            <code className="font-mono text-xs text-foreground/80">
              public/.well-known/apple-developer-merchantid-domain-association
            </code>
            .
          </li>
          <li>
            <span className="label-mono">3.</span> Publish the site, then press{" "}
            <span className="text-foreground/80">Re-check</span> above — all domains should
            show HTTP 200 with PSP ID found ✓.
          </li>
          <li>
            <span className="label-mono">4.</span> Go back to Whop and press{" "}
            <span className="text-foreground/80">Verify domain</span> — it should turn
            green.
          </li>
        </ol>
      </div>
    </div>
  );
}
