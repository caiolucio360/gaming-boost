/**
 * Withdrawal Service
 *
 * Centralized business logic shared by the booster and admin withdraw routes.
 * Both flows are ~identical: validate input, atomically re-check balance +
 * pending withdrawals and create a provisional record (TOCTOU-safe), call the
 * external PIX provider, then either finalize or roll back the provisional.
 *
 * The two flows differ only in:
 *  - balance source (boosterCommission vs adminRevenue)
 *  - externalId prefix and default description
 *
 * Pure business logic — never returns NextResponse. Routes map the result
 * union to HTTP via `mapWithdrawalCreateError`.
 */

import { prisma } from '@/lib/db'
import { Withdrawal } from '@/generated/prisma/client'
import { createAsaasPixTransfer } from '@/lib/asaas'
import { HttpStatus } from '@/lib/http-status'
import {
  MINIMUM_WITHDRAWAL_AMOUNT_CENTS,
  VALID_PIX_KEY_TYPES,
  type PixKeyType,
} from '@/lib/withdraw-constants'
import crypto from 'crypto'

// ============================================================================
// Types
// ============================================================================

export type WithdrawalSource = 'BOOSTER' | 'ADMIN'

export interface CreateWithdrawalInput {
  userId: number
  source: WithdrawalSource
  amount: number
  pixKeyType: string
  pixKey: string
  description?: string
}

/** Reasons a withdrawal creation can fail, before the success case. */
export type WithdrawalCreateFailureReason =
  | 'INVALID_AMOUNT'
  | 'MISSING_PIX'
  | 'INVALID_PIX_TYPE'
  | 'INSUFFICIENT'
  | 'PENDING_EXISTS'
  | 'PROVIDER_ERROR'

export type WithdrawalCreateResult =
  | { ok: true; withdrawal: Withdrawal }
  | {
      ok: false
      reason: WithdrawalCreateFailureReason
      message: string
      availableBalance?: number
      providerError?: string
    }

interface WithdrawalStats {
  totalWithdrawals: number
  pendingWithdrawals: number
  completedWithdrawals: number
  totalWithdrawn: number
}

// ============================================================================
// Source-specific configuration
// ============================================================================

const SOURCE_CONFIG = {
  BOOSTER: {
    externalIdPrefix: 'booster',
    defaultDescription: (userId: number) => `Saque de comissões - Booster #${userId}`,
  },
  ADMIN: {
    externalIdPrefix: 'admin',
    defaultDescription: (userId: number) => `Saque de receitas - Admin #${userId}`,
  },
} as const

// ============================================================================
// WithdrawalService
// ============================================================================

