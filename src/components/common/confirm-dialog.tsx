'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  variant?: 'default' | 'destructive' | 'success'
  children?: ReactNode
}

/**
 * Componente reutilizável para diálogos de confirmação
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  variant = 'default',
  children,
}: ConfirmDialogProps) {
  const confirmButtonClass =
    variant === 'destructive'
      ? 'bg-red-500 hover:bg-red-600 text-white font-rajdhani'
      : variant === 'success'
      ? 'bg-green-500 hover:bg-green-400 text-white font-rajdhani'
      : 'bg-purple-500 hover:bg-purple-400 text-white font-rajdhani'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent className="bg-black/90 border-purple-500/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-purple-500/50 text-white hover:bg-purple-500/10 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={confirmButtonClass}
            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

