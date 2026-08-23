import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const VIP_KEY = "sov.vip";
const PLAN_KEY = "sov.vip.plan";
const UNTIL_KEY = "sov.vip.until";

export type VipPlan = "lifetime" | "monthly";

type VipContextValue = {
  isVip: boolean;
  plan: VipPlan | null;
  /** Epoch ms when a monthly pass expires (null for lifetime / free). */
  expiresAt: number | null;
  setVip: (value: boolean, plan?: VipPlan) => void;
  vipModalOpen: boolean;
  /** Plan the modal should preselect when it opens. */
  preferredPlan: VipPlan;
  openVipModal: (plan?: VipPlan) => void;
  closeVipModal: () => void;
};

const VipContext = createContext<VipContextValue | null>(null);

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function VipProvider({ children }: { children: ReactNode }) {
  const [isVip, setIsVip] = useState(false);
  const [plan, setPlan] = useState<VipPlan | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [vipModalOpen, setVipModalOpen] = useState(false);

  useEffect(() => {
    try {
      const active = window.localStorage.getItem(VIP_KEY) === "1";
      const storedPlan = window.localStorage.getItem(PLAN_KEY) as VipPlan | null;
      const until = Number(window.localStorage.getItem(UNTIL_KEY) ?? 0) || null;
      const expired = storedPlan === "monthly" && until !== null && until < Date.now();
      setIsVip(active && !expired);
      setPlan(expired ? null : storedPlan);
      setExpiresAt(expired ? null : until);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setVip = useCallback((value: boolean, nextPlan: VipPlan = "lifetime") => {
    const until = value && nextPlan === "monthly" ? Date.now() + MONTH_MS : null;
    setIsVip(value);
    setPlan(value ? nextPlan : null);
    setExpiresAt(until);
    try {
      window.localStorage.setItem(VIP_KEY, value ? "1" : "0");
      if (value) {
        window.localStorage.setItem(PLAN_KEY, nextPlan);
        if (until) window.localStorage.setItem(UNTIL_KEY, String(until));
        else window.localStorage.removeItem(UNTIL_KEY);
      } else {
        window.localStorage.removeItem(PLAN_KEY);
        window.localStorage.removeItem(UNTIL_KEY);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo(
    () => ({
      isVip,
      plan,
      expiresAt,
      setVip,
      vipModalOpen,
      openVipModal: () => setVipModalOpen(true),
      closeVipModal: () => setVipModalOpen(false),
    }),
    [isVip, plan, expiresAt, setVip, vipModalOpen],
  );

  return <VipContext.Provider value={value}>{children}</VipContext.Provider>;
}

export function useVip(): VipContextValue {
  const ctx = useContext(VipContext);
  if (!ctx) {
    throw new Error("useVip must be used inside VipProvider");
  }
  return ctx;
}
