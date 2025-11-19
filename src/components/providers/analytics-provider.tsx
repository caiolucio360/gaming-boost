'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy load analytics apenas no cliente e após interação
const Analytics = dynamic(() => import('@vercel/analytics/react').then(mod => ({ default: mod.Analytics })), {
  ssr: false,
})

const SpeedInsights = dynamic(() => import('@vercel/speed-insights/react').then(mod => ({ default: mod.SpeedInsights })), {
  ssr: false,
})

export function AnalyticsProvider() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    // Carregar analytics apenas após interação do usuário ou após 2 segundos
    const timer = setTimeout(() => setShouldLoad(true), 2000)
    
    const handleInteraction = () => {
      setShouldLoad(true)
      clearTimeout(timer)
    }

    // Eventos de interação do usuário
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { once: true })
    })

    return () => {
      clearTimeout(timer)
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction)
      })
    }
  }, [])

  if (!shouldLoad) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}