export const WithdrawalService = {
  /**
   * Create a withdrawal: validate, atomically reserve via a provisional record,
   * call the PIX provider, then finalize (or roll back on provider failure).
   */
  async create(input: CreateWithdrawalInput): Promise<WithdrawalCreateResult> {
    const { userId, source, amount, pixKeyType, pixKey } = input
    const config = SOURCE_CONFIG[source]
    const description = input.description || config.defaultDescription(userId)

    // ---- Input validation ----
    if (!amount || amount < MINIMUM_WITHDRAWAL_AMOUNT_CENTS) {
      return { ok: false, reason: 'INVALID_AMOUNT', message: 'Valor mínimo para saque é R$ 3,50' }
    }
    if (!pixKeyType || !pixKey) {
      return { ok: false, reason: 'MISSING_PIX', message: 'Tipo de chave PIX e chave são obrigatórios' }
    }
    if (!VALID_PIX_KEY_TYPES.includes(pixKeyType as PixKeyType)) {
      return { ok: false, reason: 'INVALID_PIX_TYPE', message: 'Tipo de chave PIX inválido' }
    }

    const externalId = `withdraw-${config.externalIdPrefix}-${userId}-${crypto.randomUUID()}`
    const now = new Date()

    // ---- Atomic balance check + provisional record (TOCTOU-safe) ----
    let provisional: { id: number }
    try {
      provisional = await prisma.$transaction(async (tx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const available = await getAvailableBalanceCents(tx, source, userId, now)
        if (amount > available) {
          const err = new Error('Saldo insuficiente') as Error & { code: string; availableBalance?: number }
          err.code = 'INSUFFICIENT'
          err.availableBalance = available
          throw err
        }

        const pending = await tx.withdrawal.findFirst({
          where: { userId, status: { in: ['PENDING', 'PROCESSING'] } },
        })
        if (pending) {
          const err = new Error('Você já tem um saque pendente. Aguarde a conclusão.') as Error & { code: string }
          err.code = 'PENDING_EXISTS'
          throw err
        }

        return tx.withdrawal.create({
          data: { userId, externalId, amount, pixKeyType, pixKey, status: 'PENDING', description },
        })
      })
    } catch (err) {
      const e = err as { code?: string; message?: string; availableBalance?: number }
      if (e.code === 'INSUFFICIENT') {
        return { ok: false, reason: 'INSUFFICIENT', message: e.message!, availableBalance: e.availableBalance }
      }
      if (e.code === 'PENDING_EXISTS') {
        return { ok: false, reason: 'PENDING_EXISTS', message: e.message! }
      }
      throw err
    }

    // ---- External PIX transfer (outside the transaction) ----
    try {
      const transfer = await createAsaasPixTransfer({
        amount,
        pixAddressKey: pixKey,
        pixAddressKeyType: (pixKeyType === 'RANDOM' ? 'EVP' : pixKeyType) as PixKeyType,
        description,
      })

      const withdrawal = await prisma.withdrawal.update({
        where: { id: provisional.id },
        data: {
          providerId: transfer.id,
          platformFee: 0,
          receiptUrl: transfer.transactionReceiptUrl || null,
        },
      })

      return { ok: true, withdrawal }
    } catch (error) {
      // Provider failed — roll back the provisional record so future withdrawals aren't blocked.
      await prisma.withdrawal.delete({ where: { id: provisional.id } }).catch(() => {})
      console.error('Erro ao criar saque:', error)
      return {
        ok: false,
        reason: 'PROVIDER_ERROR',
        message: 'Erro ao processar saque',
        providerError: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  },

  /** Booster withdrawals list with stats, available balance, and locked balance breakdown. */
  async getBoosterWithdrawals(userId: number) {
    const now = new Date()
    const [withdrawals, availableAgg, lockedAgg, lockedCommissions] = await Promise.all([
      prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.boosterCommission.aggregate({
        where: {
          boosterId: userId,
          status: 'PAID',
          OR: [{ availableForWithdrawalAt: null }, { availableForWithdrawalAt: { lte: now } }],
        },
        _sum: { amount: true },
      }),
      prisma.boosterCommission.aggregate({
        where: { boosterId: userId, status: 'PAID', availableForWithdrawalAt: { gt: now } },
        _sum: { amount: true },
      }),
      prisma.boosterCommission.findMany({
        where: { boosterId: userId, status: 'PAID', availableForWithdrawalAt: { gt: now } },
        select: { id: true, amount: true, availableForWithdrawalAt: true, orderId: true },
        orderBy: { availableForWithdrawalAt: 'asc' },
      }),
    ])

    return {
      withdrawals,
      stats: computeStats(withdrawals),
      availableBalance: (availableAgg._sum.amount || 0) * 100,
      lockedBalance: (lockedAgg._sum.amount || 0) * 100,
      lockedCommissions,
    }
  },

  /** Admin withdrawals list with stats and available balance. */
  async getAdminWithdrawals(userId: number) {
    const [withdrawals, paidRevenues] = await Promise.all([
      prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.adminRevenue.aggregate({ where: { adminId: userId, status: 'PAID' }, _sum: { amount: true } }),
    ])

    return {
      withdrawals,
      stats: computeStats(withdrawals),
      availableBalance: (paidRevenues._sum.amount || 0) * 100,
    }
  },
}

// ============================================================================
// Helpers
// ============================================================================

/** Available balance in centavos for the given source, computed inside the transaction. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAvailableBalanceCents(tx: any, source: WithdrawalSource, userId: number, now: Date): Promise<number> {
  if (source === 'BOOSTER') {
    const agg = await tx.boosterCommission.aggregate({
      where: {
        boosterId: userId,
        status: 'PAID',
        OR: [{ availableForWithdrawalAt: null }, { availableForWithdrawalAt: { lte: now } }],
      },
      _sum: { amount: true },
    })
    return Math.round((agg._sum.amount || 0) * 100)
  }

  const agg = await tx.adminRevenue.aggregate({
    where: { adminId: userId, status: 'PAID' },
    _sum: { amount: true },
  })
  return Math.round((agg._sum.amount || 0) * 100)
}

function computeStats(withdrawals: Withdrawal[]): WithdrawalStats {
  return {
    totalWithdrawals: withdrawals.length,
    pendingWithdrawals: withdrawals.filter((w) => w.status === 'PENDING' || w.status === 'PROCESSING').length,
    completedWithdrawals: withdrawals.filter((w) => w.status === 'COMPLETE').length,
    totalWithdrawn: withdrawals.filter((w) => w.status === 'COMPLETE').reduce((acc, w) => acc + w.amount, 0),
  }
}

/**
 * Map a failed withdrawal creation to an HTTP status + response body.
 * Returns plain objects (no NextResponse) so the service stays framework-free.
 */
export function mapWithdrawalCreateError(
  result: Extract<WithdrawalCreateResult, { ok: false }>,
  requestedAmount: number
): { status: number; body: Record<string, unknown> } {
  switch (result.reason) {
    case 'INSUFFICIENT':
      return {
        status: HttpStatus.BAD_REQUEST,
        body: { message: result.message, availableBalance: result.availableBalance, requestedAmount },
      }
    case 'PROVIDER_ERROR':
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        body: { message: result.message, error: result.providerError },
      }
    // INVALID_AMOUNT, MISSING_PIX, INVALID_PIX_TYPE, PENDING_EXISTS
    default:
      return { status: HttpStatus.BAD_REQUEST, body: { message: result.message } }
  }
}
