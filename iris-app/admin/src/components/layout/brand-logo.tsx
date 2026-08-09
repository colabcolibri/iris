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
    <img
      src="/assets/iris-logo-concept.png"
      alt="Iris"
      className={cn("rounded-lg object-cover shadow-sm ring-1 ring-white/10", SIZE_CLASS[size], className)}
    />
  );
}
