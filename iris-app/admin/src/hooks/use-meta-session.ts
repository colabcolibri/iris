import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  disconnectMeta,
  fetchMetaHealth,
  fetchMetaStatus,
} from "@/lib/api";
import type { MetaStatus } from "@/lib/types";

/** Carrega e muta apenas o estado Meta — logout fica em AuthSession. */
export function useMetaSession() {
  const [meta, setMeta] = useState<MetaStatus | null>(null);

  useEffect(() => {
    void fetchMetaStatus()
      .then(setMeta)
      .catch(() => {
        setMeta(null);
      });
  }, []);

  async function handleMetaHealth() {
    try {
      const result = await fetchMetaHealth();
      if (result.ok) toast.success("Conexão com a Meta OK.");
      else toast.error(result.message ?? "Falha na conexão.");
    } catch {
      toast.error("Falha ao testar conexão.");
    }
  }

  async function handleDisconnect(): Promise<boolean> {
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
        err instanceof Error ? err.message : "Não foi possível desconectar o Instagram.",
      );
      return false;
    }
  }

  return { meta, setMeta, handleMetaHealth, handleDisconnect };
}
