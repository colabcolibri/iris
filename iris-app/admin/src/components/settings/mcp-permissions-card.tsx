import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Button } from "@/components/ui/button";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  fetchMcpPermissions,
  updateMcpPermissions,
  type McpPermissionPreset,
  type McpPermissionsSettings,
} from "@/lib/api";

type McpPermissionsCardProps = {
  embedded?: boolean;
};

export function McpPermissionsCard({ embedded = false }: McpPermissionsCardProps) {
  const { locale } = useAppLocale();
  const t = useDomainMessages("settings").mcpPermissions;
  const [settings, setSettings] = useState<McpPermissionsSettings | null>(null);
  const [preset, setPreset] = useState<McpPermissionPreset>("full");
  const [domainOverrides, setDomainOverrides] = useState<
    McpPermissionsSettings["domain_overrides"]
  >(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const presetOptions = useMemo(
    () =>
      (
        [
          ["read_only", t.presets.readOnly],
          ["editor", t.presets.editor],
          ["full", t.presets.full],
          ["custom", t.presets.custom],
        ] as const
      ).map(([id, option]) => ({ id, ...option })),
    [t.presets],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMcpPermissions();
      setSettings(data);
      setPreset(data.preset);
      setDomainOverrides(data.domain_overrides);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [locale, t.toasts.loadFailed]);

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
      toast.success(t.toasts.presetApplied);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.saveFailed);
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
      toast.success(t.toasts.saved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  const matrixEditable = preset === "custom";

  return (
    <SettingsCardShell embedded={embedded} title={t.title} description={t.description}>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {presetOptions.map((option) => {
              const active = preset === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => void handlePresetChange(option.id)}
                  disabled={saving}
                  className={`rounded-(--iris-radius-sm) border px-4 py-3 text-left transition-colors ${
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

          <div className="overflow-x-auto rounded-(--iris-radius-sm) border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t.matrix.domain}</th>
                  <th className="px-4 py-3 font-semibold">{t.matrix.read}</th>
                  <th className="px-4 py-3 font-semibold">{t.matrix.write}</th>
                  <th className="px-4 py-3 font-semibold">{t.matrix.delete}</th>
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
                            <span className="text-xs text-muted-foreground">
                              {t.matrix.notApplicable}
                            </span>
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
              {t.customHint.replace("{custom}", t.customLabel)}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {t.save}
            </Button>
          </div>
        </div>
      )}
    </SettingsCardShell>
  );
}
