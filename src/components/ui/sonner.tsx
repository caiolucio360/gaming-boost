"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
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
          toast:
            "w-full flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl font-rajdhani",
          title: "font-semibold text-[15px] text-white",
          description: "text-sm text-gray-400 mt-0.5",
          actionButton:
            "bg-brand-purple hover:bg-brand-purple-light text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
          cancelButton:
            "bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
          closeButton:
            "absolute top-2 right-2 p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors",
          success: "bg-green-950/80 border-green-500/30",
          error: "bg-red-950/80 border-red-500/30",
          warning: "bg-yellow-950/80 border-yellow-500/30",
          info: "bg-blue-950/80 border-blue-500/30",
          loading: "bg-brand-black-light/90 border-brand-purple/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
