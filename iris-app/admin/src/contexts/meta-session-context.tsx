import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { disconnectMeta, fetchMetaHealth, fetchMetaStatus } from "@/lib/api";
import type { MetaStatus } from "@/lib/types";

type MetaSessionContextValue = {
  meta: MetaStatus | null;
  setMeta: (meta: MetaStatus | null) => void;
  handleMetaHealth: () => Promise<void>;
  handleDisconnect: () => Promise<boolean>;
};

const MetaSessionContext = createContext<MetaSessionContextValue | null>(null);

export function MetaSessionProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<MetaStatus | null>(null);

  useEffect(() => {
    void fetchMetaStatus()
      .then(setMeta)
      .catch(() => {
        setMeta(null);
      });
  }, []);

  const handleMetaHealth = useCallback(async () => {
    try {
      const result = await fetchMetaHealth();
      if (result.ok) toast.success("Conexão com a Meta OK.");
      else toast.error(result.message ?? "Falha na conexão.");
    } catch {
      toast.error("Falha ao testar conexão.");
    }
  }, []);

  const handleDisconnect = useCallback(async (): Promise<boolean> => {
    try {
      await disconnectMeta();
      setMeta({
        connected: false,
        igUsername: null,
        tokenExpired: false,
      });
      toast.success("Instagram desconectado.");
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível desconectar o Instagram.",
      );
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      meta,
      setMeta,
      handleMetaHealth,
      handleDisconnect,
    }),
    [meta, handleMetaHealth, handleDisconnect],
  );

  return (
    <MetaSessionContext.Provider value={value}>
      {children}
    </MetaSessionContext.Provider>
  );
}

export function useMetaSession() {
  const context = useContext(MetaSessionContext);
  if (!context) {
    throw new Error("useMetaSession must be used within MetaSessionProvider.");
  }

  return context;
}
