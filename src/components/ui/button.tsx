import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles with micro-interactions (press effect)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
      variants: {
        variant: {
          // Primary: Main CTA button with brand purple
          default: "bg-action-primary text-text-on-brand border border-transparent hover:bg-action-primary-hover shadow-glow-sm hover:shadow-glow",
          // Destructive: Danger/error actions
          destructive:
            "bg-action-danger text-white border border-transparent hover:border-white/50 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
          // Outline: Secondary actions
          outline:
            "border border-border-ds-default bg-transparent hover:border-border-ds-brand hover:bg-surface-subtle dark:bg-transparent",
          // Secondary: Less prominent actions
          secondary:
            "bg-secondary text-secondary-foreground border border-transparent hover:border-secondary-foreground/50",
          // Strong: High-conversion CTAs with dark purple
          strong:
            "bg-action-strong text-text-on-brand border border-transparent hover:bg-brand-purple shadow-glow hover:shadow-glow-lg font-bold",
          // Ghost: Minimal style for subtle actions
          ghost:
            "border border-transparent hover:border-foreground/30 hover:bg-surface-subtle",
          // Link: Text-only button style
          link: "text-text-brand underline-offset-4 hover:underline border-0",
        },
      size: {
        // Mobile-first: min-h-touch ensures 44px touch targets on mobile
        default: "h-10 min-h-touch px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 min-h-[36px] md:min-h-touch rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 min-h-touch px-6 has-[>svg]:px-4",
        xl: "h-12 min-h-touch-lg rounded-lg px-8 text-base has-[>svg]:px-6",
        icon: "size-10 min-w-touch min-h-touch",
        "icon-sm": "size-9 min-w-[36px] min-h-[36px] md:min-w-touch md:min-h-touch",
        "icon-lg": "size-11 min-w-touch min-h-touch",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
