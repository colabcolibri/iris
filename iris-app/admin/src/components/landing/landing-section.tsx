import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LandingSectionTone = "parchment" | "canvas" | "dark" | "pearl";

const TONE_CLASS: Record<LandingSectionTone, string> = {
  parchment: "bg-[color:var(--iris-canvas-parchment)] text-[color:var(--iris-ink)]",
  canvas: "bg-[color:var(--iris-canvas)] text-[color:var(--iris-ink)]",
  dark: "bg-[color:var(--iris-surface-tile)] text-[color:var(--iris-ink-on-dark)]",
  pearl: "bg-[color:var(--iris-surface-pearl)] text-[color:var(--iris-ink)]",
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
          "mx-auto w-full min-w-0 max-w-[var(--iris-container)] px-4 py-[var(--iris-section-y)] sm:px-6 lg:px-8 lg:py-[var(--iris-section-y-lg)]",
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
          onDark ? "text-[color:var(--iris-ink-muted-on-dark)]" : "text-[color:var(--iris-ink-muted)]",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-[1.1]",
          onDark ? "text-[color:var(--iris-ink-on-dark)]" : "text-[color:var(--iris-ink)]",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg sm:leading-[1.55]",
            onDark ? "text-[color:var(--iris-ink-muted-on-dark)]" : "text-[color:var(--iris-ink-soft)]",
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
}: {
  href: string;
  children: ReactNode;
  variant?: "filled" | "ghost";
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center px-6 text-[15px] font-medium transition-transform active:scale-[0.98]",
        variant === "filled"
          ? "rounded-[var(--iris-radius-pill)] bg-[color:var(--iris-primary)] text-[color:var(--iris-on-primary)] hover:opacity-95"
          : "rounded-[var(--iris-radius-pill)] border border-[color:var(--iris-primary)] text-[color:var(--iris-primary)] hover:bg-[color:var(--iris-primary)]/5",
      )}
    >
      {children}
    </a>
  );
}
