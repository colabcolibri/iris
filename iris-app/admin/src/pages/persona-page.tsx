import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/templates/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAgentContent,
  fetchReplyPersona,
  updateAgentContent,
  updateReplyPersona,
} from "@/lib/api";
import type { AgentContent, ReplyPersona } from "@/lib/types";
import {
  DEFAULT_RESPONSE_LANGUAGE,
  RESPONSE_LANGUAGE_OPTIONS,
} from "@iris/domain/reply-language/response-languages";

export function PersonaPage() {
  const [persona, setPersona] = useState<ReplyPersona | null>(null);
  const [responseLanguage, setResponseLanguage] = useState(DEFAULT_RESPONSE_LANGUAGE);
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
        setResponseLanguage(personaData.response_language ?? DEFAULT_RESPONSE_LANGUAGE);
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
        response_language: responseLanguage,
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

  const selectedLanguage =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)?.label ??
    responseLanguage;

  return (
    <PageContainer>
      <PageContainer.Content>
        <PageContainer.Header
          eyebrow="Respostas automáticas"
          title="Persona da marca"
          description="Idioma das respostas, nome da marca e limites. O tom e a voz vêm do SOUL e das restrições abaixo."
        />

        <Card className="space-y-4 border-border/80 bg-card/90 p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="response-language">Idioma das respostas</Label>
                <Select value={responseLanguage} onValueChange={setResponseLanguage}>
                  <SelectTrigger id="response-language" className="w-full bg-background">
                    <SelectValue placeholder="Selecione o idioma">{selectedLanguage}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {RESPONSE_LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  O agente sempre responderá neste idioma. Os prompts internos ficam em inglês; o
                  idioma é reforçado em cada estágio do harness.
                </p>
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

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" onClick={() => void handleSave()} disabled={saving}>
                  Salvar persona
                </Button>
                {persona?.updated_at ? (
                  <span className="self-center text-xs text-muted-foreground">
                    Atualizado: {new Date(persona.updated_at).toLocaleString("pt-BR")}
                  </span>
                ) : null}
              </div>
            </>
          )}
        </Card>

        <Card className="mt-6 space-y-4 border-border/80 bg-card/90 p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Conteúdo do agente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              SOUL, contexto da página, base de conhecimento e restrições usados pelo harness de
              respostas automáticas. É aqui que você define voz, tom e políticas editoriais.
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
