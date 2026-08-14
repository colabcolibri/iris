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
import {
  clearCachedAuthSession,
  readCachedAuthSession,
  writeCachedAuthSession,
} from "@/lib/auth-session-cache";
import { isDemoPath } from "@/demo/demo-path";
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

function readInitialAuthState(): { status: AuthStatus; email: string | null } {
  if (typeof window !== "undefined" && isDemoPath()) {
    return { status: "anonymous", email: null };
  }

  const cached = readCachedAuthSession();
  if (cached) {
    return { status: "authenticated", email: cached.email };
  }

  return { status: "loading", email: null };
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const initialAuth = readInitialAuthState();
  const [status, setStatus] = useState<AuthStatus>(initialAuth.status);
  const [email, setEmail] = useState<string | null>(initialAuth.email);
  const statusRef = useRef(status);
  statusRef.current = status;

  const applyAnonymous = useCallback(() => {
    clearCachedAuthSession();
    setEmail(null);
    setStatus("anonymous");
  }, []);

  const applyAuthenticated = useCallback((nextEmail: string) => {
    writeCachedAuthSession(nextEmail);
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
      if (isDemoPath()) {
        applyAnonymous();
        return false;
      }

      if (!options?.silent && statusRef.current !== "authenticated") {
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
    if (isDemoPath()) {
      applyAnonymous();
      return;
    }
    void refresh({ silent: true });
  }, [refresh, applyAnonymous]);

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

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}
