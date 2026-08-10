import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchAuthMe, logout } from "@/lib/api";
import { setUnauthorizedListener } from "@/lib/auth-unauthorized";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthSessionContextValue = {
  status: AuthStatus;
  email: string | null;
  /** Revalida cookie (ex.: após OTP). Não mostra loading se `silent`. */
  refresh: (options?: { silent?: boolean }) => Promise<boolean>;
  /** Logout remoto + limpa estado local. */
  signOut: () => Promise<void>;
  /** Só transição authenticated → anonymous (401 mid-session). */
  invalidateSession: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const applyAnonymous = useCallback(() => {
    setEmail(null);
    setStatus("anonymous");
  }, []);

  const applyAuthenticated = useCallback((nextEmail: string) => {
    setEmail(nextEmail);
    setStatus("authenticated");
  }, []);

  const invalidateSession = useCallback(() => {
    if (statusRef.current !== "authenticated") {
      return;
    }
    applyAnonymous();
  }, [applyAnonymous]);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setStatus("loading");
      }

      try {
        const session = await fetchAuthMe();
        if (session) {
          applyAuthenticated(session.email);
          return true;
        }
        applyAnonymous();
        return false;
      } catch {
        applyAnonymous();
        return false;
      }
    },
    [applyAnonymous, applyAuthenticated],
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Cookie pode já estar inválido — limpa UI mesmo assim.
    }
    applyAnonymous();
  }, [applyAnonymous]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setUnauthorizedListener(() => {
      // Bootstrap: deixa o refresh decidir. Mid-session: invalida.
      if (statusRef.current === "authenticated") {
        applyAnonymous();
      }
    });
    return () => setUnauthorizedListener(null);
  }, [applyAnonymous]);

  const value = useMemo(
    () => ({
      status,
      email,
      refresh,
      signOut,
      invalidateSession,
    }),
    [status, email, refresh, signOut, invalidateSession],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}
