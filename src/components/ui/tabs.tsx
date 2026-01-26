"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Mobile-first: min-h-touch ensures 44px touch targets
        "bg-brand-black-light text-brand-gray-500 inline-flex h-11 min-h-touch w-fit items-center justify-center rounded-lg p-1",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles with touch-friendly height
        "inline-flex h-9 min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all",
        // Text and border
        "text-brand-gray-300 border border-transparent",
        // Active state - uses design system tokens
        "data-[state=active]:bg-brand-black data-[state=active]:text-white data-[state=active]:border-brand-purple/30 data-[state=active]:shadow-sm",
        // Focus state
        "focus-visible:border-brand-purple focus-visible:ring-brand-purple/30 focus-visible:ring-[3px] focus-visible:outline-1",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // SVG handling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
