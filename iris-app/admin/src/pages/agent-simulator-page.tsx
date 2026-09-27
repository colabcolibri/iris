import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import {
  buildContentStatFields,
  SimulatorContentStats,
} from "@/components/agent-simulator/simulator-content-stats";
import { SimulatorResultPanel } from "@/components/agent-simulator/simulator-result-panel";
import { SimulatorThreadEditor } from "@/components/agent-simulator/simulator-thread-editor";
import { PageContainer } from "@/components/templates/page-container";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
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
import { fetchAgentContent, fetchReplyPersona, simulateAgentReply } from "@/lib/api";
import { useAppRoutes } from "@/demo/demo-routes";
import type { ReplyAudit } from "@/lib/types";
import type { SimulateThreadMessage } from "@/lib/api";
import type { SimulatorThreadRow } from "@/components/agent-simulator/types";
import {
  DEFAULT_SIMULATOR_SCENARIO_ID,
  getSimulatorScenario,
  SIMULATOR_SCENARIOS,
  threadRowsFromScenario,
} from "@/lib/agent-simulator-scenarios";
import {
  DEFAULT_RESPONSE_LANGUAGE,
  RESPONSE_LANGUAGE_OPTIONS,
} from "@iris/domain/reply-language/response-languages";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";

function applyCommentScenario(scenario: NonNullable<ReturnType<typeof getSimulatorScenario>>) {
  return {
    caption: scenario.caption,
    carouselSummary: scenario.carousel_summary,
    thread: threadRowsFromScenario(scenario),
    targetAuthor: scenario.target_author,
    targetText: scenario.target_text,
  };
}

const initialScenario = getSimulatorScenario(DEFAULT_SIMULATOR_SCENARIO_ID)!;
const initialForm = applyCommentScenario(initialScenario);

export function AgentSimulatorPage() {
  const routes = useAppRoutes();
  const { locale } = useAppLocale();
  const t = useDomainMessages("agent").simulator;
  const [scenarioId, setScenarioId] = useState(DEFAULT_SIMULATOR_SCENARIO_ID);
  const [caption, setCaption] = useState(initialForm.caption);
  const [carouselSummary, setCarouselSummary] = useState(initialForm.carouselSummary);
  const [responseLanguage, setResponseLanguage] = useState(DEFAULT_RESPONSE_LANGUAGE);
  const [brandName, setBrandName] = useState("");
  const [targetAuthor, setTargetAuthor] = useState(initialForm.targetAuthor);
  const [targetText, setTargetText] = useState(initialForm.targetText);
  const [thread, setThread] = useState<SimulatorThreadRow[]>(initialForm.thread);
  const [running, setRunning] = useState(false);
  const [audit, setAudit] = useState<ReplyAudit | null>(null);
  const [finalText, setFinalText] = useState<string | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [agentContent, setAgentContent] = useState({
    soul: "",
    page: "",
    knowledge: "",
    restrictions: "",
  });

  useEffect(() => {
    void Promise.all([fetchReplyPersona(), fetchAgentContent()])
      .then(([persona, content]) => {
        setResponseLanguage(persona.response_language ?? DEFAULT_RESPONSE_LANGUAGE);
        setBrandName(persona.brand_name ?? "");
        setAgentContent({
          soul: content.soul ?? "",
          page: content.page ?? "",
          knowledge: content.knowledge ?? "",
          restrictions: content.restrictions ?? "",
        });
        setContentLoaded(true);
      })
      .catch(() => undefined);
  }, []);

  function handleScenarioChange(id: string | null) {
    if (!id) return;
    setScenarioId(id);
    const scenario = getSimulatorScenario(id);
    if (!scenario) return;

    const form = applyCommentScenario(scenario);
    setCaption(form.caption);
    setCarouselSummary(form.carouselSummary);
    setThread(form.thread);
    setTargetAuthor(form.targetAuthor);
    setTargetText(form.targetText);
    setAudit(null);
    setFinalText(null);
  }

  async function handleRun() {
    if (!targetText.trim()) {
      toast.error(t.toasts.targetCommentRequired);
      return;
    }

    setRunning(true);
    setAudit(null);
    setFinalText(null);

    try {
      const threadPayload: SimulateThreadMessage[] = thread
        .filter((row) => row.text.trim())
        .map((row) => ({
          author: row.author,
          text: row.text,
          is_brand_reply: row.is_brand_reply,
        }));

      const result = await simulateAgentReply({
        channel: "comment",
        caption,
        carousel_summary: carouselSummary.trim() || null,
        response_language: responseLanguage,
        brand_name: brandName.trim() || null,
        thread: threadPayload,
        target_comment: {
          author: targetAuthor.trim() || "user",
          text: targetText,
        },
      });

      setAudit(result.audit);
      setFinalText(result.final_text);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.simulateFailed);
    } finally {
      setRunning(false);
    }
  }

  const languageLabel =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)?.label ??
    responseLanguage;

  const selectedScenario = getSimulatorScenario(scenarioId);
  const contentFields = buildContentStatFields(t.contentStats, agentContent);

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <aside className="m-4 flex min-h-0 w-auto shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-none lg:m-6 lg:mr-0 lg:w-[min(100%,420px)] lg:max-w-105">
            <PageScrollArea contentClassName="space-y-5 p-4 sm:p-5">
              <PageContainer.Header
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
                <Label htmlFor="sim-scenario">{t.fields.scenario}</Label>
                <Select value={scenarioId} onValueChange={handleScenarioChange}>
                  <SelectTrigger id="sim-scenario" className="w-full bg-card">
                    <SelectValue>
                      {selectedScenario?.label ?? t.fields.scenarioDefault}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {SIMULATOR_SCENARIOS.map((scenario) => (
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
                  <Label htmlFor="sim-language">{t.fields.language}</Label>
                  <Select
                    value={responseLanguage}
                    onValueChange={(value) => {
                      if (value) setResponseLanguage(value);
                    }}
                  >
                    <SelectTrigger id="sim-language" className="w-full bg-card">
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
                  <Label htmlFor="sim-brand">{t.fields.brand}</Label>
                  <Input
                    id="sim-brand"
                    value={brandName}
                    onChange={(event) => setBrandName(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sim-caption">{t.fields.caption}</Label>
                <Textarea
                  id="sim-caption"
                  rows={2}
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sim-carousel">{t.fields.carouselSummary}</Label>
                <Textarea
                  id="sim-carousel"
                  rows={2}
                  value={carouselSummary}
                  onChange={(event) => setCarouselSummary(event.target.value)}
                  placeholder={t.fields.carouselPlaceholder}
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
                  targetTitle: t.fields.targetComment,
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
            title={t.page.resultTitle}
            description={t.page.resultDescription}
            running={running}
            runningLabel={t.fields.running}
            audit={audit}
            finalText={finalText}
            languageLabel={languageLabel}
            emptyTitle={t.empty.title}
            emptyBody={t.empty.body}
            noApprovedLabel={t.empty.noApproved}
          />
        </div>
      </PageContainer.Content>
    </PageContainer>
  );
}
