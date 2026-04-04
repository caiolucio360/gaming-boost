import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-r from-white/5 via-brand-purple/15 to-white/5 bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

// Specialized skeleton for text lines
function SkeletonText({
  lines = 1,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

// Skeleton for avatar/profile images
function SkeletonAvatar({
  size = "md",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  }

  return (
    <Skeleton
      className={cn("rounded-full", sizeClasses[size], className)}
      {...props}
    />
  )
}

// Skeleton for buttons
function SkeletonButton({
  size = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "default" | "lg"
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    default: "h-10 w-24",
    lg: "h-12 w-32",
  }

  return (
    <Skeleton
      className={cn("rounded-lg", sizeClasses[size], className)}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton }
