/**
 * API Error Response Utilities
 * Provides consistent, user-friendly error messages across all API endpoints
 */

import { NextResponse } from 'next/server'

/**
 * Creates a standardized error response with helpful messages
 */
export function createApiErrorResponse(
  error: unknown,
  defaultMessage: string,
  endpoint: string
): NextResponse {
  console.error(`Error in ${endpoint}:`, error)

  // Check for specific database errors
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // Connection errors (503 Service Unavailable)
    if (errorMessage.includes('connect') || errorMessage.includes('timeout') || errorMessage.includes('econnrefused')) {
      return NextResponse.json(
        {
          message: 'Erro de conexão temporário. Por favor, tente novamente em instantes.',
          error: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 503 }
      )
    }

    // Unique constraint violations (400 Bad Request)
    if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
      return NextResponse.json(
        {
          message: 'Este registro já existe no sistema. Verifique os dados e tente novamente.',
          error: 'DUPLICATE_ENTRY'
        },
        { status: 400 }
      )
    }

    // Foreign key violations (400 Bad Request)
    if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key constraint')) {
      return NextResponse.json(
        {
          message: 'Registro relacionado não encontrado. Verifique os dados e tente novamente.',
          error: 'FOREIGN_KEY_VIOLATION'
        },
        { status: 400 }
      )
    }

    // Not found errors (404 Not Found)
    if (errorMessage.includes('not found') || errorMessage.includes('não encontrado')) {
      return NextResponse.json(
        {
          message: error.message,
          error: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Validation errors (400 Bad Request)
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return NextResponse.json(
        {
          message: error.message,
          error: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }
  }

  // Default 500 Internal Server Error
  return NextResponse.json(
    {
      message: defaultMessage,
      error: 'INTERNAL_SERVER_ERROR'
    },
    { status: 500 }
  )
}

/**
 * Common error messages for different operations
 */
export const ErrorMessages = {
  // Authentication
  AUTH_LOGIN_FAILED: 'Ocorreu um erro inesperado ao processar seu login. Por favor, tente novamente.',
  AUTH_REGISTER_FAILED: 'Não foi possível criar sua conta no momento. Por favor, tente novamente.',
  AUTH_FORGOT_PASSWORD_FAILED: 'Não foi possível processar sua solicitação de recuperação de senha. Tente novamente mais tarde.',
  AUTH_RESET_PASSWORD_FAILED: 'Não foi possível redefinir sua senha no momento. Por favor, solicite um novo link de recuperação.',

  // Orders
  ORDER_CREATE_FAILED: 'Não foi possível criar seu pedido. Por favor, tente novamente ou entre em contato com o suporte.',
  ORDER_UPDATE_FAILED: 'Não foi possível atualizar o pedido. Por favor, tente novamente.',
  ORDER_CANCEL_FAILED: 'Não foi possível cancelar o pedido. Por favor, tente novamente ou entre em contato com o suporte.',
  ORDER_FETCH_FAILED: 'Não foi possível carregar seus pedidos. Por favor, recarregue a página.',

  // Payments
  PAYMENT_PIX_FAILED: 'Não foi possível processar seu pagamento PIX. Por favor, tente novamente ou entre em contato com o suporte.',
  PAYMENT_REFUND_FAILED: 'Não foi possível processar o reembolso automaticamente. Nossa equipe entrará em contato.',

  // Booster
  BOOSTER_ACCEPT_ORDER_FAILED: 'Não foi possível aceitar o pedido. Por favor, tente novamente.',
  BOOSTER_UPDATE_ORDER_FAILED: 'Não foi possível atualizar o status do pedido. Por favor, tente novamente.',
  BOOSTER_APPLY_FAILED: 'Não foi possível processar sua candidatura. Por favor, tente novamente mais tarde.',

  // Admin
  ADMIN_STATS_FAILED: 'Não foi possível carregar as estatísticas. Por favor, recarregue a página.',
  ADMIN_USER_UPDATE_FAILED: 'Não foi possível atualizar o usuário. Por favor, tente novamente.',

  // Pricing
  PRICING_CALCULATE_FAILED: 'Não foi possível calcular o preço. Por favor, tente novamente.',

  // Generic
  GENERIC_ERROR: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  DATABASE_ERROR: 'Erro ao acessar o banco de dados. Por favor, tente novamente em instantes.',
}
