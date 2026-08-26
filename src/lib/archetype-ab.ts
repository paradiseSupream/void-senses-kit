/**
 * A/B testing for archetype landing pages.
 *
 * Each page has three arms that change the SEO title, the meta description and
 * the hero CTA. Arms are resolved on the server so crawlers and the visitor see
 * the same variant, and the winner is auto-selected from measured on-page CTR
 * (hero view → CTA click) once an arm has enough exposure.
 */

export const ARCHETYPE_ARMS = ["authority", "curiosity", "identity"] as const;
export type ArchetypeArm = (typeof ARCHETYPE_ARMS)[number];

export type ArmCopy = {
  arm: ArchetypeArm;
  title: string;
  description: string;
  cta: string;
  /** One-line promise under the hero CTA. */
  promise: string;
};

export type ArmStat = { slug: string; arm: ArchetypeArm; views: number; clicks: number };

/** Minimum exposures per arm before a winner may be locked in. */
export const MIN_VIEWS_PER_ARM = 200;

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

/** ISO-ish week bucket so an unresolved test rotates weekly, never per request. */
export function weekBucket(now = new Date()): number {
  return Math.floor(now.getTime() / (7 * 86_400_000));
}

/**
 * Winner by CTR when every arm cleared the exposure floor and the leader is at
 * least 10% better in relative terms; otherwise a stable weekly rotation.
 */
export function pickArm(
  slug: string,
  stats: ArmStat[],
  now = new Date(),
): { arm: ArchetypeArm; reason: "winner" | "rotation" } {
  const rows = stats.filter((row) => row.slug === slug);
  const byArm = ARCHETYPE_ARMS.map((arm) => {
    const row = rows.find((r) => r.arm === arm);
    const views = row?.views ?? 0;
    const clicks = row?.clicks ?? 0;
    return { arm, views, ctr: views > 0 ? clicks / views : 0 };
  });
  const eligible = byArm.filter((row) => row.views >= MIN_VIEWS_PER_ARM);
  if (eligible.length === ARCHETYPE_ARMS.length) {
    const sorted = [...eligible].sort((a, b) => b.ctr - a.ctr);
    const leader = sorted[0]!;
    const runnerUp = sorted[1]!;
    if (leader.ctr > 0 && leader.ctr >= runnerUp.ctr * 1.1) {
      return { arm: leader.arm, reason: "winner" };
    }
  }
  const index = (hash(slug) + weekBucket(now)) % ARCHETYPE_ARMS.length;
  return { arm: ARCHETYPE_ARMS[index]!, reason: "rotation" };
}

/** Builds the three copy arms for one archetype page. */
export function armCopy(input: {
  arm: ArchetypeArm;
  name: string;
  short: string;
  baseTitle: string;
  baseDescription: string;
  tagline: string;
  rarity: string;
}): ArmCopy {
  const { arm, name, short, baseTitle, baseDescription, tagline, rarity } = input;
  if (arm === "curiosity") {
    return {
      arm,
      title: `Are You ${name}? The ${short} Shadow Profile Explained`,
      description: `${tagline} Find out whether the ${short} pattern is yours — signs, strengths, blind spots and a free 6-axis shadow test.`,
      cta: "Find out if this is you — free test",
      promise: "3 minutes · no signup · instant archetype",
    };
  }
  if (arm === "identity") {
    return {
      arm,
      title: `${name}: ${rarity} of People Share This Shadow Profile`,
      description: `Only ${rarity.replace(/^≈\s*/, "")} land on ${name}. Read the full profile, then score your own six shadow axes free.`,
      cta: `Score my shadow axes — free`,
      promise: `${rarity} match this profile`,
    };
  }
  return {
    arm,
    title: baseTitle,
    description: baseDescription,
    cta: "Am I this archetype? Free test",
    promise: "Six-axis psychometric read · results in 3 minutes",
  };
}
