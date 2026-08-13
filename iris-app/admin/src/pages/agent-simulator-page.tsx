import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ReplyAuditTimeline } from "@/components/comments/reply-audit-timeline";
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
import {
  fetchAgentContent,
  fetchReplyPersona,
  simulateAgentReply,
} from "@/lib/api";
import { useAppRoutes } from "@/demo/demo-routes";
import type { ReplyAudit } from "@/lib/types";
import type { SimulateThreadMessage } from "@/lib/api";
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
import {
  estimateLlmTokens,
  formatTokenEstimate,
} from "@/lib/estimate-llm-tokens";
import { cn } from "@/lib/utils";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { getApiErrorMessage } from "@/lib/api-error";

type ThreadRow = SimulateThreadMessage & { id: string };

function emptyThreadRow(): ThreadRow {
  return {
    id: crypto.randomUUID(),
    author: "fan",
    text: "",
    is_brand_reply: false,
  };
}

const initialScenario = getSimulatorScenario(DEFAULT_SIMULATOR_SCENARIO_ID)!;

function applyScenarioToState(scenario: typeof initialScenario) {
  return {
    caption: scenario.caption,
    carouselSummary: scenario.carousel_summary,
    thread: threadRowsFromScenario(scenario),
    targetAuthor: scenario.target_author,
    targetText: scenario.target_text,
  };
}

const CONTENT_FIELD_STATS = [
  { key: "soul", labelKey: "soul" },
  { key: "page", labelKey: "page" },
  { key: "knowledge", labelKey: "knowledge" },
  { key: "restrictions", labelKey: "restrictions" },
] as const;

