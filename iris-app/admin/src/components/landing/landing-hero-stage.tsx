import { useLandingI18n } from "@/i18n/landing-context";
import { BrandLogo } from "@/components/layout/brand-logo";

export function LandingHeroStage() {
  const { m } = useLandingI18n();
  const stage = m.hero.stage;

  return (
    <div className="iris-hero-stage iris-product-preview relative mx-auto w-full max-w-[26rem] lg:max-w-none">
      <div className="iris-stage-panel overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-[color:var(--iris-hairline)] px-5 py-3.5">
          <span className="size-7 shrink-0 rounded-full bg-[color:var(--iris-surface-pearl)]" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[color:var(--iris-ink)]">
              {stage.postHandle}
            </p>
            <p className="truncate text-[11px] text-[color:var(--iris-ink-muted)]">{stage.postCaption}</p>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-2.5">
            <span className="size-7 shrink-0 rounded-full bg-[color:var(--iris-surface-pearl)]" aria-hidden />
            <div className="min-w-0 rounded-[var(--iris-radius-md)] bg-[color:var(--iris-canvas-parchment)] px-3.5 py-2.5">
              <p className="text-[12px] font-semibold text-[color:var(--iris-ink)]">{stage.commentAuthor}</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-[color:var(--iris-ink-soft)]">
                {stage.commentBody}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pl-6">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--iris-canvas)] ring-1 ring-[color:var(--iris-hairline)]">
              <BrandLogo size="sm" className="size-6 rounded-full p-0.5" />
            </span>
            <div className="iris-stage-reply min-w-0">
              <p className="text-[12px] font-semibold text-[color:var(--iris-primary)]">{stage.replyAuthor}</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-[color:var(--iris-ink)]">
                {stage.replyBody}
              </p>
              <p className="mt-1.5 text-[12px] text-[color:var(--iris-ink-muted)]">{stage.replySignature}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="iris-live-dot shrink-0" aria-hidden />
            <span className="text-[12px] font-medium text-[color:var(--iris-primary)]">
              {stage.statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
