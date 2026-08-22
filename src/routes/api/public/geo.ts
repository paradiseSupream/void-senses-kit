import { createFileRoute } from "@tanstack/react-router";

import { tierOf } from "@/lib/ad-policy";

/**
 * Tiny edge endpoint: resolves the visitor's country from the CDN header so the
 * client can pick a tier-appropriate ad stack. No IP, no storage, cacheable.
 */
export const Route = createFileRoute("/api/public/geo")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const raw =
          request.headers.get("cf-ipcountry") ??
          request.headers.get("x-vercel-ip-country") ??
          request.headers.get("x-country-code") ??
          "";
        const code = raw.trim().toUpperCase().slice(0, 2);
        const country = /^[A-Z]{2}$/.test(code) ? code : null;
        return new Response(JSON.stringify({ country, tier: tierOf(country) }), {
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=600",
          },
        });
      },
    },
  },
});
