/**
 * Withdrawal Constants
 *
 * Shared constants for the withdrawal logic used by both
 * booster/withdraw and admin/withdraw routes.
 */

/** Minimum withdrawal amount in centavos (R$ 3,50 = 350 centavos) */
export const MINIMUM_WITHDRAWAL_AMOUNT_CENTS = 350

/** Valid PIX key types accepted by the payment provider */
export const VALID_PIX_KEY_TYPES = ['CPF', 'CNPJ', 'PHONE', 'EMAIL', 'EVP'] as const

export type PixKeyType = typeof VALID_PIX_KEY_TYPES[number]
