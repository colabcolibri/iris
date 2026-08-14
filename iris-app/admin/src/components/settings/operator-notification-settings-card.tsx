import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  fetchOperatorNotificationSettings,
  testOperatorNotificationSettings,
  updateOperatorNotificationSettings,
} from "@/lib/api";

type OperatorNotificationSettingsCardProps = {
  embedded?: boolean;
};

export function OperatorNotificationSettingsCard({
  embedded = false,
}: OperatorNotificationSettingsCardProps) {
  const { locale } = useAppLocale();
  const settings = useDomainMessages("settings");
  const t = settings.operatorNotifications;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [destination, setDestination] = useState("");
  const [aiLockDays, setAiLockDays] = useState(5);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOperatorNotificationSettings();
      setEnabled(data.channels.email.enabled);
      setDestination(data.channels.email.destination);
      setAiLockDays(data.ai_lock_days ?? 5);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [locale, t.toasts.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateOperatorNotificationSettings({
        channels: { email: { enabled, destination: destination.trim() } },
        ai_lock_days: aiLockDays,
      });
      toast.success(t.toasts.saved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const result = await testOperatorNotificationSettings();
      if (result.ok) {
        toast.success(t.toasts.testSent);
      } else {
        toast.error(t.toasts.testFailed);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.testFailed);
    } finally {
      setTesting(false);
    }
  }

  const body = loading ? (
    <p className="text-sm text-muted-foreground">{settings.page.loading}</p>
  ) : (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">{t.help}</p>
      <div className="flex items-center gap-3">
        <input
          id="operator-email-enabled"
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="size-4 rounded border border-input"
        />
        <Label htmlFor="operator-email-enabled" className="text-sm font-semibold">
          {t.emailEnabled}
        </Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="operator-email-destination" className="text-sm font-semibold">
          {t.emailDestination}
        </Label>
        <Input
          id="operator-email-destination"
          type="email"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder={t.emailPlaceholder}
          className="max-w-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="operator-ai-lock-days" className="text-sm font-semibold">
          {t.aiLockDays}
        </Label>
        <Input
          id="operator-ai-lock-days"
          type="number"
          min={1}
          max={90}
          value={aiLockDays}
          onChange={(event) => setAiLockDays(Number(event.target.value) || 5)}
          className="max-w-32"
        />
        <p className="text-xs text-muted-foreground">{t.aiLockDaysHelp}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {t.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleTest()}
          disabled={testing || !enabled || !destination.includes("@")}
        >
          {t.sendTest}
        </Button>
      </div>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <SettingsCardShell title={t.title} description={t.description}>
      {body}
    </SettingsCardShell>
  );
}
