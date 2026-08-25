import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static guards for the entitlement chain. These assert structural security
 * properties that cannot regress silently during a refactor:
 * payment → verified webhook → database → verifyEntitlement → VIP content.
 */
const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");
const files = walk(SRC)
  .filter((p) => !p.includes("__tests__"))
  .map((path) => ({ path, code: readFileSync(path, "utf8") }));

describe("entitlement input surface", () => {
  const vipFns = read("lib/vip.functions.ts");

  it("verifyEntitlement never accepts a browser-supplied email as proof", () => {
    const validator = vipFns.slice(
      vipFns.indexOf("export const verifyEntitlement"),
      vipFns.indexOf(".handler(", vipFns.indexOf("export const verifyEntitlement")),
    );
    // The validator may see an email field for backwards compatibility but must
    // not forward it into the handler's data object.
    expect(validator).toContain("orderId:");
    expect(validator).toContain("licenseKey:");
    expect(validator).not.toMatch(/email:\s*input\?\.email/);
  });

  it("only order ids and license keys can start a verification", () => {
    expect(vipFns).toContain("if (!data.orderId && !data.licenseKey) return empty");
  });

  it("only orders marked paid grant anything", () => {
    expect(vipFns).toContain('row?.status === "paid"');
    // Matrix restore is scoped to paid sovm_ orders only.
    expect(vipFns).toContain('.eq("status", "paid")');
  });

  it("cross-device restore requires the server-issued license key", () => {
    const restore = vipFns.slice(vipFns.indexOf("export const restoreVipAccess"));
    expect(restore).toContain("if (!data.licenseKey) return denied");
    expect(restore).toContain("lookupVipByLicense");
    // The license must belong to the email that was typed in.
    expect(restore).toContain('(access.email ?? "") !== data.email');
  });

  it("license lookup is constant-shape and format-validated", () => {
    const fulfil = read("lib/vip-fulfil.server.ts");
    expect(fulfil).toContain("export async function lookupVipByLicense");
    expect(fulfil).toMatch(/\/\^\[0-9a-f\]\{16,64\}\$\//);
    expect(fulfil).toContain('.eq("license_key", key)');
  });

  it("prices are resolved server-side, never taken from the client", () => {
    expect(vipFns).toContain("const PRICES:");
    expect(vipFns).toContain("lifetime: { full: 1900, offer: 900 }");
    expect(vipFns).toContain("monthly: { full: 499, offer: 299 }");
    expect(vipFns).toContain("const AMOUNT_CENTS = 900");
    expect(vipFns).not.toMatch(/amountCents:\s*(input|data)\.amountCents/);
  });
});

describe("webhook is the only writer of paid state", () => {
  const hook = read("routes/api/public/whop-webhook.ts");

  it("verifies the signature before touching the payload", () => {
    const verifyAt = hook.indexOf("verifyWhopWebhook(raw");
    const parseAt = hook.indexOf("JSON.parse(raw)");
    expect(verifyAt).toBeGreaterThan(-1);
    expect(parseAt).toBeGreaterThan(verifyAt);
    expect(hook).toContain('return new Response("Invalid signature", { status: 401 })');
  });

  it("only paid/activated events grant, and terminal orders never re-open", () => {
    expect(hook).toContain('parsed.type === "payment.succeeded"');
    expect(hook).toContain('order.status === "refunded" || order.status === "cancelled"');
    expect(hook).toContain('.update({ active: false })');
  });

  it("has replay protection and a timing-safe comparison", () => {
    const whop = read("lib/whop.server.ts");
    expect(whop).toContain("webhook-timestamp");
    expect(whop).toContain("> 300"); // 5-minute replay window
    expect(whop).toContain("timingSafeEqual");
    expect(whop).toContain("createHmac");
  });

  it("grantVip is idempotent per email", () => {
    const fulfil = read("lib/vip-fulfil.server.ts");
    expect(fulfil).toContain('.from("vip_members")');
    expect(fulfil).toContain("if (existing) {");
  });
});

describe("client cache cannot be mistaken for proof", () => {
  it("the VIP provider revalidates cached flags against the server", () => {
    const vip = read("lib/vip.tsx");
    expect(vip).toContain("verifyEntitlement");
    expect(vip).toContain("if (!result.vip) revoke()");
    // Only proofs are sent; the stored email is not an entitlement input.
    expect(vip).toContain("sov.vip.license");
    expect(vip).not.toMatch(/verify\(\{ data: \{ orderId, email \} \}\)/);
  });

  it("the unlock hook drops spoofable URL params without granting", () => {
    const unlock = read("lib/vip-unlock.ts");
    expect(unlock).toContain('stripParams(["vip_success", "matrix_success"');
    expect(unlock).toContain("verifyEntitlement");
    expect(unlock).toContain("if (result.vip)");
    expect(unlock).not.toMatch(/vip_success[^)]*\)\s*\)?\s*{\s*setVip\(true/);
  });

  it("no module grants VIP from a URL flag", () => {
    const offenders = files.filter(({ path, code }) => {
      if (path.endsWith("vip-unlock.ts") || path.endsWith("vip.functions.ts")) return false;
      return /vip_success|matrix_success/.test(code);
    });
    expect(offenders.map((f) => f.path)).toEqual([]);
  });
});

