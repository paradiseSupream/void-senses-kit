import { createFileRoute } from "@tanstack/react-router";

/**
 * Entitlement-checked PDF endpoint.
 *
 * Accepts only a signed, unexpired report token minted by `getPremiumDossier`,
 * then re-verifies the payment behind that token before rendering a single byte.
 * No token, an expired token, a tampered token or a refunded order → 401/403 and
 * no premium content. Responses are `no-store` so nothing lands in a cache.
 */
export const Route = createFileRoute("/api/dossier-pdf")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const deny = (status: number, message: string) =>
          new Response(message, {
            status,
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "cache-control": "no-store, private, max-age=0",
            },
          });

        let token = "";
        try {
          const body = (await request.json()) as { token?: unknown };
          token = typeof body?.token === "string" ? body.token : "";
        } catch {
          return deny(400, "Bad request");
        }
        if (!token) return deny(401, "Unauthorized");

        const { verifyReportToken } = await import("@/lib/report-token.server");
        const payload = await verifyReportToken(token);
        if (!payload) return deny(401, "Unauthorized");

        const { resolveEntitlement } = await import("@/lib/entitlement.server");
        const entitlement = await resolveEntitlement({
          orderId: payload.orderId,
          licenseKey: payload.licenseKey,
        });
        if (!entitlement.vip) return deny(403, "Forbidden");

        const { buildDossier } = await import("@/lib/archetype-premium.server");
        const { buildDossierPdf } = await import("@/lib/pdf-build.server");
        const dossier = buildDossier(payload.axes);
        const bytes = buildDossierPdf(dossier, payload.name);

        return new Response(bytes as unknown as BodyInit, {
          status: 200,
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="senses-of-void-${dossier.archetype.key}-dossier.pdf"`,
            "cache-control": "no-store, private, max-age=0",
            "x-content-type-options": "nosniff",
            "x-robots-tag": "noindex, nofollow",
          },
        });
      },
    },
  },
});
