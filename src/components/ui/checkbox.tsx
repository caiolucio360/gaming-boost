"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Touch target wrapper - visual is 18px but touch area extends with relative positioning
        "peer relative",
        // Visual checkbox styling
        "border-white/10 dark:bg-input/30",
        "data-[state=checked]:bg-brand-purple data-[state=checked]:text-white data-[state=checked]:border-brand-purple",
        "focus-visible:border-brand-purple focus-visible:ring-brand-purple/30",
        "aria-invalid:ring-brand-red/20 dark:aria-invalid:ring-brand-red/40 aria-invalid:border-brand-red",
        // Size - visual is 18px (size-[18px]) but touch target is larger via pseudo-element
        "size-[18px] shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-1",
        // Touch target expansion - creates 44x44 touch area centered on checkbox
        "before:absolute before:-inset-3 before:content-['']",
        // Cursor
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
