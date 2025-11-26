'use client'

import dynamic from 'next/dynamic'

// Importar dinamicamente apenas em desenvolvimento e no cliente
const AccessibilityProvider = dynamic(
  () => import('./accessibility-provider').then((mod) => ({ default: mod.AccessibilityProvider })),
  { 
    ssr: false,
    loading: () => null,
  }
)

export function AccessibilityProviderWrapper() {
  // Só renderizar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return <AccessibilityProvider />
}

