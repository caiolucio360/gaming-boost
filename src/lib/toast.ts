/**
 * Utilitários para exibir notificações toast
 * Usa Sonner para notificações modernas e não intrusivas
 *
 * Styling uses Design System tokens (see docs/design_system.md)
 */

import { toast } from 'sonner'

// Toast styling using design system semantic classes
const toastStyles = {
  success: 'bg-status-success/10 border-status-success/50 text-status-success',
  error: 'bg-status-error/10 border-status-error/50 text-status-error',
  warning: 'bg-status-warning/10 border-status-warning/50 text-status-warning',
  info: 'bg-action-primary/10 border-action-primary/50 text-text-brand',
  loading: 'bg-action-primary/10 border-action-primary/50 text-text-brand',
}

/**
 * Exibe uma notificação de sucesso
 */
export function showSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 4000,
    className: toastStyles.success,
  })
}

/**
 * Exibe uma notificação de erro
 */
export function showError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 5000,
    className: toastStyles.error,
  })
}

/**
 * Exibe uma notificação de informação
 */
export function showInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 4000,
    className: toastStyles.info,
  })
}

/**
 * Exibe uma notificação de aviso
 */
export function showWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 4000,
    className: toastStyles.warning,
  })
}

/**
 * Exibe uma notificação de loading
 */
export function showLoading(message: string) {
  return toast.loading(message, {
    className: toastStyles.loading,
  })
}

/**
 * Atualiza uma notificação de loading para sucesso
 */
export function updateToSuccess(toastId: string | number, message: string, description?: string) {
  toast.success(message, {
    id: toastId,
    description,
    duration: 4000,
    className: toastStyles.success,
  })
}

/**
 * Atualiza uma notificação de loading para erro
 */
export function updateToError(toastId: string | number, message: string, description?: string) {
  toast.error(message, {
    id: toastId,
    description,
    duration: 5000,
    className: toastStyles.error,
  })
}

/**
 * Trata erros de API e exibe notificação apropriada
 */
export function handleApiError(error: unknown, defaultMessage = 'Erro ao processar solicitação') {
  if (error instanceof Error) {
    showError(defaultMessage, error.message)
  } else if (typeof error === 'string') {
    showError(defaultMessage, error)
  } else {
    showError(defaultMessage, 'Ocorreu um erro inesperado')
  }
}

/**
 * Trata respostas de API e exibe notificação de sucesso ou erro
 */
export async function handleApiResponse<T>(
  response: Response,
  successMessage: string,
  errorMessage?: string
): Promise<T | null> {
  try {
    const data = await response.json()
    
    if (response.ok) {
      if (successMessage) {
        showSuccess(successMessage)
      }
      return data as T
    } else {
      const message = data.message || errorMessage || 'Erro ao processar solicitação'
      showError('Erro', message)
      return null
    }
  } catch (error) {
    handleApiError(error, errorMessage || 'Erro ao processar resposta')
    return null
  }
}

