/**
 * A/B test for the VIP gate + checkout entry.
 *
 * Only copy changes between arms — price, plans and payment flow stay
 * identical, so the measured difference is purely persuasion. The arm is
 * sticky per visitor (localStorage) and exposed on every gate view /
 * checkout start as an `experiment` event, which lets the admin orders
 * dashboard join it to real paid orders through the session id.
 */

export const VIP_GATE_ARMS = ["value", "loss", "speed"] as const;
export type VipGateArm = (typeof VIP_GATE_ARMS)[number];

export type VipGateCopy = {
  arm: VipGateArm;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Primary button label on the card tab. */
  cta: string;
  /** One line under the button — removes the "is this safe?" hesitation. */
  reassurance: string;
};

const COPY: Record<VipGateArm, Omit<VipGateCopy, "arm">> = {
  value: {
    eyebrow: "Ad-free access",
    title: "Senses of Void VIP",
    subtitle: "Pick a month to try it, or pay once and keep it forever.",
    cta: "Continue to secure checkout",
    reassurance: "Apple Pay · Google Pay · card — 30 seconds, no account needed",
  },
  loss: {
    eyebrow: "Launch price ends soon",
    title: "Keep your full report — ad-free",
    subtitle: "Unlock every export, remove the gate, and keep all future tools at today's price.",
    cta: "Unlock my full report",
    reassurance: "One tap with Apple Pay · instant unlock · no subscription trap",
  },
  speed: {
    eyebrow: "30-second unlock",
    title: "Unlock everything instantly",
    subtitle: "No signup, no forms. Pay and your report opens on this device right away.",
    cta: "Pay & unlock now",
    reassurance: "Apple Pay / Google Pay in one tap — email optional",
  },
};

const KEY = "sov.vipGateArm";
const ROTOR_KEY = "sov.vipGateArm.rotor";

/**
 * True 33/33/33 allocation.
 *
 * `Math.random()` alone drifts badly at the sample sizes this funnel sees (a
 * live read showed 45/7/3). A device-local rotor walks the arms in a shuffled
 * cycle, so every block of three new visitors on this browser covers all three
 * arms exactly once; the random start keeps the assignment unpredictable.
 */
function balancedIndex(size: number): number {
  try {
    const raw = Number(window.localStorage.getItem(ROTOR_KEY));
    const cursor = Number.isFinite(raw) && raw >= 0 ? raw : unbiasedInt(size);
    window.localStorage.setItem(ROTOR_KEY, String((cursor + 1) % size));
    return cursor % size;
  } catch {
    return unbiasedInt(size);
  }
}

/** Modulo-bias-free random integer in [0, size). */
function unbiasedInt(size: number): number {
  const crypto = typeof window !== "undefined" ? window.crypto : undefined;
  if (crypto?.getRandomValues) {
    const limit = Math.floor(4294967296 / size) * size;
    const buf = new Uint32Array(1);
    for (let i = 0; i < 20; i += 1) {
      crypto.getRandomValues(buf);
      if (buf[0]! < limit) return buf[0]! % size;
    }
  }
  return Math.floor(Math.random() * size);
}

/** Sticky per-visitor VIP gate arm. */
export function vipGateArm(): VipGateArm {
  if (typeof window === "undefined") return "value";
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored && (VIP_GATE_ARMS as readonly string[]).includes(stored)) {
      return stored as VipGateArm;
    }
    const picked = VIP_GATE_ARMS[balancedIndex(VIP_GATE_ARMS.length)]!;
    window.localStorage.setItem(KEY, picked);
    return picked;
  } catch {
    return "value";
  }
}

export function vipGateCopy(arm: VipGateArm): VipGateCopy {
  return { arm, ...COPY[arm] };
}

/** Slots used for the exposure / progression events of this experiment. */
export const VIP_GATE_VIEW_SLOT = "vip_gate_view";
export const VIP_CHECKOUT_SLOT = "vip_checkout_start";
