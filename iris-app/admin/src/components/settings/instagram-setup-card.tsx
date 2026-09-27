import { SettingsCardShell } from "@/components/templates/settings-card-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMetaSession } from "@/contexts/meta-session-context";
import { useDomainMessages } from "@/i18n/provider";
import { fetchMetaSetup } from "@/lib/api";
import type { MetaSetupSnapshot, MetaSetupStep, MetaSetupStepStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type InstagramSetupCardProps = {
  embedded?: boolean;
};

const PHASE_STEP_IDS = {
  server: ["meta_app", "public_url"],
  account: ["instagram", "comments"],
  realtime: ["webhook", "messaging"],
} as const;

function stepIcon(status: MetaSetupStepStatus) {
  switch (status) {
    case "ok":
      return <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />;
    case "error":
      return <XCircle className="size-4 shrink-0 text-destructive" aria-hidden />;
    case "warning":
      return <AlertCircle className="size-4 shrink-0 text-amber-600" aria-hidden />;
    default:
      return <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
  }
}

function CopyField({
  id,
  label,
  value,
  hint,
  copyLabel,
  onCopySuccess,
  onCopyFailed,
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
  copyLabel: string;
  onCopySuccess: string;
  onCopyFailed: string;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(onCopySuccess);
    } catch {
      toast.error(onCopyFailed);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id={id}
          readOnly
          value={value}
          className="min-w-0 font-mono text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 sm:w-auto"
          onClick={() => void copy()}
        >
          {copyLabel}
        </Button>
      </div>
    </div>
  );
}

function PhaseCard({
  title,
  hint,
  steps,
  stepLabels,
}: {
  title: string;
  hint: string;
  steps: MetaSetupStep[];
  stepLabels: Record<string, string>;
}) {
  const okCount = steps.filter((s) => s.status === "ok").length;
  const phaseOk = steps.length > 0 && okCount === steps.length;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-sm border p-4",
        phaseOk ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-muted/20",
      )}
    >
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-2.5">
            {stepIcon(step.status)}
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm text-foreground">
                {stepLabels[step.id] ?? step.id}
              </p>
              {step.message ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {step.message}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InstagramSetupCard({ embedded = false }: InstagramSetupCardProps) {
  const t = useDomainMessages("settings").instagramSetup;
  const { meta } = useMetaSession();
  const [setup, setSetup] = useState<MetaSetupSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await fetchMetaSetup();
      setSetup(snapshot);
    } catch {
      toast.error(t.toasts.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.toasts.loadFailed]);

  useEffect(() => {
    void reload();
  }, [reload, meta?.connected]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("meta_connected") === "1" ||
      params.get("meta_page_connected") === "1"
    ) {
      void reload();
    }
  }, [reload]);

  const stepLabels: Record<string, string> = {
    meta_app: t.steps.metaApp,
    public_url: t.steps.publicUrl,
    webhook: t.steps.webhook,
    instagram: t.steps.instagram,
    comments: t.steps.comments,
    messaging: t.steps.messaging,
  };

  const stepsById = useMemo(() => {
    const map = new Map<string, MetaSetupStep>();
    for (const step of setup?.steps ?? []) {
      map.set(step.id, step);
    }
    return map;
  }, [setup?.steps]);

  const phaseSteps = useMemo(
    () => ({
      server: PHASE_STEP_IDS.server.map((id) => stepsById.get(id)).filter(Boolean) as MetaSetupStep[],
      account: PHASE_STEP_IDS.account.map((id) => stepsById.get(id)).filter(Boolean) as MetaSetupStep[],
      realtime: PHASE_STEP_IDS.realtime.map((id) => stepsById.get(id)).filter(Boolean) as MetaSetupStep[],
    }),
    [stepsById],
  );

  const progress = useMemo(() => {
    const steps = setup?.steps ?? [];
    const ok = steps.filter((s) => s.status === "ok").length;
    return { ok, total: steps.length };
  }, [setup?.steps]);

  const showDeveloperPanel =
    Boolean(setup?.webhook_url) &&
    (!setup?.instagram_connected ||
      stepsById.get("webhook")?.status !== "ok" ||
      stepsById.get("meta_app")?.status !== "ok" ||
      stepsById.get("public_url")?.status !== "ok");

  const needsPageConnect =
    setup?.instagram_connected && !setup.messaging_supported && !setup.page_connected;

  return (
    <SettingsCardShell
      embedded={embedded}
      title={t.title}
      description={t.description}
    >
      {loading && !setup ? (
        <p className="text-sm text-muted-foreground">{t.loading}</p>
      ) : null}

      {setup ? (
        <div className="space-y-6">
          <div
            className="rounded-sm border border-border bg-card px-4 py-3"
            role="status"
          >
            <p className="text-sm font-medium text-foreground">
              {progress.ok === progress.total && progress.total > 0
                ? t.progressReady
                : t.progress
                    .replace("{ok}", String(progress.ok))
                    .replace("{total}", String(progress.total))}
            </p>
            {!setup.instagram_connected && setup.ig_username ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t.connectedAs.replace("{username}", setup.ig_username)}
              </p>
            ) : null}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{
                  width:
                    progress.total > 0
                      ? `${Math.round((progress.ok / progress.total) * 100)}%`
                      : "0%",
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <PhaseCard
              title={t.phases.server}
              hint={t.phases.serverHint}
              steps={phaseSteps.server}
              stepLabels={stepLabels}
            />
            <PhaseCard
              title={t.phases.account}
              hint={t.phases.accountHint}
              steps={phaseSteps.account}
              stepLabels={stepLabels}
            />
            <PhaseCard
              title={t.phases.realtime}
              hint={t.phases.realtimeHint}
              steps={phaseSteps.realtime}
              stepLabels={stepLabels}
            />
          </div>

          <div
            className={cn(
              "space-y-4 rounded-sm border p-4 sm:p-5",
              setup.instagram_connected
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-border bg-muted/15",
            )}
          >
            {setup.instagram_connected ? (
              <>
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t.connectedTitle}
                    </h3>
                    {setup.ig_username ? (
                      <p className="text-sm text-foreground">
                        {t.connectedAs.replace("{username}", setup.ig_username)}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {t.connectedDescription}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <a
                    href="/auth/meta?mode=full"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    {t.reconnect}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void reload()}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    ) : null}
                    {t.refresh}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t.primaryConnectTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.primaryConnectDescription}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <a
                    href="/auth/meta?mode=full"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "w-full sm:w-auto",
                    )}
                  >
                    {t.connectPrimary}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void reload()}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    ) : null}
                    {t.refresh}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <a
                    href="/auth/meta?mode=essential"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {t.connectEssential}
                  </a>
                </p>
              </>
            )}
          </div>

          {setup.page_connected && setup.page_name ? (
            <p className="text-sm text-muted-foreground">
              {t.pageConnected.replace("{name}", setup.page_name)}
            </p>
          ) : null}

          {needsPageConnect ? (
            <div className="space-y-3 rounded-sm border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-sm text-foreground">{t.connectPageHint}</p>
              <a
                href="/auth/meta/page"
                className={buttonVariants({ variant: "secondary" })}
              >
                {t.connectPage}
              </a>
            </div>
          ) : null}

          {showDeveloperPanel ? (
            <Accordion className="rounded-sm border border-border px-4">
              <AccordionItem value="developer">
                <AccordionTrigger className="py-3 text-sm font-semibold">
                  {t.developerPanelTitle}
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <p className="text-xs text-muted-foreground">
                    {t.developerPanelDescription}
                  </p>
                  <CopyField
                    id="meta-webhook-url"
                    label={t.webhookUrlLabel}
                    value={setup.webhook_url ?? ""}
                    hint={t.webhookUrlHint}
                    copyLabel={t.copy}
                    onCopySuccess={t.copySuccess}
                    onCopyFailed={t.copyFailed}
                  />
                  {setup.redirect_uri ? (
                    <CopyField
                      id="meta-redirect-uri"
                      label={t.redirectUriLabel}
                      value={setup.redirect_uri}
                      hint={t.redirectUriHint}
                      copyLabel={t.copy}
                      onCopySuccess={t.copySuccess}
                      onCopyFailed={t.copyFailed}
                    />
                  ) : null}
                  {setup.page_redirect_uri ? (
                    <CopyField
                      id="meta-page-redirect-uri"
                      label={t.pageRedirectUriLabel}
                      value={setup.page_redirect_uri}
                      hint={t.pageRedirectUriHint}
                      copyLabel={t.copy}
                      onCopySuccess={t.copySuccess}
                      onCopyFailed={t.copyFailed}
                    />
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}

          {setup.messaging_supported || setup.page_connected ? (
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
              <span>{t.handoverHint}</span>
              <a
                href={setup.handover_help_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t.handoverLink}
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </SettingsCardShell>
  );
}
