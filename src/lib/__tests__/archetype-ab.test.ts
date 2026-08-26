import { describe, expect, it } from "vitest";

import { ARCHETYPE_ARMS, armCopy, MIN_VIEWS_PER_ARM, pickArm } from "@/lib/archetype-ab";

const full = (slug: string, ctrs: number[]) =>
  ARCHETYPE_ARMS.map((arm, i) => ({
    slug,
    arm,
    views: MIN_VIEWS_PER_ARM,
    clicks: Math.round(MIN_VIEWS_PER_ARM * ctrs[i]!),
  }));

describe("archetype A/B", () => {
  it("rotates when data is thin", () => {
    expect(pickArm("void-monarch", []).reason).toBe("rotation");
  });

  it("locks the clear winner", () => {
    const decision = pickArm("void-monarch", full("void-monarch", [0.02, 0.09, 0.03]));
    expect(decision.reason).toBe("winner");
    expect(decision.arm).toBe("curiosity");
  });

  it("keeps rotating when arms are within noise", () => {
    expect(pickArm("void-monarch", full("void-monarch", [0.05, 0.051, 0.05])).reason).toBe(
      "rotation",
    );
  });

  it("is stable within a week", () => {
    const now = new Date("2026-02-10T00:00:00Z");
    expect(pickArm("x", [], now).arm).toBe(pickArm("x", [], now).arm);
  });

  it("produces distinct copy per arm", () => {
    const base = {
      name: "The Void Monarch",
      short: "Monarch",
      baseTitle: "Void Monarch",
      baseDescription: "desc",
      tagline: "tag",
      rarity: "≈ 4%",
    };
    const titles = ARCHETYPE_ARMS.map((arm) => armCopy({ ...base, arm }).title);
    expect(new Set(titles).size).toBe(3);
  });
});
