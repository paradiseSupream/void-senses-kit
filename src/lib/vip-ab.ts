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

/** Sticky per-visitor VIP gate arm. */
export function vipGateArm(): VipGateArm {
  if (typeof window === "undefined") return "value";
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored && (VIP_GATE_ARMS as readonly string[]).includes(stored)) {
      return stored as VipGateArm;
    }
    const picked = VIP_GATE_ARMS[Math.floor(Math.random() * VIP_GATE_ARMS.length)]!;
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
