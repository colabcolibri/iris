import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import {
  buildContentStatFields,
  SimulatorContentStats,
} from "@/components/agent-simulator/simulator-content-stats";
import { SimulatorResultPanel } from "@/components/agent-simulator/simulator-result-panel";
import { SimulatorThreadEditor } from "@/components/agent-simulator/simulator-thread-editor";
import { emptySimulatorThreadRow } from "@/components/agent-simulator/types";
import { PageContainer } from "@/components/templates/page-container";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchMessageAgentContent,
  fetchReplyPersona,
  simulateAgentReply,
} from "@/lib/api";
import { useAppRoutes } from "@/demo/demo-routes";
import type { ReplyAudit } from "@/lib/types";
import {
  DEFAULT_MESSAGE_SIMULATOR_SCENARIO_ID,
  getMessageSimulatorScenario,
  MESSAGE_SIMULATOR_SCENARIOS,
  threadRowsFromMessageScenario,
} from "@/lib/message-simulator-scenarios";
import {
  DEFAULT_RESPONSE_LANGUAGE,
  RESPONSE_LANGUAGE_OPTIONS,
} from "@iris/domain/reply-language/response-languages";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";

function applyMessageScenario(scenario: NonNullable<ReturnType<typeof getMessageSimulatorScenario>>) {
  return {
    participantUsername: scenario.participant_username,
    replyPrompt: scenario.reply_prompt ?? "",
    thread: threadRowsFromMessageScenario(scenario),
    targetAuthor: scenario.target_author,
    targetText: scenario.target_text,
  };
}

const initialScenario = getMessageSimulatorScenario(DEFAULT_MESSAGE_SIMULATOR_SCENARIO_ID)!;
const initialForm = applyMessageScenario(initialScenario);

