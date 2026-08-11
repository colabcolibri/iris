import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-normal whitespace-nowrap transition-transform outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 active:not-aria-[haspopup]:scale-95",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary px-[22px] py-[11px] text-base leading-none text-primary-foreground hover:bg-primary/90",
        outline:
          "rounded-full border-primary bg-transparent px-[22px] py-[11px] text-base leading-none text-primary hover:bg-primary/5",
        secondary:
          "rounded-[var(--iris-radius-md)] border-[3px] border-[var(--iris-divider-soft)] bg-secondary px-3.5 py-2 text-sm text-secondary-foreground hover:bg-secondary/90",
        ghost:
          "rounded-[var(--iris-radius-sm)] hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        destructive:
          "rounded-full bg-destructive/10 px-[22px] py-[11px] text-base leading-none text-destructive hover:bg-destructive/20 focus-visible:outline-destructive",
        link: "rounded-none px-0 text-base text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-auto gap-1.5 min-h-11",
        xs: "h-7 gap-1 rounded-[var(--iris-radius-sm)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[var(--iris-radius-sm)] px-3.5 text-sm",
        lg: "h-auto min-h-12 gap-1.5 px-7 py-3.5 text-lg font-light",
        icon: "size-11 rounded-full p-0",
        "icon-xs":
          "size-7 rounded-full p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-full p-0",
        "icon-lg": "size-11 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
