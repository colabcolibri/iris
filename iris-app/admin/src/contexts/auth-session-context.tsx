import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchAuthMe } from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthSessionContextValue = {
  status: AuthStatus;
  email: string | null;
  refresh: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);

  const refresh = async () => {
    setStatus("loading");
    const session = await fetchAuthMe();
    if (session) {
      setEmail(session.email);
      setStatus("authenticated");
      return;
    }

    setEmail(null);
    setStatus("anonymous");
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(
    () => ({
      status,
      email,
      refresh,
    }),
    [status, email],
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
