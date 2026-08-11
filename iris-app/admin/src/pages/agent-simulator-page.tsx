import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ReplyAuditTimeline } from "@/components/comments/reply-audit-timeline";
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
import { fetchAgentContent, fetchReplyPersona, simulateAgentReply } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
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
import { estimateLlmTokens, formatTokenEstimate } from "@/lib/estimate-llm-tokens";
import { cn } from "@/lib/utils";

type ThreadRow = SimulateThreadMessage & { id: string };

function emptyThreadRow(): ThreadRow {
  return {
    id: crypto.randomUUID(),
    author: "fan",
    text: "",
    is_brand_reply: false,
  };
}

const TERMINAL_LABELS: Record<string, string> = {
  approved: "aprovado",
  approved_simple: "aprovado (simples)",
  skipped_triage: "ignorado na triagem",
  blocked_harmful: "bloqueado (harmful)",
  rejected_verify: "rejeitado na verificação",
};

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

type ContentFieldStat = {
  key: "soul" | "page" | "knowledge" | "restrictions";
  label: string;
  usedIn: string;
};

const CONTENT_FIELD_STATS: ContentFieldStat[] = [
  { key: "soul", label: "SOUL", usedIn: "resposta completa" },
  { key: "page", label: "Página", usedIn: "resposta completa" },
  { key: "knowledge", label: "Knowledge", usedIn: "simples + completa" },
  { key: "restrictions", label: "Restrições", usedIn: "triagem + drafts + verificação" },
];

