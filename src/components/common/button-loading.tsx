'use client'

import { Loader2 } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ButtonLoadingProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

/**
 * Botão com estado de loading integrado
 * 
 * @example
 * <ButtonLoading loading={isSubmitting} loadingText="Salvando...">
 *   Salvar
 * </ButtonLoading>
 */
export function ButtonLoading({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: ButtonLoadingProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {loading ? loadingText || children : children}
    </Button>
  )
}

