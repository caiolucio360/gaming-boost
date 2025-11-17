'use client'

import { Toaster } from '@/components/ui/sonner'

/**
 * Provider de notificações toast
 * Deve ser adicionado no layout principal da aplicação
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'bg-black/90 backdrop-blur-md border border-purple-500/50 font-rajdhani',
          title: 'font-rajdhani font-bold text-white',
          description: 'font-rajdhani text-sm text-gray-300',
          actionButton: 'bg-purple-500 hover:bg-purple-400 font-rajdhani',
          cancelButton: 'bg-gray-500 hover:bg-gray-400 font-rajdhani',
          success: 'bg-green-500/10 border-green-500/50',
          error: 'bg-red-500/10 border-red-500/50',
          warning: 'bg-yellow-500/10 border-yellow-500/50',
          info: 'bg-blue-500/10 border-blue-500/50',
        },
      }}
    />
  )
}

