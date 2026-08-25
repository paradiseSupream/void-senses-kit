import { createServerFn } from "@tanstack/react-start";

import type { Dossier } from "@/lib/archetype-core";

export type PremiumDossierResult =
  | { ok: true; dossier: Dossier; pdfToken: string; expiresAt: number }
  | { ok: false; reason: "locked" | "invalid" };

/**
 * Premium dossier delivery.
 *
 * The browser sends the axis vector plus its proof of purchase; the server
 * verifies the payment against `vip_orders` / `vip_members`, generates the
 * premium text, and returns it with a short-lived signed token for the PDF
 * endpoint. Anonymous callers get `{ ok: false, reason: "locked" }` and no text.
 */
export const getPremiumDossier = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      axes: { dim: string; value: number }[];
      orderId?: string | null;
      licenseKey?: string | null;
      name?: string | null;
    }) => ({
      axes: (Array.isArray(input?.axes) ? input.axes : [])
        .slice(0, 12)
        .map((axis) => ({
          dim: String(axis?.dim ?? "").slice(0, 40),
          value: Math.max(0, Math.min(100, Math.round(Number(axis?.value) || 0))),
        })),
      orderId: input?.orderId ? String(input.orderId).slice(0, 80) : null,
      licenseKey: input?.licenseKey ? String(input.licenseKey).slice(0, 80) : null,
      name: input?.name ? String(input.name).slice(0, 60) : null,
    }),
  )
  .handler(async ({ data }): Promise<PremiumDossierResult> => {
    if (data.axes.length === 0) return { ok: false, reason: "invalid" };

    const { setResponseHeader } = await import("@tanstack/react-start/server");
    // Premium payloads must never be stored by a shared or browser cache.
    setResponseHeader("Cache-Control", "no-store, private, max-age=0");

    const { resolveEntitlement, sanitizeProof } = await import("@/lib/entitlement.server");
    const proof = sanitizeProof(data);
    const entitlement = await resolveEntitlement(proof);
    if (!entitlement.vip) return { ok: false, reason: "locked" };

    const { buildDossier } = await import("@/lib/archetype-premium.server");
    const { signReportToken, REPORT_TOKEN_TTL_MS } = await import("@/lib/report-token.server");

    const dossier = buildDossier(data.axes);
    const expiresAt = Date.now() + REPORT_TOKEN_TTL_MS;
    const pdfToken = await signReportToken({
      axes: dossier.axes.map((axis) => ({ dim: axis.dim, value: axis.value })),
      orderId: proof.orderId,
      licenseKey: proof.licenseKey,
      name: data.name,
      exp: expiresAt,
    });

    return { ok: true, dossier, pdfToken, expiresAt };
  });
