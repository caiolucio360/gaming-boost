'use client'

import { Toaster } from '@/components/ui/sonner'

/**
 * Provider de notificações toast
 * Deve ser adicionado no layout principal da aplicação
 */
export function ToastProvider() {
  return (
    <>
      {/* Live region para anunciar notificações para leitores de tela */}
      <div
        id="toast-announcements"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <Toaster
        position="bottom-right"
        closeButton
        gap={12}
        visibleToasts={4}
        expand
        duration={4000}
      />
    </>
  )
}
