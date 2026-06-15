'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

/**
 * Scroll-reveal primitives for the marketing home page.
 *
 * `Reveal` fades + slides a single block into view once. `RevealStagger` +
 * `RevealItem` orchestrate a list whose children cascade in. All of them animate
 * only opacity/transform and fully respect `prefers-reduced-motion` (no motion,
 * content stays visible) — matching the convention in `page-transition.tsx`.
 */

const EASE = [0.4, 0, 0.2, 1] as const

interface RevealProps {
  children: ReactNode
  className?: string
  /** Seconds to wait before this block animates in. */
  delay?: number
  /** Slide distance in px (default 24). */
  y?: number
}

export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

interface RevealStaggerProps {
  children: ReactNode
  className?: string
}

/** Wrap a list; each `RevealItem` child animates in sequence as it scrolls into view. */
export function RevealStagger({ children, className }: RevealStaggerProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

interface RevealItemProps {
  children: ReactNode
  className?: string
}

/** A single staggered child — must sit inside a `RevealStagger`. */
export function RevealItem({ children, className }: RevealItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}
