import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMetaSession } from "@/hooks/use-meta-session";
import { fetchReplyPersona, updateReplyPersona } from "@/lib/api";
import type { ReplyPersona } from "@/lib/types";

export function PersonaPage() {
  const { meta, handleLogout, handleMetaHealth } = useMetaSession();
  const [persona, setPersona] = useState<ReplyPersona | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tone, setTone] = useState("");
  const [brandName, setBrandName] = useState("");
  const [maxChars, setMaxChars] = useState(500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchReplyPersona()
      .then((data) => {
        setPersona(data);
        setSystemPrompt(data.system_prompt);
        setTone(data.tone);
        setBrandName(data.brand_name ?? "");
        setMaxChars(data.max_chars);
      })
      .catch(() => toast.error("Falha ao carregar persona."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await updateReplyPersona({
        system_prompt: systemPrompt,
        tone,
        brand_name: brandName.trim() || null,
        max_chars: maxChars,
      });
      setPersona(saved);
      toast.success("Persona salva.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const preview = systemPrompt.trim().split("\n").slice(0, 2).join("\n");

  return (
    <AppShell meta={meta} onLogout={handleLogout} onMetaHealth={handleMetaHealth}>
      <div className="flex-1 overflow-auto px-6 py-8 md:px-10">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <header className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Respostas automáticas
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Persona da marca</h1>
          </header>

          <Card className="space-y-4 border-border/80 bg-card/90 p-6 shadow-sm">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="system-prompt">Prompt do sistema</Label>
                  <Textarea
                    id="system-prompt"
                    rows={6}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tom</Label>
                  <Input id="tone" value={tone} onChange={(e) => setTone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand-name">Nome da marca</Label>
                  <Input
                    id="brand-name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-chars">Limite de caracteres</Label>
                  <Input
                    id="max-chars"
                    type="number"
                    min={100}
                    max={1000}
                    value={maxChars}
                    onChange={(e) => setMaxChars(Number(e.target.value))}
                  />
                </div>

                {preview && (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <p className="mb-1 font-medium text-foreground">Preview</p>
                    <p className="break-words whitespace-pre-wrap">{preview}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" onClick={() => void handleSave()} disabled={saving}>
                    Salvar persona
                  </Button>
                  {persona?.updated_at && (
                    <span className="self-center text-xs text-muted-foreground">
                      Atualizado: {new Date(persona.updated_at).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
