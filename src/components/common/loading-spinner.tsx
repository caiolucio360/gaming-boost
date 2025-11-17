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
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-purple-500')} />
      {text && (
        <span className="text-sm text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          {text}
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        {spinner}
      </div>
    )
  }

  return spinner
}

