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
import { ButtonLoading } from '@/components/common/button-loading'
import { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive' | 'success'
  loading?: boolean
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
  loading = false,
  children,
}: ConfirmDialogProps) {
  const confirmButtonClass =
    variant === 'destructive'
      ? 'bg-red-500 text-white font-rajdhani border border-transparent hover:border-white/50'
      : variant === 'success'
      ? 'bg-green-500 text-white font-rajdhani border border-transparent hover:border-white/50'
      : 'bg-brand-purple text-white font-rajdhani border border-transparent hover:border-white/50'

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent className="bg-black/90 border-brand-purple/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-brand-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="border-brand-purple/50 text-white hover:border-white/50 font-rajdhani"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <ButtonLoading
            onClick={handleConfirm}
            loading={loading}
            loadingText="Processando..."
            className={confirmButtonClass}
            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
          >
            {confirmLabel}
          </ButtonLoading>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

