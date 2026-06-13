"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  const theme: ToasterProps["theme"] = resolvedTheme === "light" ? "light" : "dark"

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-5 text-green-400" />,
        info: <Info className="size-5 text-blue-400" />,
        warning: <TriangleAlert className="size-5 text-yellow-400" />,
        error: <OctagonX className="size-5 text-red-400" />,
        loading: <LoaderCircle className="size-5 text-brand-purple animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          // Base: layout + border width only. Each type sets its own background and
          // border color below so the surface follows the active light/dark theme.
          toast:
            "w-full flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl font-rajdhani",
          title: "font-semibold text-[15px] text-foreground",
          description: "text-sm text-muted-foreground mt-0.5",
          actionButton:
            "bg-brand-purple hover:bg-brand-purple-light text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
          cancelButton:
            "bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
          closeButton:
            "absolute top-2 right-2 p-1 rounded-md bg-popover text-muted-foreground hover:text-foreground hover:bg-muted border-border transition-colors",
          default: "bg-popover border-border",
          success: "bg-green-500/15 border-green-500/40",
          error: "bg-red-500/15 border-red-500/40",
          warning: "bg-yellow-500/15 border-yellow-500/40",
          info: "bg-blue-500/15 border-blue-500/40",
          loading: "bg-popover border-brand-purple/40",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
