'use client'

import { useEffect, useState } from 'react'

export function AccessibilityProviderWrapper() {
  const [AccessibilityProvider, setAccessibilityProvider] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    // Só carregar em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    // Importar dinamicamente apenas no cliente
    import('./accessibility-provider')
      .then((mod) => {
        setAccessibilityProvider(() => mod.AccessibilityProvider)
      })
      .catch(() => {
        // Silenciosamente falhar se não conseguir carregar
      })
  }, [])

  if (!AccessibilityProvider) {
    return null
  }

  return <AccessibilityProvider />
}