export function AgentSimulatorPage() {
  const initialForm = applyScenarioToState(initialScenario);
  const [scenarioId, setScenarioId] = useState(DEFAULT_SIMULATOR_SCENARIO_ID);
  const [caption, setCaption] = useState(initialForm.caption);
  const [carouselSummary, setCarouselSummary] = useState(initialForm.carouselSummary);
  const [responseLanguage, setResponseLanguage] = useState(DEFAULT_RESPONSE_LANGUAGE);
  const [brandName, setBrandName] = useState("");
  const [targetAuthor, setTargetAuthor] = useState(initialForm.targetAuthor);
  const [targetText, setTargetText] = useState(initialForm.targetText);
  const [thread, setThread] = useState<ThreadRow[]>(initialForm.thread);
  const [running, setRunning] = useState(false);
  const [audit, setAudit] = useState<ReplyAudit | null>(null);
  const [finalText, setFinalText] = useState<string | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<string | null>(null);
  const [contentTokens, setContentTokens] = useState<Record<ContentFieldStat["key"], number>>({
    soul: 0,
    page: 0,
    knowledge: 0,
    restrictions: 0,
  });
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    void Promise.all([fetchReplyPersona(), fetchAgentContent()])
      .then(([persona, content]) => {
        setResponseLanguage(persona.response_language ?? DEFAULT_RESPONSE_LANGUAGE);
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
    setTerminalStatus(null);
  }

  async function handleRun() {
    if (!targetText.trim()) {
      toast.error("Informe o comentário alvo.");
      return;
    }

    setRunning(true);
    setAudit(null);
    setFinalText(null);
    setTerminalStatus(null);

    try {
      const result = await simulateAgentReply({
        caption,
        carousel_summary: carouselSummary.trim() || null,
        response_language: responseLanguage,
        brand_name: brandName.trim() || null,
        thread: thread
          .filter((row) => row.text.trim())
          .map((row) => ({
            author: row.author,
            text: row.text,
            is_brand_reply: row.is_brand_reply,
          })),
        target_comment: {
          author: targetAuthor.trim() || "user",
          text: targetText,
        },
      });
      setAudit(result.audit);
      setFinalText(result.final_text);
      setTerminalStatus(result.terminal_status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na simulação.");
    } finally {
      setRunning(false);
    }
  }

  const languageLabel =
    RESPONSE_LANGUAGE_OPTIONS.find((option) => option.code === responseLanguage)?.label ??
    responseLanguage;

  const selectedScenario = getSimulatorScenario(scenarioId);

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card lg:flex-row">
          <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-y-auto border-b border-border lg:w-[min(100%,440px)] lg:max-w-[440px] lg:border-b-0 lg:border-r">
            <div className="space-y-4 p-4 sm:p-5">
              <PageContainer.Header
                eyebrow="Operação"
                title="Simulador do agente"
                description="Monte uma thread fictícia e veja como o harness responderia — sem publicar na Meta."
              />

              <Card className="gap-3 border-primary/20 bg-primary/5 p-3 shadow-none">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">Prompts de produção</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    O simulador usa o mesmo harness do worker de comentários e lê SOUL, página,
                    knowledge e restrições salvos em{" "}
                    <Link to={ROUTES.admin.persona} className="text-primary underline-offset-4 hover:underline">
                      Persona
                    </Link>
                    . Triagem usa só restrições; resposta simples inclui knowledge; resposta
                    completa inclui SOUL e página.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CONTENT_FIELD_STATS.map((field) => {
                    const tokens = contentTokens[field.key];
                    const populated = tokens > 0;
                    return (
                      <span
                        key={field.key}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] leading-snug",
                          populated
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                            : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {field.label}:{" "}
                        {contentLoaded ? formatTokenEstimate(tokens) : "…"}
                      </span>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Estimativa de tokens (heurística ~3,5 chars/token — não é contagem exata do modelo).
                </p>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="sim-scenario">Cenário de exemplo</Label>
                <Select value={scenarioId} onValueChange={handleScenarioChange}>
                  <SelectTrigger id="sim-scenario" className="w-full bg-background">
                    <SelectValue>{selectedScenario?.label ?? "Cenário"}</SelectValue>
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
                  <p className="text-[11px] text-muted-foreground">{selectedScenario.description}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sim-language">Idioma da resposta</Label>
                <Select
                  value={responseLanguage}
                  onValueChange={(value) => {
                    if (value) setResponseLanguage(value);
                  }}
                >
                  <SelectTrigger id="sim-language" className="w-full bg-background">
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
                <Label htmlFor="sim-brand">Nome da marca</Label>
                <Input
                  id="sim-brand"
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sim-caption">Legenda do post</Label>
                <Textarea
                  id="sim-caption"
                  rows={2}
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sim-carousel">Resumo do carrossel</Label>
                <Textarea
                  id="sim-carousel"
                  rows={3}
                  value={carouselSummary}
                  onChange={(event) => setCarouselSummary(event.target.value)}
                  placeholder="Texto usado pelo harness em vez das imagens."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Thread (cronológica)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setThread((rows) => [...rows, emptyThreadRow()])}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Mensagem
                  </Button>
                </div>
                <div className="space-y-2">
                  {thread.map((row, index) => (
                    <div key={row.id} className="rounded-md border border-border/70 p-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={row.author}
                          onChange={(event) =>
                            setThread((rows) =>
                              rows.map((item, i) =>
                                i === index ? { ...item, author: event.target.value } : item,
                              ),
                            )
                          }
                          placeholder="autor"
                          className="h-8 text-xs"
                        />
                        <label className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(row.is_brand_reply)}
                            onChange={(event) =>
                              setThread((rows) =>
                                rows.map((item, i) =>
                                  i === index
                                    ? { ...item, is_brand_reply: event.target.checked }
                                    : item,
                                ),
                              )
                            }
                          />
                          marca
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7 shrink-0"
                          onClick={() =>
                            setThread((rows) => rows.filter((item) => item.id !== row.id))
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
                              i === index ? { ...item, text: event.target.value } : item,
                            ),
                          )
                        }
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Comentário alvo
                </p>
                <Input
                  value={targetAuthor}
                  onChange={(event) => setTargetAuthor(event.target.value)}
                  placeholder="@autor"
                  className="h-8 text-xs"
                />
                <Textarea
                  rows={2}
                  value={targetText}
                  onChange={(event) => setTargetText(event.target.value)}
                />
              </div>

              <Button type="button" className="w-full" onClick={() => void handleRun()} disabled={running}>
                {running ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Simular resposta
              </Button>
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold">Resultado</h2>
              {terminalStatus ? (
                <p className="text-xs text-muted-foreground">
                  Status:{" "}
                  <span className="font-semibold text-foreground">
                    {TERMINAL_LABELS[terminalStatus] ?? terminalStatus}
                  </span>
                </p>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
              {finalText ? (
                <div className="rounded-[var(--iris-radius-sm)] border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100">
                    Resposta publicável ({languageLabel})
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{finalText}</p>
                </div>
              ) : audit ? (
                <p className="text-sm text-muted-foreground">Nenhuma resposta aprovada nesta simulação.</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Escolha um cenário ou edite os campos e clique em simular para ver o harness em ação.
                </p>
              )}

              {audit ? (
                <div className={cn(!finalText && "opacity-90")}>
                  <ReplyAuditTimeline audit={audit} />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </PageContainer.Content>
    </PageContainer>
  );
}
