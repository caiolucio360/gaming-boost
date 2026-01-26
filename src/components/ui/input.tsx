import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles with mobile touch target (min-h-touch = 44px)
        "flex h-10 min-h-touch w-full min-w-0 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
        // Background and text
        "bg-surface-card text-text-primary placeholder:text-text-muted",
        // Border
        "border-border-ds-default",
        // Focus state - uses design system brand color
        "focus-visible:border-border-ds-brand focus-visible:ring-border-ds-brand/30 focus-visible:ring-1",
        // Selection
        "selection:bg-primary selection:text-primary-foreground",
        // File input
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Cursor
        "cursor-text disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Validation states
        "aria-invalid:ring-status-error/20 dark:aria-invalid:ring-status-error/40 aria-invalid:border-status-error",
        className
      )}
      {...props}
    />
  )
}

export { Input }
