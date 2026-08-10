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

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-black/5",
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