export function MessageSimulatorPage() {
  const routes = useAppRoutes();
  const { locale } = useAppLocale();
  const t = useDomainMessages("agent").messageSimulator;
  const [scenarioId, setScenarioId] = useState(DEFAULT_MESSAGE_SIMULATOR_SCENARIO_ID);
  const [participantUsername, setParticipantUsername] = useState(
    initialForm.participantUsername,
  );
  const [replyPrompt, setReplyPrompt] = useState(initialForm.replyPrompt);
  const [responseLanguage, setResponseLanguage] = useState(DEFAULT_RESPONSE_LANGUAGE);
  const [brandName, setBrandName] = useState("");
  const [targetAuthor, setTargetAuthor] = useState(initialForm.targetAuthor);
  const [targetText, setTargetText] = useState(initialForm.targetText);
  const [thread, setThread] = useState(initialForm.thread);
  const [running, setRunning] = useState(false);
  const [audit, setAudit] = useState<ReplyAudit | null>(null);
  const [finalText, setFinalText] = useState<string | null>(null);
  const [operatorNotifications, setOperatorNotifications] = useState<
    import("@/lib/api").OperatorNotificationLog[]
  >([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [dmContent, setDmContent] = useState({
    dmSoul: "",
    dmPage: "",
    dmKnowledge: "",
    dmRestrictions: "",
  });

  useEffect(() => {
    void Promise.all([fetchReplyPersona(), fetchMessageAgentContent()])
      .then(([persona, content]) => {
        setResponseLanguage(persona.response_language ?? DEFAULT_RESPONSE_LANGUAGE);
        setBrandName(persona.brand_name ?? "");
        setDmContent({
          dmSoul: content.dm_soul ?? "",
          dmPage: content.dm_page ?? "",
          dmKnowledge: content.dm_knowledge ?? "",
          dmRestrictions: content.dm_restrictions ?? "",
        });
        setContentLoaded(true);
      })
      .catch(() => undefined);
  }, []);

  function handleScenarioChange(id: string | null) {
    if (!id) return;
    setScenarioId(id);
    const scenario = getMessageSimulatorScenario(id);
    if (!scenario) return;

    const form = applyMessageScenario(scenario);
    setParticipantUsername(form.participantUsername);
    setReplyPrompt(form.replyPrompt);
    setThread(form.thread.length > 0 ? form.thread : [emptySimulatorThreadRow()]);
    setTargetAuthor(form.targetAuthor);
    setTargetText(form.targetText);
    setAudit(null);
    setFinalText(null);
    setOperatorNotifications([]);
  }

  async function handleRun() {
    if (!targetText.trim()) {
      toast.error(t.toasts.targetMessageRequired);
      return;
    }

    setRunning(true);
    setAudit(null);
    setFinalText(null);
    setOperatorNotifications([]);

    try {
      const threadPayload = thread
        .filter((row) => row.text.trim())
        .map((row) => ({
          author: row.author,
          text: row.text,
          is_brand_reply: row.is_brand_reply,
        }));

      const result = await simulateAgentReply({
        channel: "dm",
        response_language: responseLanguage,
        brand_name: brandName.trim() || null,
        participant_username: participantUsername.trim() || targetAuthor.trim() || "user",
        reply_prompt: replyPrompt.trim() || null,
        thread: threadPayload,
        target_message: {
          author: targetAuthor.trim() || participantUsername.trim() || "user",
          text: targetText,
        },
      });

      setAudit(result.audit);
      setFinalText(result.final_text);
      setOperatorNotifications(result.operator_notifications ?? []);
      if (result.response_language) {
        setResponseLanguage(result.response_language);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.simulateFailed);
    } finally {
      setRunning(false);
    }
  }

  const languageLabel =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)?.label ??
    responseLanguage;

  const appliedLanguageLabel =
    audit?.response_language != null
      ? RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === audit.response_language)
          ?.label ?? audit.response_language
      : languageLabel;

  const selectedScenario = getMessageSimulatorScenario(scenarioId);
  const contentFields = buildContentStatFields(t.contentStats, {
    dmSoul: dmContent.dmSoul,
    dmPage: dmContent.dmPage,
    dmKnowledge: dmContent.dmKnowledge,
    dmRestrictions: dmContent.dmRestrictions,
  });

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <aside className="m-4 flex min-h-0 w-auto shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-none lg:m-6 lg:mr-0 lg:w-[min(100%,420px)] lg:max-w-105">
            <PageScrollArea contentClassName="space-y-5 p-4 sm:p-5">
              <PageContainer.Header
                eyebrow={t.page.eyebrow}
                title={t.page.title}
                description={t.page.description}
              />

              <SimulatorContentStats
                fields={contentFields}
                loaded={contentLoaded}
                personaHref={routes.persona}
                personaLinkLabel={t.page.personaLink}
                tokenEstimateTitle={t.page.tokenEstimateTitle}
                tokenEstimateMessages={t.tokenEstimate}
              />

              <div className="space-y-2">
                <Label htmlFor="msg-sim-scenario">{t.fields.scenario}</Label>
                <Select value={scenarioId} onValueChange={handleScenarioChange}>
                  <SelectTrigger id="msg-sim-scenario" className="w-full bg-card">
                    <SelectValue>
                      {selectedScenario?.label ?? t.fields.scenarioDefault}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {MESSAGE_SIMULATOR_SCENARIOS.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedScenario ? (
                  <p className="text-xs text-muted-foreground">{selectedScenario.description}</p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="msg-sim-language">{t.fields.language}</Label>
                  <Select
                    value={responseLanguage}
                    onValueChange={(value) => {
                      if (value) setResponseLanguage(value);
                    }}
                  >
                    <SelectTrigger id="msg-sim-language" className="w-full bg-card">
                      <SelectValue>{languageLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {RESPONSE_LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msg-sim-brand">{t.fields.brand}</Label>
                  <Input
                    id="msg-sim-brand"
                    value={brandName}
                    onChange={(event) => setBrandName(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="msg-sim-participant">{t.fields.participant}</Label>
                <Input
                  id="msg-sim-participant"
                  value={participantUsername}
                  onChange={(event) => setParticipantUsername(event.target.value)}
                  placeholder={t.fields.participantPlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="msg-sim-reply-prompt">{t.fields.replyPrompt}</Label>
                <Textarea
                  id="msg-sim-reply-prompt"
                  rows={2}
                  value={replyPrompt}
                  onChange={(event) => setReplyPrompt(event.target.value)}
                  placeholder={t.fields.replyPromptPlaceholder}
                />
              </div>

              <SimulatorThreadEditor
                thread={thread}
                onThreadChange={setThread}
                targetAuthor={targetAuthor}
                onTargetAuthorChange={setTargetAuthor}
                targetText={targetText}
                onTargetTextChange={setTargetText}
                labels={{
                  thread: t.fields.thread,
                  addMessage: t.fields.addMessage,
                  authorPlaceholder: t.fields.authorPlaceholder,
                  brandCheckbox: t.fields.brandCheckbox,
                  targetTitle: t.fields.targetMessage,
                  targetAuthorPlaceholder: t.fields.targetAuthorPlaceholder,
                }}
              />

              <Button
                type="button"
                className="w-full"
                onClick={() => void handleRun()}
                disabled={running}
              >
                {running ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {running ? t.fields.running : t.fields.run}
              </Button>
            </PageScrollArea>
          </aside>

          <SimulatorResultPanel
            eyebrow={t.page.resultEyebrow}
            title={t.page.resultTitle}
            description={t.page.resultDescription}
            running={running}
            runningLabel={t.fields.running}
            audit={audit}
            finalText={finalText}
            languageLabel={appliedLanguageLabel}
            emptyTitle={t.empty.title}
            emptyBody={t.empty.body}
            noApprovedLabel={t.empty.noApproved}
            operatorNotifications={operatorNotifications}
            operatorNotificationLabels={t.operatorNotifications}
          />
        </div>
      </PageContainer.Content>
    </PageContainer>
  );
}
