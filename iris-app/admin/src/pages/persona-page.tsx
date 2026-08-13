import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PreferencesPageShell } from "@/components/templates/preferences-page-shell";
import { PreferencesAccordion } from "@/components/templates/preferences-accordion";
import { Button } from "@/components/ui/button";
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
  fetchMessageAgentContent,
  fetchReplyPersona,
  updateAgentContent,
  updateMessageAgentContent,
  updateReplyPersona,
} from "@/lib/api";
import type { AgentContent, MessageAgentContent, ReplyPersona } from "@/lib/types";
import {
  DEFAULT_RESPONSE_LANGUAGE,
  RESPONSE_LANGUAGE_OPTIONS,
} from "@iris/domain/reply-language/response-languages";
import { DEMO_BRAND_NAME } from "@/demo/demo-brand";
import { useDemoMode } from "@/demo/demo-mode-context";

type FieldHintProps = {
  children: React.ReactNode;
};

function FieldHint({ children }: FieldHintProps) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  );
}

function UpdatedAt({ value }: { value?: string | null }) {
  if (!value) return null;
  return (
    <span className="text-sm text-muted-foreground">
      Atualizado: {new Date(value).toLocaleString("pt-BR")}
    </span>
  );
}

export function PersonaPage() {
  const { isDemoMode } = useDemoMode();
  const brandPlaceholder = isDemoMode
    ? `Ex.: ${DEMO_BRAND_NAME}`
    : "Ex.: Nome da sua marca";
  const signaturePlaceholder = isDemoMode
    ? `Ex.: Assine como assistente virtual do ${DEMO_BRAND_NAME}.`
    : "Ex.: Assine sempre com o nome da equipe ou do atendente.";
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
  const [messageAgentContent, setMessageAgentContent] =
    useState<MessageAgentContent | null>(null);
  const [dmSoul, setDmSoul] = useState("");
  const [dmPage, setDmPage] = useState("");
  const [dmKnowledge, setDmKnowledge] = useState("");
  const [dmRestrictions, setDmRestrictions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [savingMessageContent, setSavingMessageContent] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetchReplyPersona(),
      fetchAgentContent(),
      fetchMessageAgentContent(),
    ])
      .then(([personaData, contentData, messageContentData]) => {
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
        setMessageAgentContent(messageContentData);
        setDmSoul(messageContentData.dm_soul);
        setDmPage(messageContentData.dm_page);
        setDmKnowledge(messageContentData.dm_knowledge);
        setDmRestrictions(messageContentData.dm_restrictions);
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

  async function handleSaveMessageContent() {
    setSavingMessageContent(true);
    try {
      const saved = await updateMessageAgentContent({
        dm_soul: dmSoul,
        dm_page: dmPage,
        dm_knowledge: dmKnowledge,
        dm_restrictions: dmRestrictions,
      });
      setMessageAgentContent(saved);
      toast.success("Conteúdo DM do agente salvo.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao salvar conteúdo DM.",
      );
    } finally {
      setSavingMessageContent(false);
    }
  }

  const selectedLanguage =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)
      ?.label ?? responseLanguage;

  if (loading) {
    return (
      <PreferencesPageShell
        eyebrow="Respostas automáticas"
        title="Persona da marca"
        description="Identidade, limites e conteúdo editorial usados pelos agentes de comentários e DMs."
      >
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </PreferencesPageShell>
    );
  }

  return (
    <PreferencesPageShell
      eyebrow="Respostas automáticas"
      title="Persona da marca"
      description="Identidade, limites e conteúdo editorial usados pelos agentes de comentários e DMs. Tudo fica no banco — só muda quando você salva explicitamente."
    >
      <PreferencesAccordion
        className="mx-auto w-full max-w-4xl"
        defaultOpen={["persona"]}
        sections={[
            {
              id: "persona",
              title: "Identidade da marca",
              description:
                "Idioma, nome, assinatura e limite de caracteres compartilhados entre comentários e DMs.",
              content: (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="response-language" className="text-sm font-semibold">
                      Idioma das respostas
                    </Label>
                    <Select
                      value={responseLanguage}
                      onValueChange={(value) => {
                        if (value) setResponseLanguage(value);
                      }}
                    >
                      <SelectTrigger
                        id="response-language"
                        className="h-11 w-full bg-background"
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
                    <Label htmlFor="brand-name" className="text-sm font-semibold">
                      Nome da marca
                    </Label>
                    <Input
                      id="brand-name"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder={brandPlaceholder}
                      className="h-11"
                    />
                    <FieldHint>
                      Nome exibido no topo dos prompts de rascunho. Ajuda a IA a
                      se referir à marca corretamente.
                    </FieldHint>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signature-instruction"
                      className="text-sm font-semibold"
                    >
                      Instrução de assinatura
                    </Label>
                    <Textarea
                      id="signature-instruction"
                      rows={3}
                      value={signatureInstruction}
                      onChange={(e) => setSignatureInstruction(e.target.value)}
                      placeholder={signaturePlaceholder}
                      className="min-h-[5.5rem] resize-y"
                    />
                    <FieldHint>
                      Como a IA deve encerrar a resposta. Na publicação, corpo e
                      assinatura ficam separados por um ponto em linha própria.
                    </FieldHint>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-chars" className="text-sm font-semibold">
                      Limite de caracteres
                    </Label>
                    <Input
                      id="max-chars"
                      type="number"
                      min={100}
                      max={1000}
                      value={maxChars}
                      onChange={(e) => setMaxChars(Number(e.target.value))}
                      className="h-11 max-w-[10rem]"
                    />
                    <FieldHint>
                      Teto de caracteres da resposta final no Instagram. O
                      verificador rejeita rascunhos que ultrapassarem este limite.
                    </FieldHint>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                    >
                      Salvar persona
                    </Button>
                    <UpdatedAt value={persona?.updated_at} />
                  </div>
                </div>
              ),
            },
            {
              id: "agent-content",
              title: "Conteúdo do agente (comentários)",
              description:
                "Blocos editoriais usados pelo harness em comentários públicos.",
              content: (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="agent-soul" className="text-sm font-semibold">
                      SOUL
                    </Label>
                    <Textarea
                      id="agent-soul"
                      rows={5}
                      value={soul}
                      onChange={(e) => setSoul(e.target.value)}
                      className="min-h-[8rem] resize-y"
                    />
                    <FieldHint>
                      Voz, personalidade e tom da marca. Usado em respostas
                      completas (tier full).
                    </FieldHint>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent-page" className="text-sm font-semibold">
                      Sobre a página
                    </Label>
                    <Textarea
                      id="agent-page"
                      rows={4}
                      value={page}
                      onChange={(e) => setPage(e.target.value)}
                      className="min-h-[6rem] resize-y"
                    />
                    <FieldHint>
                      Contexto do perfil ou campanha: o que é a conta, público-alvo
                      e objetivo editorial.
                    </FieldHint>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent-knowledge" className="text-sm font-semibold">
                      Base de conhecimento
                    </Label>
                    <Textarea
                      id="agent-knowledge"
                      rows={5}
                      value={knowledge}
                      onChange={(e) => setKnowledge(e.target.value)}
                      className="min-h-[8rem] resize-y"
                    />
                    <FieldHint>
                      Fatos, links oficiais, preços, políticas e respostas-modelo.
                    </FieldHint>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="agent-restrictions"
                      className="text-sm font-semibold"
                    >
                      Restrições
                    </Label>
                    <Textarea
                      id="agent-restrictions"
                      rows={4}
                      value={restrictions}
                      onChange={(e) => setRestrictions(e.target.value)}
                      className="min-h-[6rem] resize-y"
                    />
                    <FieldHint>
                      O que a IA nunca deve fazer ou prometer — principal filtro
                      de política da marca.
                    </FieldHint>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      onClick={() => void handleSaveContent()}
                      disabled={savingContent}
                    >
                      Salvar conteúdo do agente
                    </Button>
                    <UpdatedAt value={agentContent?.updated_at} />
                  </div>
                </div>
              ),
            },
            {
              id: "dm-content",
              title: "Conteúdo do agente (DM)",
              description:
                "Blocos editoriais do message-harness nas DMs. A persona global é compartilhada — só o conteúdo editorial muda aqui.",
              content: (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="dm-soul" className="text-sm font-semibold">
                      SOUL (DM)
                    </Label>
                    <Textarea
                      id="dm-soul"
                      rows={4}
                      value={dmSoul}
                      onChange={(e) => setDmSoul(e.target.value)}
                      className="min-h-[6rem] resize-y"
                    />
                    <FieldHint>
                      Tom e personalidade no inbox privado — mais direto que nos
                      comentários públicos.
                    </FieldHint>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dm-page" className="text-sm font-semibold">
                      Sobre a página (DM)
                    </Label>
                    <Textarea
                      id="dm-page"
                      rows={3}
                      value={dmPage}
                      onChange={(e) => setDmPage(e.target.value)}
                      className="min-h-[5rem] resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dm-knowledge" className="text-sm font-semibold">
                      Base de conhecimento (DM)
                    </Label>
                    <Textarea
                      id="dm-knowledge"
                      rows={4}
                      value={dmKnowledge}
                      onChange={(e) => setDmKnowledge(e.target.value)}
                      className="min-h-[6rem] resize-y"
                    />
                    <FieldHint>
                      Fatos, links e políticas citados nas respostas privadas —
                      inclui produtos ativos quando a triagem detectar intenção de
                      compra.
                    </FieldHint>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="dm-restrictions"
                      className="text-sm font-semibold"
                    >
                      Restrições (DM)
                    </Label>
                    <Textarea
                      id="dm-restrictions"
                      rows={3}
                      value={dmRestrictions}
                      onChange={(e) => setDmRestrictions(e.target.value)}
                      className="min-h-[5rem] resize-y"
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      onClick={() => void handleSaveMessageContent()}
                      disabled={savingMessageContent}
                    >
                      Salvar conteúdo DM
                    </Button>
                    <UpdatedAt value={messageAgentContent?.updated_at} />
                  </div>
                </div>
              ),
            },
          ]}
      />
    </PreferencesPageShell>
  );
}
