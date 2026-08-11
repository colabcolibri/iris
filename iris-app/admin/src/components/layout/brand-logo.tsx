import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

/** Lockup do símbolo Iris — sem sombra; superfície canvas para contraste na sidebar. */
export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[var(--iris-radius-sm)] bg-card p-1",
        SIZE_CLASS[size],
        className,
      )}
    >
      <img
        src="/assets/iris-logo.png"
        alt="Iris"
        className="size-full object-contain"
      />
    </span>
  );
}
