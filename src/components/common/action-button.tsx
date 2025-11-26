'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { VariantProps } from 'class-variance-authority'
import { ComponentProps } from 'react'

type ButtonProps = ComponentProps<typeof Button>

interface ActionButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'danger' | 'success' | 'outline'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
}

/**
 * Componente de botão com estilos padronizados
 */
export function ActionButton({
  variant = 'primary',
  icon: Icon,
  iconPosition = 'left',
  className,
  children,
  ...props
}: ActionButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg border border-transparent hover:border-white/50',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg border border-transparent hover:border-white/50',
    success: 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg border border-transparent hover:border-white/50',
    outline: 'border-2 border-purple-500/50 text-purple-300 hover:border-purple-400',
  }

  return (
    <Button
      className={cn(
        'font-rajdhani transition-colors duration-200',
        variantClasses[variant],
        className
      )}
      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="mr-2 h-4 w-4" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="ml-2 h-4 w-4" />}
    </Button>
  )
}

