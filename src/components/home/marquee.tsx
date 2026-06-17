'use client'

import { Children, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Seamless horizontal auto-scroll marquee. Renders the children twice so the
 * track loops without a seam; pauses on hover. Under `prefers-reduced-motion` it
 * degrades to a normal horizontal scroll area (no auto motion), staying usable.
 * Edges fade out via a mask so cards slide in/out softly.
 */
export function Marquee({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  const items = Children.toArray(children)

  if (reduceMotion) {
    return (
      <div className={cn('flex gap-6 overflow-x-auto pb-2', className)}>
        {items.map((child, i) => (
          <div key={i} className="shrink-0">
            {child}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('marquee-pause fade-x-mask relative overflow-hidden', className)}
    >
      <div className="animate-marquee flex w-max gap-6">
        {[...items, ...items].map((child, i) => (
          <div key={i} className="shrink-0" aria-hidden={i >= items.length ? 'true' : undefined}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
