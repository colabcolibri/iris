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

type FieldHintProps = {
  children: React.ReactNode;
};

function FieldHint({ children }: FieldHintProps) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
  );
}

export function PersonaPage() {
  const [persona, setPersona] = useState<ReplyPersona | null>(null);
  const [responseLanguage, setResponseLanguage] = useState(
    DEFAULT_RESPONSE_LANGUAGE,
  );
  const [brandName, setBrandName] = useState("");
  const [signatureInstruction, setSignatureInstruction] = useState("");
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
        setResponseLanguage(
          personaData.response_language ?? DEFAULT_RESPONSE_LANGUAGE,
        );
        setBrandName(personaData.brand_name ?? "");
        setSignatureInstruction(personaData.signature_instruction ?? "");
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
        signature_instruction: signatureInstruction,
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
      toast.error(
        err instanceof Error ? err.message : "Falha ao salvar conteúdo.",
      );
    } finally {
      setSavingContent(false);
    }
  }

  const selectedLanguage =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)
      ?.label ?? responseLanguage;

  return (
    <PageContainer>
      <PageContainer.Content>
        <PageContainer.Header
          eyebrow="Respostas automáticas"
          title="Persona da marca"
          description="Identidade e limites da marca ficam no banco (SQLite). O conteúdo editorial do agente também é persistido no banco — só muda quando você salva explicitamente."
        />

        <Card className="space-y-5 border-border bg-card p-6 shadow-none">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="response-language">Idioma das respostas</Label>
                <Select
                  value={responseLanguage}
                  onValueChange={(value) => {
                    if (value) {
                      setResponseLanguage(value);
                    }
                  }}
                >
                  <SelectTrigger
                    id="response-language"
                    className="w-full bg-background"
                  >
                    <SelectValue placeholder="Selecione o idioma">
                      {selectedLanguage}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {RESPONSE_LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldHint>
                  Idioma obrigatório de todas as respostas públicas no
                  Instagram. Os prompts internos do harness ficam em inglês;
                  este idioma é reforçado em triagem, rascunho e verificação.
                </FieldHint>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-name">Nome da marca</Label>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex.: Colab Colibri"
                />
                <FieldHint>
                  Nome exibido no topo dos prompts de rascunho, logo após o
                  idioma. Ajuda a IA a se referir à marca corretamente.
                </FieldHint>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature-instruction">
                  Instrução de assinatura
                </Label>
                <Textarea
                  id="signature-instruction"
                  rows={3}
                  value={signatureInstruction}
                  onChange={(e) => setSignatureInstruction(e.target.value)}
                  placeholder="Ex.: Assine sempre com “— Equipe Colab” ou use o primeiro nome do atendente."
                />
                <FieldHint>
                  Como a IA deve encerrar a resposta. Na publicação, corpo e
                  assinatura ficam separados por um ponto em linha própria
                  (texto, depois «.», depois a assinatura) — formato que
                  funciona bem no Instagram.
                </FieldHint>
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
                <FieldHint>
                  Teto de caracteres da resposta final no Instagram. O
                  verificador rejeita rascunhos que ultrapassarem este limite.
                </FieldHint>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  Salvar persona
                </Button>
                {persona?.updated_at ? (
                  <span className="self-center text-xs text-muted-foreground">
                    Atualizado:{" "}
                    {new Date(persona.updated_at).toLocaleString("pt-BR")}
                  </span>
                ) : null}
              </div>
            </>
          )}
        </Card>

        <Card className="mt-6 space-y-5 border-border bg-card p-6 shadow-none">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Conteúdo do agente
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Blocos editoriais usados pelo harness em estágios diferentes.
              Salvo no mesmo banco da persona — não depende mais de arquivos em
              disco.
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
                <FieldHint>
                  Voz, personalidade e tom da marca. Usado em respostas
                  completas (tier full), não entra na triagem nem em respostas
                  curtas simples.
                </FieldHint>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-page">Sobre a página</Label>
                <Textarea
                  id="agent-page"
                  rows={4}
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                />
                <FieldHint>
                  Contexto do perfil ou campanha: o que é a conta, público-alvo
                  e objetivo editorial. Reforça o SOUL em respostas elaboradas.
                </FieldHint>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-knowledge">Base de conhecimento</Label>
                <Textarea
                  id="agent-knowledge"
                  rows={5}
                  value={knowledge}
                  onChange={(e) => setKnowledge(e.target.value)}
                />
                <FieldHint>
                  Fatos, links oficiais, preços, políticas e respostas-modelo.
                  Usado em respostas simples e completas quando o comentário
                  pede informação concreta.
                </FieldHint>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-restrictions">Restrições</Label>
                <Textarea
                  id="agent-restrictions"
                  rows={4}
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                />
                <FieldHint>
                  O que a IA nunca deve fazer ou prometer. Entra na triagem, nos
                  rascunhos e na verificação final — é o principal filtro de
                  política da marca.
                </FieldHint>
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
                    Atualizado:{" "}
                    {new Date(agentContent.updated_at).toLocaleString("pt-BR")}
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
