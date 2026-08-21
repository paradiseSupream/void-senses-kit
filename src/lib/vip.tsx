import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const VIP_KEY = "sov.vip";

type VipContextValue = {
  isVip: boolean;
  setVip: (value: boolean) => void;
  vipModalOpen: boolean;
  openVipModal: () => void;
  closeVipModal: () => void;
};

const VipContext = createContext<VipContextValue | null>(null);

export function VipProvider({ children }: { children: ReactNode }) {
  const [isVip, setIsVip] = useState(false);
  const [vipModalOpen, setVipModalOpen] = useState(false);

  useEffect(() => {
    try {
      setIsVip(window.localStorage.getItem(VIP_KEY) === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setVip = useCallback((value: boolean) => {
    setIsVip(value);
    try {
      window.localStorage.setItem(VIP_KEY, value ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo(
    () => ({
      isVip,
      setVip,
      vipModalOpen,
      openVipModal: () => setVipModalOpen(true),
      closeVipModal: () => setVipModalOpen(false),
    }),
    [isVip, setVip, vipModalOpen],
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
