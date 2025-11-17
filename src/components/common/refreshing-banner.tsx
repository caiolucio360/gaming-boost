'use client'

import { Loader2 } from 'lucide-react'

interface RefreshingBannerProps {
  message?: string
}

/**
 * Banner de atualização que aparece durante refresh
 */
export function RefreshingBanner({ message = 'Atualizando...' }: RefreshingBannerProps) {
  return (
    <div className="mb-4 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
      <p className="text-sm text-purple-300 font-rajdhani text-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        <Loader2 className="h-4 w-4 inline-block mr-2 animate-spin" />
        {message}
      </p>
    </div>
  )
}

