/**
 * Centralized error codes, messages, and HTTP status mappings.
 *
 * ALL error codes and user-facing error messages in the project MUST be
 * imported from this file. No inline string literals for codes or messages.
 */

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCodes = {
  // Auth
  USER_NOT_VERIFIED: 'USER_NOT_VERIFIED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  AUTH_ERROR: 'AUTH_ERROR',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_CODE: 'INVALID_CODE',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',

  // Business Logic
  DUPLICATE_ORDER: 'DUPLICATE_ORDER',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  ORDER_ALREADY_ACCEPTED: 'ORDER_ALREADY_ACCEPTED',
  ORDER_NOT_CANCELLABLE: 'ORDER_NOT_CANCELLABLE',
  USER_HAS_ACTIVE_ORDERS: 'USER_HAS_ACTIVE_ORDERS',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  CHAT_ACCESS_DENIED: 'CHAT_ACCESS_DENIED',
  CHAT_DISABLED: 'CHAT_DISABLED',
  PIX_KEY_REQUIRED: 'PIX_KEY_REQUIRED',
  CREDENTIALS_REQUIRED: 'CREDENTIALS_REQUIRED',

  // External Services
  PAYMENT_PROVIDER_ERROR: 'PAYMENT_PROVIDER_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',

  // Infrastructure
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

// ============================================================================
// HTTP Status Map
// ============================================================================

export const ErrorStatusMap: Record<string, number> = {
  // Auth
  [ErrorCodes.USER_NOT_VERIFIED]: 403,
  [ErrorCodes.UNAUTHENTICATED]: 401,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.AUTH_ERROR]: 401,

  // Resources
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.ORDER_NOT_FOUND]: 404,
  [ErrorCodes.PAYMENT_NOT_FOUND]: 404,
  [ErrorCodes.USER_NOT_FOUND]: 404,
  [ErrorCodes.CHAT_NOT_FOUND]: 404,
  [ErrorCodes.SERVICE_NOT_FOUND]: 404,

  // Validation
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_INPUT]: 400,
  [ErrorCodes.INVALID_CODE]: 400,
  [ErrorCodes.INVALID_STATUS_TRANSITION]: 400,

  // Business Logic
  [ErrorCodes.DUPLICATE_ORDER]: 400,
  [ErrorCodes.DUPLICATE_ENTRY]: 400,
  [ErrorCodes.ORDER_ALREADY_ACCEPTED]: 409,
  [ErrorCodes.ORDER_NOT_CANCELLABLE]: 400,
  [ErrorCodes.USER_HAS_ACTIVE_ORDERS]: 400,
  [ErrorCodes.INSUFFICIENT_BALANCE]: 400,
  [ErrorCodes.CHAT_ACCESS_DENIED]: 403,
  [ErrorCodes.CHAT_DISABLED]: 400,
  [ErrorCodes.PIX_KEY_REQUIRED]: 400,
  [ErrorCodes.CREDENTIALS_REQUIRED]: 400,

  // External
  [ErrorCodes.PAYMENT_PROVIDER_ERROR]: 502,
  [ErrorCodes.EMAIL_SERVICE_ERROR]: 502,

  // Infrastructure
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.DATABASE_CONNECTION_ERROR]: 503,
  [ErrorCodes.ENCRYPTION_ERROR]: 500,
  [ErrorCodes.FOREIGN_KEY_VIOLATION]: 400,
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCodes.NETWORK_ERROR]: 503,
  [ErrorCodes.SERVER_ERROR]: 500,
  [ErrorCodes.UNKNOWN_ERROR]: 500,
}

/**
 * Get HTTP status code for a given error code. Defaults to 500.
 */
export function getStatusForError(code: string): number {
  return ErrorStatusMap[code] ?? 500
}

// ============================================================================
// Error Messages (Portuguese — user-facing)
// ============================================================================

