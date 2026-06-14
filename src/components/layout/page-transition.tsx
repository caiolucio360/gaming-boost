'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Suave transição de entrada a cada troca de rota. A `key={pathname}` faz o
 * conteúdo remontar e re-animar (fade + leve slide) em cada navegação — inclusive
 * pela sidebar. Muda só em navegação real (pathname), não em mudança de query.
 * Respeita `prefers-reduced-motion` (sem animação). Anima só opacity/transform.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      key={pathname}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
