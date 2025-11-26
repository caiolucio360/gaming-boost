'use client'

import { useEffect } from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

/**
 * Provider para gerenciar preferências de animação
 * Inicializa o hook e aplica a classe no body quando necessário
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const { prefersReducedMotion } = useReducedMotion()

  useEffect(() => {
    // Verificar se está no cliente
    if (typeof window === 'undefined') return

    // Aplicar classe no body baseado na preferência
    if (prefersReducedMotion) {
      document.body.classList.add('reduce-motion')
    } else {
      document.body.classList.remove('reduce-motion')
    }
  }, [prefersReducedMotion])

  return <>{children}</>
}

