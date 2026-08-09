import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchMetaHealth,
  fetchMetaStatus,
  fetchReplyPersona,
  logout,
  updateReplyPersona,
  UnauthorizedError,
} from "@/lib/api";
import type { MetaStatus, ReplyPersona } from "@/lib/types";

export function PersonaPage() {
  const [meta, setMeta] = useState<MetaStatus | null>(null);
  const [persona, setPersona] = useState<ReplyPersona | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tone, setTone] = useState("");
  const [brandName, setBrandName] = useState("");
  const [maxChars, setMaxChars] = useState(500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([fetchMetaStatus(), fetchReplyPersona()])
      .then(([metaStatus, data]) => {
        setMeta(metaStatus);
        setPersona(data);
        setSystemPrompt(data.system_prompt);
        setTone(data.tone);
        setBrandName(data.brand_name ?? "");
        setMaxChars(data.max_chars);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          window.location.href = "/login";
          return;
        }
        toast.error("Falha ao carregar persona.");
      })
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
    <div className="flex h-svh flex-col bg-background">
      <AppHeader
        meta={meta}
        onNewPost={() => {}}
        onLogout={() => {
          void logout().finally(() => {
            window.location.href = "/login";
          });
        }}
        onMetaHealth={() => {
          void fetchMetaHealth()
            .then((result) => {
              if (result.ok) toast.success("Conexão com a Meta OK.");
              else toast.error(result.message ?? "Falha na conexão.");
            })
            .catch(() => toast.error("Falha ao testar conexão."));
        }}
        personaActive
      />

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-auto p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Persona / respostas</h2>
          <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
            Voltar ao calendário
          </Link>
        </div>

        <Card className="p-5 space-y-4">
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
                  <span className="text-xs text-muted-foreground self-center">
                    Atualizado: {new Date(persona.updated_at).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