export function AgentSimulatorPage() {
  const routes = useAppRoutes();
  const { locale } = useAppLocale();
  const t = useDomainMessages("agent").simulator;
  const initialForm = applyScenarioToState(initialScenario);
  const [scenarioId, setScenarioId] = useState(DEFAULT_SIMULATOR_SCENARIO_ID);
  const [channel, setChannel] = useState<"comment" | "dm">("comment");
  const [caption, setCaption] = useState(initialForm.caption);
  const [carouselSummary, setCarouselSummary] = useState(
    initialForm.carouselSummary,
  );
  const [responseLanguage, setResponseLanguage] = useState(
    DEFAULT_RESPONSE_LANGUAGE,
  );
  const [brandName, setBrandName] = useState("");
  const [targetAuthor, setTargetAuthor] = useState(initialForm.targetAuthor);
  const [targetText, setTargetText] = useState(initialForm.targetText);
  const [thread, setThread] = useState<ThreadRow[]>(initialForm.thread);
  const [running, setRunning] = useState(false);
  const [audit, setAudit] = useState<ReplyAudit | null>(null);
  const [finalText, setFinalText] = useState<string | null>(null);
  const [contentTokens, setContentTokens] = useState<
    Record<(typeof CONTENT_FIELD_STATS)[number]["key"], number>
  >({
    soul: 0,
    page: 0,
    knowledge: 0,
    restrictions: 0,
  });
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    void Promise.all([fetchReplyPersona(), fetchAgentContent()])
      .then(([persona, content]) => {
        setResponseLanguage(
          persona.response_language ?? DEFAULT_RESPONSE_LANGUAGE,
        );
        setBrandName(persona.brand_name ?? "");
        setContentTokens({
          soul: estimateLlmTokens(content.soul),
          page: estimateLlmTokens(content.page),
          knowledge: estimateLlmTokens(content.knowledge),
          restrictions: estimateLlmTokens(content.restrictions),
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

    const form = applyScenarioToState(scenario);
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
      toast.error(
        channel === "dm"
          ? t.toasts.targetMessageRequired
          : t.toasts.targetCommentRequired,
      );
      return;
    }

    setRunning(true);
    setAudit(null);
    setFinalText(null);

    try {
      const threadPayload = thread
        .filter((row) => row.text.trim())
        .map((row) => ({
          author: row.author,
          text: row.text,
          is_brand_reply: row.is_brand_reply,
        }));

      const result = await simulateAgentReply(
        channel === "dm"
          ? {
              channel: "dm",
              response_language: responseLanguage,
              brand_name: brandName.trim() || null,
              thread: threadPayload,
              participant_username: targetAuthor.trim() || "user",
              target_message: {
                author: targetAuthor.trim() || "user",
                text: targetText,
              },
            }
          : {
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
            },
      );
      setAudit(result.audit);
      setFinalText(result.final_text);
    } catch (err) {
      toast.error(getApiErrorMessage(err, locale) || t.toasts.simulateFailed);
    } finally {
      setRunning(false);
    }
  }

  const languageLabel =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)
      ?.label ?? responseLanguage;

  const selectedScenario = getSimulatorScenario(scenarioId);
  const hasResult = Boolean(audit);

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <aside className="m-4 flex min-h-0 w-auto shrink-0 flex-col overflow-hidden rounded-(--iris-radius-lg) border border-border bg-card shadow-none lg:m-6 lg:mr-0 lg:w-[min(100%,420px)] lg:max-w-105">
            <PageScrollArea contentClassName="space-y-5 p-4 sm:p-5">
              <PageContainer.Header
                eyebrow={t.page.eyebrow}
                title={t.page.title}
                description={t.page.description}
              />

              <div className="flex flex-wrap gap-1.5">
                {CONTENT_FIELD_STATS.map((field) => {
                  const tokens = contentTokens[field.key];
                  const populated = tokens > 0;
                  return (
                    <span
                      key={field.key}
                      className={cn(
                        "rounded-(--iris-radius-sm) border px-2 py-0.5 text-xs",
                        populated
                          ? "border-primary/30 bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground",
                      )}
                      title={t.page.tokenEstimateTitle}
                    >
                      {t.contentStats[field.labelKey as keyof typeof t.contentStats]}:{" "}
                      {contentLoaded ? formatTokenEstimate(tokens) : "…"}
                    </span>
                  );
                })}
                <Link
                  to={routes.persona}
                  className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {t.page.personaLink}
                </Link>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sim-channel">{t.fields.channel}</Label>
                <Select
                  value={channel}
                  onValueChange={(value) => {
                    if (value === "comment" || value === "dm") {
                      setChannel(value);
                    }
                  }}
                >
                  <SelectTrigger id="sim-channel" className="w-full bg-card">
                    <SelectValue>
                      {channel === "dm" ? t.fields.channelDm : t.fields.channelComment}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="comment">{t.fields.channelComment}</SelectItem>
                    <SelectItem value="dm">{t.fields.channelDm}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sim-scenario">{t.fields.scenario}</Label>
                <Select value={scenarioId} onValueChange={handleScenarioChange}>
                  <SelectTrigger
                    id="sim-scenario"
                    className="w-full bg-card"
                  >
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
                  <p className="text-xs text-muted-foreground">
                    {selectedScenario.description}
                  </p>
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
                    <SelectTrigger
                      id="sim-language"
                      className="w-full bg-card"
                    >
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

              {channel === "comment" ? (
                <>
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
                </>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>{t.fields.thread}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setThread((rows) => [...rows, emptyThreadRow()])
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {t.fields.addMessage}
                  </Button>
                </div>

                <div className="space-y-3">
                  {thread.map((row, index) => {
                    const isBrand = Boolean(row.is_brand_reply);
                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "flex flex-col gap-2",
                          isBrand ? "items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "w-full max-w-[95%] rounded-(--iris-radius-lg) border p-3",
                            isBrand
                              ? "border-primary/25 bg-primary/5"
                              : "border-border/70 bg-muted/20",
                          )}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Input
                              value={row.author}
                              onChange={(event) =>
                                setThread((rows) =>
                                  rows.map((item, i) =>
                                    i === index
                                      ? { ...item, author: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                              placeholder={t.fields.authorPlaceholder}
                              className="h-8 text-xs"
                            />
                            <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={isBrand}
                                onChange={(event) =>
                                  setThread((rows) =>
                                    rows.map((item, i) =>
                                      i === index
                                        ? {
                                            ...item,
                                            is_brand_reply:
                                              event.target.checked,
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              {t.fields.brandCheckbox}
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 shrink-0"
                              onClick={() =>
                                setThread((rows) =>
                                  rows.filter((item) => item.id !== row.id),
                                )
                              }
                              disabled={thread.length <= 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Textarea
                            rows={2}
                            value={row.text}
                            onChange={(event) =>
                              setThread((rows) =>
                                rows.map((item, i) =>
                                  i === index
                                    ? { ...item, text: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 rounded-(--iris-radius-lg) border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                  {t.fields.targetComment}
                </p>
                <Input
                  value={targetAuthor}
                  onChange={(event) => setTargetAuthor(event.target.value)}
                  placeholder={t.fields.targetAuthorPlaceholder}
                  className="h-8 text-xs"
                />
                <Textarea
                  rows={2}
                  value={targetText}
                  onChange={(event) => setTargetText(event.target.value)}
                />
              </div>

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

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 px-4 py-4 sm:px-6 md:px-8">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {t.page.resultEyebrow}
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {t.page.resultTitle}
              </h2>
              <p className="mt-1 max-w-2xl text-base text-muted-foreground">
                {t.page.resultDescription}
              </p>
            </div>
            <PageScrollArea contentClassName="p-4 sm:p-6 md:px-8">
              <div className="w-full">
                {!hasResult && !running ? (
                  <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-(--iris-radius-lg) border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                    <p className="font-display text-xl font-semibold text-foreground">
                      {t.empty.title}
                    </p>
                    <p className="mt-2 max-w-sm text-base text-muted-foreground">
                      {t.empty.body}
                    </p>
                  </div>
                ) : null}

                {running ? (
                  <p className="text-base text-muted-foreground">{t.fields.running}</p>
                ) : null}

                {audit ? (
                  <ReplyAuditTimeline
                    audit={audit}
                    proposedReply={finalText}
                    proposedReplyLanguageLabel={languageLabel}
                  />
                ) : null}

                {audit && !finalText ? (
                  <p className="mt-4 text-base text-muted-foreground">
                    {t.empty.noApproved}
                  </p>
                ) : null}
              </div>
            </PageScrollArea>
          </section>
        </div>
      </PageContainer.Content>
    </PageContainer>
  );
}
