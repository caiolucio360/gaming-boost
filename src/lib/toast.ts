/**
 * Utilitários para exibir notificações toast
 * Usa Sonner para notificações modernas e não intrusivas
 */

import { toast } from 'sonner'

/**
 * Exibe uma notificação de sucesso
 */
export function showSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 4000,
  })
}

/**
 * Exibe uma notificação de erro
 */
export function showError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 5000,
  })
}

/**
 * Exibe uma notificação de informação
 */
export function showInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 4000,
  })
}

/**
 * Exibe uma notificação de aviso
 */
export function showWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 4000,
  })
}

/**
 * Exibe uma notificação de loading
 */
export function showLoading(message: string) {
  return toast.loading(message)
}

/**
 * Atualiza uma notificação de loading para sucesso
 */
export function updateToSuccess(toastId: string | number, message: string, description?: string) {
  toast.success(message, {
    id: toastId,
    description,
    duration: 4000,
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
