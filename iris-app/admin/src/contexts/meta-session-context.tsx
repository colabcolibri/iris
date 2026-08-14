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
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
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
  const { locale } = useAppLocale();
  const metaMsg = useDomainMessages("settings").meta;
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
      const result = await fetchMetaHealth({ messaging: true });
      if (!result.ok) {
        toast.error(result.message ?? metaMsg.toasts.connectionFailed);
        return;
      }
      if (result.messaging && !result.messaging.ok) {
        toast.error(
          result.messaging.message ?? metaMsg.toasts.messagingPermission,
        );
        return;
      }
      toast.success(metaMsg.toasts.healthOk);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, locale) || metaMsg.toasts.testFailed,
      );
    }
  }, [locale, metaMsg]);

  const handleDisconnect = useCallback(async (): Promise<boolean> => {
    try {
      await disconnectMeta();
      setMeta({
        connected: false,
        igUsername: null,
        tokenExpired: false,
      });
      toast.success(metaMsg.toasts.disconnected);
      return true;
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, locale) || metaMsg.toasts.disconnectFailed,
      );
      return false;
    }
  }, [locale, metaMsg]);

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
