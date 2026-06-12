import * as React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Card with the brand purple hover-glow overlay — the gradient surface +
 * `group` glow `<div>` that was duplicated across stat cards, empty states and
 * order cards. Inner content should keep `relative z-10` so it sits above the
 * glow layer.
 */
export function GlowCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden',
        'border-brand-purple/50 hover:border-brand-purple-light/80 transition-colors duration-200',
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/5 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none"
        style={{ willChange: 'opacity' }}
      />
      {children}
    </Card>
  )
}