describe("secrets stay server-side", () => {
  it("no Whop credential is reachable from a client module", () => {
    const leaks = files.filter(
      ({ path, code }) =>
        /WHOP_(API_KEY|WEBHOOK_SECRET|ACCOUNT_ID)/.test(code) &&
        !path.includes(".server.") &&
        !path.includes("routes/api/"),
    );
    expect(leaks.map((f) => f.path)).toEqual([]);
  });

  it("no VITE_ variable exposes a payment or service secret", () => {
    const bad = files.filter(({ code }) =>
      /VITE_[A-Z_]*(WHOP|SERVICE_ROLE|SECRET|API_KEY)/.test(code),
    );
    expect(bad.map((f) => f.path)).toEqual([]);
    const env = readFileSync(join(process.cwd(), ".env"), "utf8");
    expect(/VITE_[A-Z_]*(WHOP|SERVICE_ROLE|SECRET)/.test(env)).toBe(false);
  });

  it("the admin service-role client is only imported inside handlers", () => {
    const offenders = files.filter(
      ({ path, code }) =>
        /^import .*client\.server/m.test(code) && !path.includes(".server."),
    );
    expect(offenders.map((f) => f.path)).toEqual([]);
  });
});

describe("tool isolation", () => {
  const importers = files.filter(({ code }) => /from "@\/lib\/archetype"/.test(code)).map((f) => f.path);

  it("the 6-axis archetype engine is only used by the Dark Personality surface", () => {
    const allowed = [
      "routes/tools.dark-personality.tsx",
      "components/tools/ShadowDossier.tsx",
      "components/monetization/MatrixUpsellModal.tsx",
      "lib/dossier-pdf.ts",
    ];
    for (const path of importers) {
      expect(allowed.some((a) => path.endsWith(a))).toBe(true);
    }
  });

  it("the dark item bank is not read by another tool", () => {
    const bankUsers = files
      .filter(({ code }) => /from "@\/lib\/banks\/dark"/.test(code))
      .map((f) => f.path);
    for (const path of bankUsers) {
      expect(/dark-personality|archetype|dossier-pdf|ShadowDossier|MatrixUpsell/.test(path)).toBe(true);
    }
  });

  it("each quiz tool owns its own bank", () => {
    const pairs: [string, string][] = [
      ["routes/tools.child-trauma.tsx", "banks/trauma"],
      ["routes/tools.iq.tsx", "banks/iq"],
      ["routes/tools.love-match.tsx", "banks/love"],
      ["routes/tools.dark-personality.tsx", "banks/dark"],
    ];
    for (const [route, bank] of pairs) {
      const code = read(route.replace(/^/, ""));
      expect(code).toContain(bank);
      const others = pairs.filter(([, b]) => b !== bank).map(([, b]) => b);
      for (const other of others) expect(code).not.toContain(other);
    }
  });
});
