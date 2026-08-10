import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/templates/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAgentContent,
  fetchReplyPersona,
  updateAgentContent,
  updateReplyPersona,
} from "@/lib/api";
import type { AgentContent, ReplyPersona } from "@/lib/types";

export function PersonaPage() {
  const [persona, setPersona] = useState<ReplyPersona | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tone, setTone] = useState("");
  const [brandName, setBrandName] = useState("");
  const [maxChars, setMaxChars] = useState(500);
  const [agentContent, setAgentContent] = useState<AgentContent | null>(null);
  const [soul, setSoul] = useState("");
  const [page, setPage] = useState("");
  const [knowledge, setKnowledge] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingContent, setSavingContent] = useState(false);

  useEffect(() => {
    void Promise.all([fetchReplyPersona(), fetchAgentContent()])
      .then(([personaData, contentData]) => {
        setPersona(personaData);
        setSystemPrompt(personaData.system_prompt);
        setTone(personaData.tone);
        setBrandName(personaData.brand_name ?? "");
        setMaxChars(personaData.max_chars);
        setAgentContent(contentData);
        setSoul(contentData.soul);
        setPage(contentData.page);
        setKnowledge(contentData.knowledge);
        setRestrictions(contentData.restrictions);
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

  async function handleSaveContent() {
    setSavingContent(true);
    try {
      const saved = await updateAgentContent({
        soul,
        page,
        knowledge,
        restrictions,
      });
      setAgentContent(saved);
      toast.success("Conteúdo do agente salvo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar conteúdo.");
    } finally {
      setSavingContent(false);
    }
  }

  const preview = systemPrompt.trim().split("\n").slice(0, 2).join("\n");

  return (
    <PageContainer>
      <PageContainer.Content>
        <PageContainer.Header eyebrow="Respostas automáticas" title="Persona da marca" />

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
                  <p className="wrap-break-word whitespace-pre-wrap">{preview}</p>
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

        <Card className="mt-6 space-y-4 border-border/80 bg-card/90 p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Conteúdo do agente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              SOUL, contexto da página, base de conhecimento e restrições usados pelo harness de
              respostas automáticas.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="agent-soul">SOUL</Label>
                <Textarea
                  id="agent-soul"
                  rows={5}
                  value={soul}
                  onChange={(e) => setSoul(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-page">Sobre a página</Label>
                <Textarea
                  id="agent-page"
                  rows={4}
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-knowledge">Base de conhecimento</Label>
                <Textarea
                  id="agent-knowledge"
                  rows={5}
                  value={knowledge}
                  onChange={(e) => setKnowledge(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-restrictions">Restrições</Label>
                <Textarea
                  id="agent-restrictions"
                  rows={4}
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => void handleSaveContent()}
                  disabled={savingContent}
                >
                  Salvar conteúdo do agente
                </Button>
                {agentContent?.updated_at ? (
                  <span className="self-center text-xs text-muted-foreground">
                    Atualizado: {new Date(agentContent.updated_at).toLocaleString("pt-BR")}
                  </span>
                ) : null}
              </div>
            </>
          )}
        </Card>
      </PageContainer.Content>
    </PageContainer>
  );
}
