'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

interface LoadingSwapProps {
  /** When true shows the skeleton; when false crossfades to the content. */
  loading: boolean
  /** Skeleton/placeholder rendered while loading. */
  skeleton: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Transição suave de skeleton → conteúdo. Faz o skeleton sair em fade e o conteúdo
 * entrar com fade + leve slide, em vez do corte seco do `{loading ? skel : content}`.
 * `mode="wait"` garante que o skeleton termine de sair antes do conteúdo entrar.
 * Respeita `prefers-reduced-motion` (troca instantânea).
 */
export function LoadingSwap({ loading, skeleton, children, className }: LoadingSwapProps) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      {loading ? (
        <motion.div
          key="skeleton"
          initial={false}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={className}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
