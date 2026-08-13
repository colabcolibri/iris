import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Button } from "@/components/ui/button";
import {
  fetchMcpPermissions,
  updateMcpPermissions,
  type McpPermissionPreset,
  type McpPermissionsSettings,
} from "@/lib/api";

const PRESET_OPTIONS: Array<{
  id: McpPermissionPreset;
  label: string;
  description: string;
}> = [
  {
    id: "read_only",
    label: "Somente leitura",
    description: "Listar e consultar — sem criar, editar ou apagar.",
  },
  {
    id: "editor",
    label: "Editor",
    description: "Leitura e edição — sem operações destrutivas.",
  },
  {
    id: "full",
    label: "Completo",
    description: "Mesmo escopo de hoje — todas as tools permitidas.",
  },
  {
    id: "custom",
    label: "Personalizado",
    description: "Ajuste fino por domínio na matriz abaixo.",
  },
];

type McpPermissionsCardProps = {
  embedded?: boolean;
};

export function McpPermissionsCard({ embedded = false }: McpPermissionsCardProps) {
  const [settings, setSettings] = useState<McpPermissionsSettings | null>(null);
  const [preset, setPreset] = useState<McpPermissionPreset>("full");
  const [domainOverrides, setDomainOverrides] = useState<
    McpPermissionsSettings["domain_overrides"]
  >(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMcpPermissions();
      setSettings(data);
      setPreset(data.preset);
      setDomainOverrides(data.domain_overrides);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao carregar permissões MCP.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const effectiveDomains = useMemo(() => {
    if (!settings) {
      return [];
    }

    if (preset === "custom") {
      return settings.domains.map((domain) => {
        const override = domainOverrides?.[domain.id];
        if (!override) {
          return domain;
        }

        return {
          ...domain,
          permissions: {
            read: override.read ?? domain.permissions.read,
            write: override.write ?? domain.permissions.write,
            delete: override.delete ?? domain.permissions.delete,
          },
        };
      });
    }

    return settings.domains;
  }, [domainOverrides, preset, settings]);

  async function handlePresetChange(next: McpPermissionPreset) {
    if (next === "custom") {
      setPreset("custom");
      setDomainOverrides(settings?.domain_overrides ?? null);
      return;
    }

    setSaving(true);
    try {
      const saved = await updateMcpPermissions({ preset: next });
      setSettings(saved);
      setPreset(saved.preset);
      setDomainOverrides(saved.domain_overrides);
      toast.success("Preset MCP aplicado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  function handlePermissionToggle(
    domainId: string,
    action: "read" | "write" | "delete",
    enabled: boolean,
  ) {
    setPreset("custom");
    setDomainOverrides((current) => {
      const base = current ?? {};
      const domain = effectiveDomains.find((entry) => entry.id === domainId);
      const currentPermissions = domain?.permissions ?? {
        read: false,
        write: false,
        delete: false,
      };

      return {
        ...base,
        [domainId]: {
          ...currentPermissions,
          ...base[domainId],
          [action]: enabled,
        },
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await updateMcpPermissions({
        preset,
        ...(preset === "custom" && domainOverrides
          ? { domain_overrides: domainOverrides }
          : {}),
      });
      setSettings(saved);
      setPreset(saved.preset);
      setDomainOverrides(saved.domain_overrides);
      toast.success("Permissões MCP salvas.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const matrixEditable = preset === "custom";

  return (
    <SettingsCardShell
      embedded={embedded}
      title="Permissões MCP"
      description="Controle o que clientes conectados (Cursor, ChatGPT, Claude) podem ler, editar e deletar."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {PRESET_OPTIONS.map((option) => {
              const active = preset === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => void handlePresetChange(option.id)}
                  disabled={saving}
                  className={`rounded-[var(--iris-radius-sm)] border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {option.label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-[var(--iris-radius-sm)] border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Domínio</th>
                  <th className="px-4 py-3 font-semibold">Leitura</th>
                  <th className="px-4 py-3 font-semibold">Edição</th>
                  <th className="px-4 py-3 font-semibold">Deleção</th>
                </tr>
              </thead>
              <tbody>
                {effectiveDomains.map((domain) => (
                  <tr key={domain.id} className="border-t border-border">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-foreground">{domain.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {domain.description}
                      </p>
                    </td>
                    {(["read", "write", "delete"] as const).map((action) => {
                      const capability = domain.capabilities[action];
                      const checked = domain.permissions[action];
                      return (
                        <td key={action} className="px-4 py-3 align-top">
                          {!capability ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="size-4 rounded border border-input"
                                checked={checked}
                                disabled={!matrixEditable}
                                onChange={(event) =>
                                  handlePermissionToggle(
                                    domain.id,
                                    action,
                                    event.target.checked,
                                  )
                                }
                              />
                            </label>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preset !== "custom" ? (
            <p className="text-sm text-muted-foreground">
              A matriz reflete o preset selecionado. Escolha{" "}
              <span className="font-medium text-foreground">Personalizado</span> para
              ajustar domínio por domínio.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              Salvar permissões
            </Button>
          </div>
        </div>
      )}
    </SettingsCardShell>
  );
}
