import { createContext, type ReactNode, useContext, useState } from "react";

import type { DevGroup } from "@/dev/DevStrip";

type OnboardingDev = {
  extraGroups: DevGroup[];
  setExtraGroups: (groups: DevGroup[]) => void;
};

const OnboardingDevContext = createContext<OnboardingDev | null>(null);

export function OnboardingDevProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [extraGroups, setExtraGroups] = useState<DevGroup[]>([]);
  return (
    <OnboardingDevContext.Provider value={{ extraGroups, setExtraGroups }}>
      {children}
    </OnboardingDevContext.Provider>
  );
}

export function useOnboardingDev(): OnboardingDev {
  const value = useContext(OnboardingDevContext);
  if (!value) {
    throw new Error("useOnboardingDev must be used inside OnboardingShell");
  }
  return value;
}
