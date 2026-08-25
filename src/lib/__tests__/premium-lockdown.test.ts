import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Guards the server-side lockdown of premium content:
 * premium text lives only in server modules, the PDF is rendered server-side,
 * and the report token cannot be forged or replayed after it expires.
 */
const SRC = join(process.cwd(), "src");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const clientFiles = walk(SRC).filter(
  (path) =>
    !path.includes("__tests__") &&
    !/\.server\.ts$/.test(path) &&
    !path.endsWith("dossier.functions.ts") &&
    !path.includes(join("routes", "api")),
);

describe("premium content never reaches the client bundle", () => {
  it("keeps the premium engine in a .server module", () => {
    const premium = read("lib/archetype-premium.server.ts");
    expect(premium).toContain("export const PREMIUM_ARCHETYPES");
    expect(premium).toContain("export function buildDossier");
  });

  it("no client-reachable module imports the premium engine", () => {
    const offenders = clientFiles.filter((path) =>
      readFileSync(path, "utf8").includes("archetype-premium.server"),
    );
    expect(offenders).toEqual([]);
  });

  it("the client-safe engine ships no premium prose", () => {
    const core = read("lib/archetype-core.ts");
    for (const field of ["analysis:", "mastery:", "matrix:", "blindSpot:", "defense:", "bands:"]) {
      // Type declarations are fine; populated premium data is not.
      expect(core.includes(`${field} [`)).toBe(false);
      expect(core.includes(`${field} "`)).toBe(false);
    }
  });

  it("the browser PDF module holds no dossier text and only forwards a token", () => {
    const client = read("lib/dossier-pdf.ts");
    expect(client).toContain("/api/dossier-pdf");
    expect(client).toContain("JSON.stringify({ token: pdfToken })");
    expect(client).not.toContain("jspdf");
    expect(client).not.toContain("Blind spot");
  });

  it("the dossier server function requires a verified entitlement", () => {
    const fn = read("lib/dossier.functions.ts");
    expect(fn).toContain("resolveEntitlement");
    expect(fn).toContain('if (!entitlement.vip) return { ok: false, reason: "locked" }');
    expect(fn.indexOf("resolveEntitlement")).toBeLessThan(fn.indexOf("buildDossier"));
    expect(fn).toContain("no-store");
  });

  it("the PDF endpoint verifies token then entitlement before rendering", () => {
    const route = read("routes/api/dossier-pdf.ts");
    expect(route).toContain("verifyReportToken");
    expect(route).toContain("resolveEntitlement");
    expect(route.indexOf("verifyReportToken")).toBeLessThan(route.indexOf("buildDossierPdf"));
    expect(route).toContain('deny(403, "Forbidden")');
    expect(route).toContain("no-store");
  });

  it("edge responses carry the hardening headers", () => {
    const server = read("../src/server.ts");
    expect(server).toContain("X-Content-Type-Options");
    expect(server).toContain("Referrer-Policy");
    expect(server).toContain("Content-Security-Policy-Report-Only");
    expect(server).toContain("no-store, private, max-age=0");
  });
});

describe("signed report tokens", () => {
  beforeAll(() => {
    process.env["REPORT_TOKEN_SECRET"] = "test-secret-for-report-tokens";
  });

  const axes = [
    { dim: "Machiavellianism", value: 80 },
    { dim: "Cognition", value: 70 },
  ];

  it("round-trips a valid token", async () => {
    const { signReportToken, verifyReportToken } = await import("@/lib/report-token.server");
    const token = await signReportToken({
      axes,
      orderId: "sov_test_order_1234",
      licenseKey: null,
      name: "Tester",
    });
    const payload = await verifyReportToken(token);
    expect(payload?.orderId).toBe("sov_test_order_1234");
    expect(payload?.axes).toHaveLength(2);
  });

  it("rejects a tampered payload", async () => {
    const { signReportToken, verifyReportToken } = await import("@/lib/report-token.server");
    const token = await signReportToken({ axes, orderId: "sov_a", licenseKey: null, name: null });
    const [body, mac] = token.split(".");
    const forged = `${btoa(JSON.stringify({ axes, orderId: "sov_b", exp: Date.now() + 60_000 }))
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")}.${mac}`;
    expect(await verifyReportToken(forged)).toBeNull();
    expect(await verifyReportToken(`${body}.${mac?.slice(0, -2)}xx`)).toBeNull();
    expect(await verifyReportToken("")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const { signReportToken, verifyReportToken } = await import("@/lib/report-token.server");
    const token = await signReportToken({
      axes,
      orderId: "sov_a",
      licenseKey: null,
      name: null,
      exp: Date.now() - 1000,
    });
    expect(await verifyReportToken(token)).toBeNull();
  });
});

describe("server-rendered PDF", () => {
  it("produces a valid dark-themed PDF for a full dossier", async () => {
    const { buildDossier } = await import("@/lib/archetype-premium.server");
    const { buildDossierPdf } = await import("@/lib/pdf-build.server");
    const dossier = buildDossier([
      { dim: "Machiavellianism", value: 82 },
      { dim: "Narcissism", value: 61 },
      { dim: "Psychopathy", value: 40 },
      { dim: "Detachment", value: 70 },
      { dim: "Cognition", value: 90 },
      { dim: "Shadow", value: 35 },
    ]);
    const bytes = buildDossierPdf(dossier, "Tester");
    const text = new TextDecoder().decode(bytes);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(text).toContain("/Type /Catalog");
    expect(bytes.byteLength).toBeGreaterThan(20_000);
  });
});
