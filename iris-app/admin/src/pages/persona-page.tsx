import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PreferencesSplitLayout,
  type PreferencesSection,
} from "@/components/templates/preferences-split-layout";
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
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";

type FieldHintProps = {
  children: React.ReactNode;
};

function FieldHint({ children }: FieldHintProps) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  );
}

function UpdatedAt({
  value,
  template,
  locale,
}: {
  value?: string | null;
  template: string;
  locale: string;
}) {
  if (!value) return null;
  return (
    <span className="text-sm text-muted-foreground">
      {interpolate(template, {
        date: new Date(value).toLocaleString(locale),
      })}
    </span>
  );
}

export function PersonaPage() {
  const { locale, bcp47 } = useAppLocale();
  const t = useDomainMessages("agent").persona;
  const { isDemoMode } = useDemoMode();
  const brandPlaceholder = isDemoMode
    ? `Ex.: ${DEMO_BRAND_NAME}`
    : t.fields.brandPlaceholder;
  const signaturePlaceholder = isDemoMode
    ? `Ex.: Assine como assistente virtual do ${DEMO_BRAND_NAME}.`
    : t.fields.signaturePlaceholder;
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
      .catch(() => toast.error(t.toasts.loadFailed))
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
      toast.success(t.toasts.personaSaved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.saveFailed);
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
      toast.success(t.toasts.commentContentSaved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.commentContentFailed);
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
      toast.success(t.toasts.dmContentSaved);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.dmContentFailed);
    } finally {
      setSavingMessageContent(false);
    }
  }

  const selectedLanguage =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)
      ?.label ?? responseLanguage;

  const sections = useMemo<PreferencesSection[]>(
    () => [
      {
        id: "persona",
        title: t.sections.identity.title,
        description: t.sections.identity.description,
        content: (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="response-language" className="text-sm font-semibold">
                {t.fields.responseLanguage}
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
                  <SelectValue placeholder={t.fields.selectLanguage}>
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
              <FieldHint>{t.fields.responseLanguageHint}</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-name" className="text-sm font-semibold">
                {t.fields.brandName}
              </Label>
              <Input
                id="brand-name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={brandPlaceholder}
                className="h-11"
              />
              <FieldHint>{t.fields.brandNameHint}</FieldHint>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="signature-instruction"
                className="text-sm font-semibold"
              >
                {t.fields.signatureInstruction}
              </Label>
              <Textarea
                id="signature-instruction"
                rows={3}
                value={signatureInstruction}
                onChange={(e) => setSignatureInstruction(e.target.value)}
                placeholder={signaturePlaceholder}
                className="min-h-22 resize-y"
              />
              <FieldHint>{t.fields.signatureHint}</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-chars" className="text-sm font-semibold">
                {t.fields.maxChars}
              </Label>
              <Input
                id="max-chars"
                type="number"
                min={100}
                max={1000}
                value={maxChars}
                onChange={(e) => setMaxChars(Number(e.target.value))}
                className="h-11 max-w-40"
              />
              <FieldHint>{t.fields.maxCharsHint}</FieldHint>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {t.actions.savePersona}
              </Button>
              <UpdatedAt
                value={persona?.updated_at}
                template={t.page.updatedAt}
                locale={bcp47}
              />
            </div>
          </div>
        ),
      },
      {
        id: "agent-content",
        title: t.sections.commentContent.title,
        description: t.sections.commentContent.description,
        content: (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="agent-soul" className="text-sm font-semibold">
                {t.fields.soul}
              </Label>
              <Textarea
                id="agent-soul"
                rows={5}
                value={soul}
                onChange={(e) => setSoul(e.target.value)}
                className="min-h-32 resize-y"
              />
              <FieldHint>{t.fields.soulHint}</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-page" className="text-sm font-semibold">
                {t.fields.page}
              </Label>
              <Textarea
                id="agent-page"
                rows={4}
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="min-h-24 resize-y"
              />
              <FieldHint>{t.fields.pageHint}</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-knowledge" className="text-sm font-semibold">
                {t.fields.knowledge}
              </Label>
              <Textarea
                id="agent-knowledge"
                rows={5}
                value={knowledge}
                onChange={(e) => setKnowledge(e.target.value)}
                className="min-h-32 resize-y"
              />
              <FieldHint>{t.fields.knowledgeHint}</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-restrictions" className="text-sm font-semibold">
                {t.fields.restrictions}
              </Label>
              <Textarea
                id="agent-restrictions"
                rows={4}
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
                className="min-h-24 resize-y"
              />
              <FieldHint>{t.fields.restrictionsHint}</FieldHint>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                onClick={() => void handleSaveContent()}
                disabled={savingContent}
              >
                {t.actions.saveCommentContent}
              </Button>
              <UpdatedAt
                value={agentContent?.updated_at}
                template={t.page.updatedAt}
                locale={bcp47}
              />
            </div>
          </div>
        ),
      },
      {
        id: "dm-content",
        title: t.sections.dmContent.title,
        description: t.sections.dmContent.description,
        content: (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="dm-soul" className="text-sm font-semibold">
                {t.fields.dmSoul}
              </Label>
              <Textarea
                id="dm-soul"
                rows={4}
                value={dmSoul}
                onChange={(e) => setDmSoul(e.target.value)}
                className="min-h-24 resize-y"
              />
              <FieldHint>{t.fields.dmSoulHint}</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dm-page" className="text-sm font-semibold">
                {t.fields.dmPage}
              </Label>
              <Textarea
                id="dm-page"
                rows={3}
                value={dmPage}
                onChange={(e) => setDmPage(e.target.value)}
                className="min-h-20 resize-y"
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
                className="min-h-24 resize-y"
              />
              <FieldHint>
                Fatos, links e políticas nas respostas privadas — inclui produtos
                ativos quando a triagem detectar intenção de compra.
              </FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dm-restrictions" className="text-sm font-semibold">
                Restrições (DM)
              </Label>
              <Textarea
                id="dm-restrictions"
                rows={3}
                value={dmRestrictions}
                onChange={(e) => setDmRestrictions(e.target.value)}
                className="min-h-20 resize-y"
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
    ],
    [
      agentContent?.updated_at,
      brandName,
      brandPlaceholder,
      dmKnowledge,
      dmPage,
      dmRestrictions,
      dmSoul,
      knowledge,
      maxChars,
      messageAgentContent?.updated_at,
      page,
      persona?.updated_at,
      restrictions,
      responseLanguage,
      saving,
      savingContent,
      savingMessageContent,
      selectedLanguage,
      signatureInstruction,
      signaturePlaceholder,
      soul,
    ],
  );

  return (
    <PreferencesSplitLayout
      eyebrow="Respostas automáticas"
      title="Persona da marca"
      description="Identidade, limites e conteúdo editorial dos agentes de comentários e DMs."
      sections={sections}
      loading={loading}
      loadingMessage="Carregando persona…"
    />
  );
}
