import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS } from "@/i18n/routing";
import {
  LandingSection,
  LandingSectionIntro,
} from "@/components/landing/landing-section";
import { cn } from "@/lib/utils";

export function LandingFeatures() {
  const { m } = useLandingI18n();

  return (
    <LandingSection id={LANDING_SECTIONS.features} tone="canvas">
      <LandingSectionIntro
        eyebrow={m.features.sectionLabel}
        title={
          <>
            {m.features.title}{" "}
            <span className="italic text-[color:var(--iris-primary)]">
              {m.features.titleAccent}
            </span>
          </>
        }
        subtitle={m.features.subtitle}
        className="max-w-3xl"
      />

      <div className="mt-14 divide-y divide-[color:var(--iris-hairline)] border-y border-[color:var(--iris-hairline)]">
        {m.features.items.map((feature, index) => (
          <div
            key={feature.title}
            className="grid grid-cols-1 gap-6 py-10 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
          >
            <div className="min-w-0">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-3xl text-[color:var(--iris-ink-muted)] sm:text-4xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="font-display text-2xl leading-[1.15] font-semibold text-[color:var(--iris-ink)] sm:text-3xl">
                  {feature.title}
                </p>
              </div>
              <p className="mt-3 max-w-md text-base leading-relaxed text-[color:var(--iris-ink-soft)] sm:text-lg sm:leading-[1.55]">
                {feature.description}
              </p>
              {feature.highlight ? (
                <span className="mt-4 inline-flex items-center rounded-[var(--iris-radius-xs)] bg-[color:var(--iris-primary)] px-2.5 py-1 text-xs font-bold tracking-[0.08em] text-[color:var(--iris-on-primary)] uppercase">
                  MCP
                </span>
              ) : null}
            </div>

            <div className={cn("min-w-0", index % 2 === 1 && "lg:order-first")}>
              <FeatureVisual index={index} />
            </div>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}

function FeatureVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="iris-utility-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[color:var(--iris-hairline)] px-5 py-3">
          <span className="iris-live-dot shrink-0" aria-hidden />
          <span className="text-xs font-semibold tracking-[0.1em] text-[color:var(--iris-ink-muted)] uppercase">
            MCP tools
          </span>
        </div>
        <div className="divide-y divide-[color:var(--iris-hairline)]">
          {[
            "iris_create_post",
            "iris_prepare_post_asset_upload",
            "iris_list_post_comments",
            "iris_get_post_insights",
          ].map((tool) => (
            <div
              key={tool}
              className="px-5 py-3.5 font-mono text-sm text-[color:var(--iris-ink-soft)]"
            >
              {tool}
              <span className="text-[color:var(--iris-primary)]">()</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="iris-utility-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[color:var(--iris-hairline)] px-5 py-3">
          <span className="text-xs font-semibold tracking-[0.1em] text-[color:var(--iris-ink-muted)] uppercase">
            Agosto · calendário
          </span>
        </div>
        <div className="grid grid-cols-7 gap-px bg-[color:var(--iris-hairline)] p-px">
          {Array.from({ length: 21 }).map((_, cell) => {
            const marked = [4, 9, 13, 17].includes(cell);
            return (
              <div
                key={cell}
                className={cn(
                  "flex aspect-square items-center justify-center bg-[color:var(--iris-canvas)] text-xs text-[color:var(--iris-ink-muted)]",
                  marked &&
                    "bg-[color:var(--iris-primary)]/10 font-semibold text-[color:var(--iris-primary)]",
                )}
              >
                {cell + 1}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="iris-utility-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[color:var(--iris-hairline)] px-5 py-3">
          <span className="text-xs font-semibold tracking-[0.1em] text-[color:var(--iris-ink-muted)] uppercase">
            Harness · 3 etapas
          </span>
        </div>
        <div className="space-y-3 p-5">
          {[
            ["Triagem", "shouldReply · replyTier · blockCategory"],
            ["Rascunho", "persona + restrições + contexto da thread"],
            ["Verificação", "idioma, limites e tom auditados"],
          ].map(([step, detail], i) => (
            <div key={step} className="flex items-start gap-3">
              <span className="font-display text-sm text-[color:var(--iris-ink-muted)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[color:var(--iris-ink)]">
                  {step}
                </p>
                <p className="mt-0.5 truncate text-xs text-[color:var(--iris-ink-muted)]">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="iris-utility-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[color:var(--iris-hairline)] px-5 py-3">
        <span className="text-xs font-semibold tracking-[0.1em] text-[color:var(--iris-ink-muted)] uppercase">
          Webhook · Meta Graph API
        </span>
      </div>
      <div className="p-5">
        <div className="iris-stage-code-block">
          <p className="font-mono text-xs text-[color:var(--iris-ink-muted)]">
            X-Hub-Signature-256
          </p>
          <p className="mt-2 font-mono text-xs break-all text-[color:var(--iris-ink-soft)]">
            sha256=4f2a9c…e81d — assinatura verificada
          </p>
        </div>
        <p className="mt-4 text-sm text-[color:var(--iris-ink-soft)]">
          Evento{" "}
          <span className="font-medium text-[color:var(--iris-primary)]">
            comments
          </span>{" "}
          sincronizado em 340ms.
        </p>
      </div>
    </div>
  );
}
