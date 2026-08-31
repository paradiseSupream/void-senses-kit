import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/**
 * Baseline security headers.
 *
 * CSP ships in report-only mode so the monetisation network scripts keep
 * earning while violations stay observable; the enforced headers below are the
 * ones that reduce dossier/PDF exposure (no sniffing, no framing, trimmed
 * referrers) without breaking ad revenue.
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https:",
  "frame-src https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https:",
  "frame-ancestors 'self'",
].join("; ");

/** Premium payloads must never be cached by a browser or a shared cache. */
function isPremiumPath(pathname: string): boolean {
  return pathname.startsWith("/api/dossier-pdf") || pathname.startsWith("/_serverFn");
}

function withSecurityHeaders(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  // `payment=(self)` silently disabled Apple Pay / Google Pay inside the Whop
  // checkout iframe ("payment is not allowed in this document"), which is why
  // checkout sessions were created but never completed. The provider origins
  // must be allow-listed for the Payment Request API to work.
  // Camera stays available to the provider only, so mobile buyers can scan a
  // card instead of typing 16 digits; clipboard-write keeps paste-to-copy
  // affordances alive inside the same frame.
  headers.set(
    "Permissions-Policy",
    [
      'camera=(self "https://whop.com")',
      "microphone=()",
      "geolocation=()",
      'payment=(self "https://whop.com" "https://js.stripe.com" "https://checkout.whop.com")',
      'publickey-credentials-get=(self "https://whop.com")',
      'clipboard-write=(self "https://whop.com")',
    ].join(", "),
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (!headers.has("Content-Security-Policy-Report-Only")) {
    headers.set("Content-Security-Policy-Report-Only", CSP_REPORT_ONLY);
  }

  const pathname = (() => {
    try {
      return new URL(request.url).pathname;
    } catch {
      return "/";
    }
  })();
  if (pathname === "/.well-known/apple-developer-merchantid-domain-association") {
    // Match the provider's canonical response exactly enough for strict
    // merchant-domain validators, which can reject generic text MIME types.
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", 'inline; filename="apple-developer-merchantid-domain-association"');
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }
  if (isPremiumPath(pathname)) {
    headers.set("Cache-Control", "no-store, private, max-age=0");
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

