import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-purple-500/10 via-purple-500/20 to-purple-500/10 bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
