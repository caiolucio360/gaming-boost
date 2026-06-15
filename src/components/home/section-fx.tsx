'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Decorative, animated background layer for home sections — a brand-purple
 * grid/dot texture plus slow floating glow orbs. Purely atmospheric
 * (`aria-hidden`, no pointer events) and motion-free under
 * `prefers-reduced-motion`. Drop as the first child of a `relative
 * overflow-hidden` section and keep the real content in a `relative z-10` wrapper.
 */
interface SectionFxProps {
  pattern?: 'grid' | 'dots' | 'none'
  /** Show the floating glow orbs. */
  orbs?: boolean
  className?: string
}

export function SectionFx({ pattern = 'grid', orbs = true, className }: SectionFxProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Brand-purple color wash — lifts the section off pure black */}
      <div className="fx-bloom absolute inset-0" />

      {pattern !== 'none' && (
        <div className={cn('absolute inset-0', pattern === 'grid' ? 'fx-grid' : 'fx-dots')} />
      )}

      {orbs && (
        <>
          <motion.div
            className="absolute -left-24 top-[12%] h-72 w-72 rounded-full bg-brand-purple/25 blur-3xl"
            animate={reduceMotion ? undefined : { y: [0, -26, 0], opacity: [0.6, 0.95, 0.6] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-brand-purple-light/20 blur-3xl"
            animate={reduceMotion ? undefined : { y: [0, 30, 0], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.div
            className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-purple-dark/30 blur-3xl"
            animate={reduceMotion ? undefined : { x: ['-50%', '-35%', '-50%'], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </>
      )}
    </div>
  )
}

/**
 * Subtle vertical parallax: shifts its children as the element scrolls through
 * the viewport. No motion under `prefers-reduced-motion`. Keep `distance` small
 * (16–60px) so it reads as depth, not drift.
 */
export function Parallax({
  children,
  distance = 40,
  className,
}: {
  children: ReactNode
  distance?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance])

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduceMotion ? undefined : { y }}>{children}</motion.div>
    </div>
  )
}
