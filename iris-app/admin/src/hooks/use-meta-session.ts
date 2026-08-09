import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchMetaHealth, fetchMetaStatus, logout, UnauthorizedError } from "@/lib/api";
import type { MetaStatus } from "@/lib/types";

export function useMetaSession() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState<MetaStatus | null>(null);

  useEffect(() => {
    void fetchMetaStatus()
      .then(setMeta)
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          window.location.href = "/login";
        }
      });
  }, []);

  function handleLogout() {
    void logout().finally(() => navigate("/login", { replace: true }));
  }

  function handleMetaHealth() {
    void fetchMetaHealth()
      .then((result) => {
        if (result.ok) toast.success("Conexão com a Meta OK.");
        else toast.error(result.message ?? "Falha na conexão.");
      })
      .catch(() => toast.error("Falha ao testar conexão."));
  }

  return { meta, setMeta, handleLogout, handleMetaHealth };
}
