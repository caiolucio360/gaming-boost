'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ReactNode, ComponentProps } from 'react'

type ButtonProps = ComponentProps<typeof Button>

interface ButtonLoadingProps extends Omit<ButtonProps, 'children'> {
  loading?: boolean
  loadingText?: string
  children?: ReactNode
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

