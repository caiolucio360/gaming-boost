'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Single, page-wide decorative background for the home. Rendered once behind all
 * sections so the colour flows continuously and large glow orbs straddle the
 * section boundaries — the colour "bleeds" from one section into the next
 * instead of each section being its own tile. Purely atmospheric (`aria-hidden`,
 * no pointer events); orbs hold still under `prefers-reduced-motion`.
 */
const ORBS = [
  { className: '-left-32 top-[8%] h-[28rem] w-[28rem] bg-brand-purple/30', y: -28, dur: 12, delay: 0 },
  { className: '-right-32 top-[30%] h-[34rem] w-[34rem] bg-brand-purple-light/22', y: 30, dur: 15, delay: 1 },
  { className: 'left-1/4 top-[55%] h-[30rem] w-[30rem] bg-brand-purple-dark/30', y: -24, dur: 14, delay: 2 },
  { className: '-right-24 top-[80%] h-[28rem] w-[28rem] bg-brand-purple/24', y: 26, dur: 16, delay: 1.5 },
] as const

export function HomeBackground() {
  const reduceMotion = useReducedMotion()

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-background">
      {/* Continuous purple wash flowing top → bottom */}
      <div className="absolute inset-0 home-bg-gradient" />
      {/* Continuous grid texture */}
      <div className="absolute inset-0 fx-grid" />

      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          animate={reduceMotion ? undefined : { y: [0, orb.y, 0], opacity: [0.45, 0.8, 0.45] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
        />
      ))}
    </div>
  )
}
