import { describe, expect, it } from "vitest";

import { auditMetaCompliance, type ComplianceInput } from "@/lib/fb-compliance";

const FULL: ComplianceInput = {
  enabled: true,
  lean_mode: false,
  monetag_inpage_push: true,
  monetag_vignette: true,
  monetag_popunder: true,
  adsterra_social_bar: true,
  adsterra_social_bar_src: "https://example.com/bar.js",
  gateSlotEnabled: true,
  consentRequired: true,
};

describe("auditMetaCompliance", () => {
  it("blocks when pop-under or vignette can run", () => {
    const audit = auditMetaCompliance(FULL);
    expect(audit.verdict).toBe("blocked");
    expect(audit.blockers).toBeGreaterThanOrEqual(2);
    expect(audit.score).toBeLessThan(50);
  });

  it("clears every third-party risk in lean mode", () => {
    const audit = auditMetaCompliance({ ...FULL, lean_mode: true, gateSlotEnabled: false });
    expect(audit.blockers).toBe(0);
    expect(audit.verdict).toBe("ready");
    expect(audit.score).toBe(100);
    expect(audit.findings.every((f) => f.severity === "pass")).toBe(true);
  });

  it("flags a disabled consent banner", () => {
    const audit = auditMetaCompliance({ ...FULL, lean_mode: true, consentRequired: false });
    expect(audit.findings.find((f) => f.id === "consent")?.severity).toBe("warn");
  });
});
