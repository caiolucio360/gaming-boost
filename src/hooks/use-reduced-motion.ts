'use client'

import { useEffect, useState } from 'react'

/**
 * Hook para detectar e gerenciar preferência de reduced motion
 * 
 * Verifica a preferência do sistema e permite override manual
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [manualOverride, setManualOverride] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar se está no cliente
    if (typeof window === 'undefined') return

    // Verificar preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (manualOverride === null) {
        setPrefersReducedMotion(e.matches)
        // Aplicar classe no body imediatamente
        if (e.matches) {
          document.body.classList.add('reduce-motion')
        } else {
          document.body.classList.remove('reduce-motion')
        }
      }
    }

    // Verificar preferência inicial
    let initialPreference = mediaQuery.matches

    // Verificar preferência salva no localStorage
    try {
      const savedPreference = localStorage.getItem('reduce-motion')
      if (savedPreference !== null) {
        const shouldReduce = savedPreference === 'true'
        setManualOverride(shouldReduce)
        initialPreference = shouldReduce
      }
    } catch (error) {
      // localStorage pode não estar disponível
      console.warn('localStorage não disponível:', error)
    }

    // Aplicar preferência inicial
    setPrefersReducedMotion(initialPreference)
    
    // Aplicar classe no body imediatamente
    if (initialPreference) {
      document.body.classList.add('reduce-motion')
    } else {
      document.body.classList.remove('reduce-motion')
    }

    // Escutar mudanças
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [manualOverride])

  const setReducedMotion = (reduce: boolean) => {
    setManualOverride(reduce)
    setPrefersReducedMotion(reduce)
    
    // Aplicar classe imediatamente no body
    if (typeof window !== 'undefined') {
      if (reduce) {
        document.body.classList.add('reduce-motion')
      } else {
        document.body.classList.remove('reduce-motion')
      }
      
      // Salvar no localStorage
      try {
        localStorage.setItem('reduce-motion', reduce.toString())
      } catch (error) {
        console.warn('Erro ao salvar preferência no localStorage:', error)
      }
    }
  }

  return {
    prefersReducedMotion,
    setReducedMotion,
    isManualOverride: manualOverride !== null,
  }
}

