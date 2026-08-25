import { it } from "vitest";
import { ARCHETYPES, buildDossier } from "@/lib/archetype";
import { DARK_DIMS } from "@/lib/banks/dark";
it("words", () => {
  for (const a of ARCHETYPES) {
    // craft vector that makes this archetype win: use its weights
    const v = DARK_DIMS.map((d) => ({ dim: d, value: (a.weights as any)[d] > 0 ? 90 : 20 }));
    const dos = buildDossier(v);
    console.log(dos.archetype.key, dos.words, "(target", a.key, ")");
  }
});