export const ErrorMessages = {
  // ---- Auth ----
  AUTH_LOGIN_FAILED: 'Ocorreu um erro inesperado ao processar seu login. Por favor, tente novamente.',
  AUTH_REGISTER_FAILED: 'Não foi possível criar sua conta no momento. Por favor, tente novamente.',
  AUTH_FORGOT_PASSWORD_FAILED: 'Não foi possível processar sua solicitação de recuperação de senha. Tente novamente mais tarde.',
  AUTH_RESET_PASSWORD_FAILED: 'Não foi possível redefinir sua senha no momento. Por favor, solicite um novo link de recuperação.',
  AUTH_CREDENTIALS_INVALID: 'Email ou senha incorretos',
  AUTH_NOT_VERIFIED: 'Conta não verificada. Verifique seu e-mail antes de fazer login.',
  AUTH_UNAUTHENTICATED: 'Não autenticado',
  AUTH_FORBIDDEN: 'Acesso negado. Permissão insuficiente.',
  AUTH_EMAIL_PASSWORD_REQUIRED: 'Email e senha são obrigatórios',
  AUTH_INVALID_EMAIL: 'Email inválido',
  AUTH_PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 6 caracteres',
  AUTH_TOKEN_INVALID_OR_EXPIRED: 'Token inválido ou expirado',
  AUTH_TOKEN_AND_PASSWORD_REQUIRED: 'Token e senha são obrigatórios',
  AUTH_EMAIL_REQUIRED: 'Email é obrigatório',
  AUTH_EMAIL_ALREADY_EXISTS: 'Email já cadastrado',
  AUTH_SESSION_ERROR: 'Erro ao iniciar sessão',
  AUTH_VERIFY_ERROR: 'Erro ao verificar autenticação',

  // ---- Orders ----
  ORDER_NOT_FOUND: 'Pedido não encontrado',
  ORDER_CREATE_FAILED: 'Não foi possível criar seu pedido. Por favor, tente novamente ou entre em contato com o suporte.',
  ORDER_UPDATE_FAILED: 'Não foi possível atualizar o pedido. Por favor, tente novamente.',
  ORDER_CANCEL_FAILED: 'Não foi possível cancelar o pedido. Por favor, tente novamente ou entre em contato com o suporte.',
  ORDER_FETCH_FAILED: 'Não foi possível carregar seus pedidos. Por favor, recarregue a página.',
  ORDER_NOT_PAID: 'Pedido não está pago e disponível para aceitação',
  ORDER_ALREADY_ACCEPTED: 'Pedido já foi atribuído a outro booster',
  ORDER_NOT_IN_PROGRESS: 'Pedido não está em andamento',
  ORDER_NOT_BELONGS_TO_USER: 'Pedido não pertence ao usuário',
  ORDER_NOT_CANCELLABLE: 'Este pedido não pode ser cancelado',
  ORDER_ACCESS_DENIED: 'Acesso negado. Este pedido não foi atribuído a você.',
  ORDER_PIX_KEY_REQUIRED: 'Cadastre sua chave PIX antes de aceitar pedidos.',
  ORDER_CREDENTIALS_REQUIRED: 'Aguardando credenciais Steam do cliente para iniciar o boost.',
  BOOSTER_START_ORDER_FAILED: 'Não foi possível iniciar o pedido. Por favor, tente novamente.',

  // ---- Payments ----
  PAYMENT_NOT_FOUND: 'Pagamento não encontrado',
  PAYMENT_PIX_FAILED: 'Não foi possível processar seu pagamento PIX. Por favor, tente novamente ou entre em contato com o suporte.',
  PAYMENT_REFUND_FAILED: 'Não foi possível processar o reembolso automaticamente. Nossa equipe entrará em contato.',
  PAYMENT_PIX_INFO_REQUIRED: 'Para realizar pagamentos via PIX, informe seu telefone e CPF.',

  // ---- Booster ----
  BOOSTER_ACCEPT_ORDER_FAILED: 'Não foi possível aceitar o pedido. Por favor, tente novamente.',
  BOOSTER_UPDATE_ORDER_FAILED: 'Não foi possível atualizar o status do pedido. Por favor, tente novamente.',
  BOOSTER_APPLY_FAILED: 'Não foi possível processar sua candidatura. Por favor, tente novamente mais tarde.',

  // ---- Users ----
  USER_NOT_FOUND: 'Usuário não encontrado',

  // ---- Admin ----
  ADMIN_STATS_FAILED: 'Não foi possível carregar as estatísticas. Por favor, recarregue a página.',
  ADMIN_USER_UPDATE_FAILED: 'Não foi possível atualizar o usuário. Por favor, tente novamente.',
  ADMIN_INVALID_STATUS_TRANSITION: 'Transição de status inválida. Verifique o status atual do pedido.',
  ADMIN_ORDER_REQUIRES_BOOSTER: 'Não é possível concluir um pedido sem booster atribuído.',

  // ---- Pricing ----
  PRICING_CALCULATE_FAILED: 'Não foi possível calcular o preço. Por favor, tente novamente.',
  PRICING_REQUIRED_FIELDS: 'Campos obrigatórios ausentes: jogo, modo, pontuação atual e desejada',
  PRICING_INVALID_VALUES: 'Valores de pontuação atual ou desejada são inválidos',
  PRICING_INVALID_RANGE: 'A pontuação atual deve ser menor que a pontuação desejada',

  // ---- Rate Limit ----
  RATE_LIMIT_LOGIN: 'Muitas tentativas de login. Tente novamente mais tarde.',
  RATE_LIMIT_REGISTER: 'Muitas tentativas de registro. Tente novamente mais tarde.',
  RATE_LIMIT_PASSWORD_RESET: 'Muitas tentativas. Tente novamente mais tarde.',
  RATE_LIMIT_PASSWORD_RECOVERY: 'Muitas tentativas de recuperação de senha. Tente novamente mais tarde.',
  RATE_LIMIT_GENERIC: 'Muitas tentativas. Aguarde um momento.',

  // ---- Database / Infrastructure ----
  DATABASE_CONNECTION: 'Erro de conexão temporário. Por favor, tente novamente em instantes.',
  DATABASE_DUPLICATE_ENTRY: 'Este registro já existe no sistema. Verifique os dados e tente novamente.',
  DATABASE_FOREIGN_KEY: 'Registro relacionado não encontrado. Verifique os dados e tente novamente.',
  DATABASE_NOT_FOUND: 'Registro não encontrado.',
  DATABASE_VALIDATION: 'Dados inválidos. Verifique os campos e tente novamente.',
  DATABASE_ERROR: 'Erro ao acessar o banco de dados. Por favor, tente novamente em instantes.',

  // ---- Client-side API ----
  CLIENT_NETWORK_TIMEOUT: 'A requisição expirou. Tente novamente.',
  CLIENT_NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  CLIENT_SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
  CLIENT_FORBIDDEN: 'Você não tem permissão para esta ação.',
  CLIENT_VALIDATION: 'Dados inválidos.',
  CLIENT_SERVER_ERROR: 'Erro no servidor. Tente novamente.',
  CLIENT_UNKNOWN: 'Ocorreu um erro inesperado.',
  CLIENT_REQUEST_ERROR: 'Erro na requisição',

  // ---- Generic ----
  GENERIC_ERROR: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  INVALID_DATA: 'Dados inválidos',
} as const
