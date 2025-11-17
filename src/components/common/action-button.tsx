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
    primary: 'bg-purple-500 hover:bg-purple-400 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-400 text-white',
    outline: 'border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200',
  }

  return (
    <Button
      className={cn(
        'font-rajdhani',
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

