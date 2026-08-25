import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the paywall: no client file may grant VIP from a URL flag, and no
 * Whop secret may ever appear outside a `.server.ts` module.
 */
const SRC = join(process.cwd(), "src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const files = walk(SRC)
  .filter((path) => !path.includes("__tests__"))
  .map((path) => ({ path, code: readFileSync(path, "utf8") }));

describe("paywall integrity", () => {
  it("never trusts a success flag from the URL", () => {
    const offenders = files.filter(
      ({ code }) => code.includes('"vip_success"') || code.includes('"matrix_success"'),
    );
    // The only allowed mention is stripping the legacy params in vip-unlock.
    const bad = offenders.filter(
      ({ path }) => !path.endsWith("vip-unlock.ts") && !path.endsWith("vip.functions.ts"),
    );
    expect(bad.map((f) => f.path)).toEqual([]);
  });

  it("grants VIP only through server-verified entitlement", () => {
    const unlock = files.find((f) => f.path.endsWith("lib/vip-unlock.ts"));
    expect(unlock?.code).toContain("verifyEntitlement");
    expect(unlock?.code).toContain("result.vip");
  });

  it("keeps Whop credentials out of client-reachable modules", () => {
    const leaks = files.filter(
      ({ path, code }) =>
        /WHOP_(API_KEY|WEBHOOK_SECRET|ACCOUNT_ID)/.test(code) &&
        !path.includes(".server.") &&
        !path.includes("routes/api/"),
    );
    expect(leaks.map((f) => f.path)).toEqual([]);
  });
});
