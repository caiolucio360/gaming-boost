'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullScreen?: boolean
  text?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

/**
 * Componente de spinner de loading reutilizável
 * 
 * @example
 * <LoadingSpinner size="md" fullScreen />
 * <LoadingSpinner size="sm" text="Carregando..." />
 */
export function LoadingSpinner({ 
  size = 'md', 
  className,
  fullScreen = true,
  text,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)} role="status" aria-label={text || "Carregando"}>
      <div className="relative">
        <Loader2 className={cn(sizeClasses[size], 'animate-spin text-brand-purple')} aria-hidden="true" />
        <div className={cn('absolute inset-0 rounded-full border-2 border-brand-purple/20 animate-pulse', sizeClasses[size])} aria-hidden="true" />
      </div>
      {text ? (
        <span className="text-sm text-brand-gray-400 font-rajdhani animate-pulse" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          {text}
        </span>
      ) : (
        <span className="sr-only">Carregando...</span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="relative">
          {spinner}
          {/* Efeito de brilho pulsante */}
          <div className="absolute inset-0 bg-brand-purple/20 rounded-full blur-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return spinner
}

