'use client'

import { useEffect, useState } from 'react'

export function AccessibilityProviderWrapper() {
  const [AccessibilityProvider, setAccessibilityProvider] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    // Só carregar em desenvolvimento e no cliente
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return
    }

    // Usar uma função assíncrona para importar dinamicamente
    const loadProvider = async () => {
      try {
        // Usar uma string dinâmica para evitar análise estática do webpack
        const modulePath = './accessibility-provider'
        const module = await import(modulePath)
        if (module?.AccessibilityProvider) {
          setAccessibilityProvider(() => module.AccessibilityProvider)
        }
      } catch (error) {
        // Silenciosamente falhar se não conseguir carregar
        // Isso pode acontecer se o pacote não estiver instalado ou em produção
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to load accessibility provider:', error)
        }
      }
    }

    loadProvider()
  }, [])

  // Não renderizar nada se não estiver em desenvolvimento ou se o provider não foi carregado
  if (process.env.NODE_ENV !== 'development' || !AccessibilityProvider) {
    return null
  }

  return <AccessibilityProvider />
}

