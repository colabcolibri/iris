import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ReplyModeSelect } from "@/components/posts/reply-mode-select";
import { useAppSettings } from "@/contexts/app-settings-context";
import { replyModeOption } from "@/lib/reply-mode-options";
import type { ReplyMode } from "@/lib/types";

export function AgentAutoReplyCard() {
  const { replyMode, loading, saveReplyMode } = useAppSettings();
  const [saving, setSaving] = useState(false);

  async function handleChange(next: ReplyMode) {
    setSaving(true);
    try {
      await saveReplyMode(next);
      toast.success(`Modo global do agente: ${replyModeOption(next).label.toLowerCase()}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-4 border-border/80 bg-card/90 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-sm font-semibold">Agente de comentários</h2>
        <p className="text-xs text-muted-foreground">
          Modo padrão para posts que seguem a configuração global. Posts com modo próprio têm
          precedência.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="max-w-xl space-y-2">
          <Label htmlFor="global-reply-mode" className="text-sm font-medium">
            Modo global
          </Label>
          <ReplyModeSelect
            id="global-reply-mode"
            variant="global"
            value={replyMode}
            onChange={(value) => void handleChange(value)}
            disabled={saving}
          />
        </div>
      )}
    </Card>
  );
}
