'use client'

import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { Button } from '@/components/ui/button'
import { Move, Ban } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useState, useEffect } from 'react'

/**
 * Toggle para desabilitar/habilitar animações
 * Permite que usuários controlem animações independente da preferência do sistema
 */
export function MotionToggle() {
  const [mounted, setMounted] = useState(false)
  const { prefersReducedMotion, setReducedMotion } = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMotion = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setReducedMotion(!prefersReducedMotion)
  }

  // Evitar problemas de hidratação
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:text-purple-300 hover:bg-purple-500/10 transition-colors duration-300"
        aria-label="Toggle de animações"
        disabled
      >
        <Move className="h-5 w-5" aria-hidden="true" />
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleMotion(e)
            }}
            aria-label={prefersReducedMotion ? 'Habilitar animações' : 'Desabilitar animações'}
            className="text-white hover:text-purple-300 hover:bg-purple-500/10 transition-colors duration-300"
            type="button"
          >
            {prefersReducedMotion ? (
              <Ban className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Move className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
          <p>
            {prefersReducedMotion 
              ? 'Clique para habilitar animações' 
              : 'Clique para desabilitar animações'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

