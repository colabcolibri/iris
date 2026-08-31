import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LandingSectionTone = "parchment" | "canvas" | "dark" | "pearl";

const TONE_CLASS: Record<LandingSectionTone, string> = {
  parchment: "bg-(--iris-canvas-parchment) text-(--iris-ink)",
  canvas: "bg-(--iris-canvas) text-(--iris-ink)",
  dark: "bg-(--iris-surface-tile) text-(--iris-ink-on-dark)",
  pearl: "bg-(--iris-surface-pearl) text-(--iris-ink)",
};

type LandingSectionProps = {
  id?: string;
  tone?: LandingSectionTone;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
};

export function LandingSection({
  id,
  tone = "parchment",
  children,
  className,
  containerClassName,
}: LandingSectionProps) {
  return (
    <section id={id} className={cn(TONE_CLASS[tone], className)}>
      <div
        className={cn(
          "mx-auto w-full min-w-0 max-w-(--iris-container) px-4 py-(--iris-section-y) sm:px-6 lg:px-8 lg:py-(--iris-section-y-lg)",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

type LandingSectionIntroProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  onDark?: boolean;
  className?: string;
};

export function LandingSectionIntro({
  eyebrow,
  title,
  subtitle,
  onDark = false,
  className,
}: LandingSectionIntroProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p
        className={cn(
          "text-xs font-medium tracking-[0.14em] uppercase",
          onDark
            ? "text-(--iris-ink-muted-on-dark)"
            : "text-(--iris-ink-muted)",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-[1.1]",
          onDark
            ? "text-(--iris-ink-on-dark)"
            : "text-(--iris-ink)",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg sm:leading-[1.55]",
            onDark
              ? "text-(--iris-ink-muted-on-dark)"
              : "text-(--iris-ink-soft)",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function LandingPrimaryCta({
  href,
  children,
  variant = "filled",
  newTab = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "filled" | "ghost";
  newTab?: boolean;
}) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex h-11 items-center justify-center px-6 text-base font-medium transition-transform active:scale-[0.98]",
        variant === "filled"
          ? "rounded-(--iris-radius-pill) bg-(--iris-primary) text-(--iris-on-primary) hover:opacity-95"
          : "rounded-(--iris-radius-pill) border border-(--iris-primary) text-(--iris-primary) hover:bg-(--iris-primary)/5",
      )}
    >
      {children}
    </a>
  );
}
