import { useLandingI18n } from "@/i18n/landing-context";
import { BrandLogo } from "@/components/layout/brand-logo";

export function LandingHeroStage() {
  const { m } = useLandingI18n();
  const stage = m.hero.stage;

  return (
    <div className="iris-hero-stage iris-product-preview relative mx-auto w-full max-w-[26rem] lg:max-w-none">
      <div className="iris-stage-panel overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-(--iris-hairline) px-5 py-3.5">
          <span
            className="size-7 shrink-0 rounded-full bg-(--iris-surface-pearl)"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-(--iris-ink)">
              {stage.postHandle}
            </p>
            <p className="truncate text-xs text-(--iris-ink-muted)">
              {stage.postCaption}
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-2.5">
            <span
              className="size-7 shrink-0 rounded-full bg-(--iris-surface-pearl)"
              aria-hidden
            />
            <div className="min-w-0 rounded-(--iris-radius-md) bg-(--iris-canvas-parchment) px-3.5 py-2.5">
              <p className="text-xs font-semibold text-(--iris-ink)">
                {stage.commentAuthor}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-(--iris-ink-soft)">
                {stage.commentBody}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pl-6">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--iris-canvas) ring-1 ring-(--iris-hairline)">
              <BrandLogo size="sm" className="size-6 rounded-full p-0.5" />
            </span>
            <div className="iris-stage-reply min-w-0">
              <p className="text-xs font-semibold text-(--iris-primary)">
                {stage.replyAuthor}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-(--iris-ink)">
                {stage.replyBody}
              </p>
              <p className="mt-1.5 text-xs text-(--iris-ink-muted)">
                {stage.replySignature}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="iris-live-dot shrink-0" aria-hidden />
            <span className="text-xs font-medium text-(--iris-primary)">
              {stage.statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
