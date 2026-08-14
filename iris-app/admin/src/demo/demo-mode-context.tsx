import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { isDemoPath } from "@/demo/demo-path";
import { useDemoLocale } from "@/demo/demo-locale-context";
import { getActiveDemoLocale } from "@/demo/demo-state";
import { getDemoUiMessages } from "@/demo/fixtures/i18n/ui";

type DemoModeContextValue = {
  isDemoMode: boolean;
};

const DemoModeContext = createContext<DemoModeContextValue>({ isDemoMode: false });

let demoModeActive = false;

/** Síncrono — pathname `/demo` ou flag do provider (nunca só useEffect). */
export function getDemoMode(): boolean {
  return demoModeActive || isDemoPath();
}

function setDemoModeActive(active: boolean) {
  demoModeActive = active;
}

export function showDemoToast(message?: string) {
  const text =
    message ?? getDemoUiMessages(getActiveDemoLocale()).demoToast;
  toast.message(text, { duration: 2800 });
}

export function DemoBanner() {
  const { m } = useDemoLocale();

  return (
    <div
      role="status"
      className="flex h-10 w-full shrink-0 items-center justify-center border-b border-amber-500/30 bg-amber-500/15 px-4 text-center text-sm font-medium text-amber-950"
    >
      {m.banner}
    </div>
  );
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    setDemoModeActive(true);
    return () => {
      setDemoModeActive(false);
    };
  }, []);

  const value = useMemo(() => ({ isDemoMode: true }), []);

  return (
    <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
