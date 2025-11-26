'use client'

import { useEffect, useRef } from 'react'

/**
 * Live Region para anunciar mudanças dinâmicas para leitores de tela
 * 
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 */
interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
  id?: string
}

export function LiveRegion({ message, priority = 'polite', id = 'live-region' }: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message && regionRef.current) {
      // Limpar mensagem anterior e adicionar nova para garantir que seja anunciada
      regionRef.current.textContent = ''
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message
        }
      }, 100)
    }
  }, [message])

  return (
    <div
      ref={regionRef}
      id={id}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  )
}

/**
 * Hook para usar live regions
 */
export function useLiveRegion() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Verificar se está no cliente
    if (typeof window === 'undefined') return

    const region = document.getElementById('live-region')
    if (region) {
      region.textContent = ''
      setTimeout(() => {
        if (region) {
          region.textContent = message
        }
      }, 100)
    }
  }

  return { announce }
}

