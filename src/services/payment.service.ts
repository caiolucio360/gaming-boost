/**
 * Payment Service
 * Centralized business logic for payment processing and webhook handling
 *
 * Uses Result<T> pattern for consistent error handling
 */

import { prisma } from '@/lib/db'
import { PaymentStatus, OrderStatus, WithdrawalStatus } from '@/generated/prisma/client'
import { Result, success, failure, ErrorCode } from './types'
import type { CreatePixInput } from '@/schemas/payment'
import { sendPaymentConfirmationEmail } from '@/lib/email'

// ============================================================================
// Types
// ============================================================================

interface CreatePaymentInput extends CreatePixInput {
  total: number
  userId: number
}

interface PaymentWithOrder {
  id: number
  orderId: number
  providerId: string | null
  status: PaymentStatus
  total: number
  paidAt: Date | null
  order: {
    id: number
    userId: number
    game: string
    status: OrderStatus
    total: number
  }
}

interface WebhookEventResult {
  processed: boolean
  message: string
  paymentId?: number
  orderId?: number
}

type WebhookEventType =
  | 'billing.paid'
  | 'withdraw.done'
  | 'withdraw.failed'
  | 'payment.refunded'
  | 'payment.expired'
  | 'payment.cancelled'

interface WebhookData {
  event?: string
  data?: {
    pixQrCode?: { id?: string; status?: string }
    billing?: { id?: string; status?: string }
    transaction?: { id?: string; externalId?: string }
  }
}

// ============================================================================
// PaymentService
// ============================================================================

export const PaymentService = {
  // --------------------------------------------------------------------------
  // Commission Calculation
  // --------------------------------------------------------------------------

  /**
   * Calculate commission split between booster and platform
   */
  calculateCommission(orderTotal: number, commissionRate: number = 0.70) {
    const boosterAmount = orderTotal * commissionRate
    const platformFee = orderTotal * (1 - commissionRate)

    return {
      boosterAmount: Math.round(boosterAmount * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      total: orderTotal,
    }
  },

  // --------------------------------------------------------------------------
  // Status Validation
  // --------------------------------------------------------------------------

  /**
   * Validate payment status transition
   */
  canTransitionStatus(from: PaymentStatus, to: PaymentStatus): boolean {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      PENDING: [PaymentStatus.PAID, PaymentStatus.EXPIRED, PaymentStatus.CANCELLED],
      PAID: [PaymentStatus.REFUNDED],
      EXPIRED: [],
      REFUNDED: [],
      CANCELLED: [],
    }

    return validTransitions[from]?.includes(to) ?? false
  },

  // --------------------------------------------------------------------------
  // Payment CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: number): Promise<Result<PaymentWithOrder | null>> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            select: { id: true, userId: true, serviceId: true, status: true, total: true },
          },
        },
      })

      return success(payment as PaymentWithOrder | null)
    } catch (error) {
      console.error('Error getting payment by ID:', error)
      return failure('Erro ao buscar pagamento', 'DATABASE_ERROR')
    }
  },

  /**
   * Get payment by provider ID (AbacatePay ID)
   */
  async getPaymentByProviderId(providerId: string): Promise<Result<PaymentWithOrder | null>> {
    try {
      const payment = await prisma.payment.findFirst({
        where: { providerId },
        include: {
          order: {
            select: { id: true, userId: true, serviceId: true, status: true, total: true },
          },
        },
      })

      return success(payment as PaymentWithOrder | null)
    } catch (error) {
      console.error('Error getting payment by provider ID:', error)
      return failure('Erro ao buscar pagamento', 'DATABASE_ERROR')
    }
  },

  /**
   * Get payments for an order
   */
  async getPaymentsByOrderId(orderId: number): Promise<Result<unknown[]>> {
    try {
      const payments = await prisma.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      })

      return success(payments)
    } catch (error) {
      console.error('Error getting payments by order ID:', error)
      return failure('Erro ao buscar pagamentos', 'DATABASE_ERROR')
    }
  },

  /**
   * Create a new payment record
   */
  async createPayment(input: CreatePaymentInput): Promise<Result<unknown>> {
    const { orderId, total, userId } = input

    try {
      // Verify order exists and belongs to user
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
      })

      if (!order) {
        return failure('Pedido não encontrado', 'ORDER_NOT_FOUND')
      }

      if (order.userId !== userId) {
        return failure('Pedido não pertence ao usuário', 'FORBIDDEN')
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          orderId: parseInt(orderId),
          total,
          status: PaymentStatus.PENDING,
          method: 'PIX',
        },
      })

      return success(payment)
    } catch (error) {
      console.error('Error creating payment:', error)
      return failure('Erro ao criar pagamento', 'DATABASE_ERROR')
    }
  },

  /**
   * Update payment status with validation
   */
  async updatePaymentStatus(
    paymentId: number,
    status: PaymentStatus
  ): Promise<Result<unknown>> {
    try {
      const existingPayment = await prisma.payment.findUnique({
        where: { id: paymentId },
      })

      if (!existingPayment) {
        return failure('Pagamento não encontrado', 'PAYMENT_NOT_FOUND')
      }

      if (!this.canTransitionStatus(existingPayment.status, status)) {
        return failure(
          `Transição de ${existingPayment.status} para ${status} não permitida`,
          'INVALID_STATUS_TRANSITION'
        )
      }

      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status },
      })

      return success(payment)
    } catch (error) {
      console.error('Error updating payment status:', error)
      return failure('Erro ao atualizar status do pagamento', 'DATABASE_ERROR')
    }
  },

  // --------------------------------------------------------------------------
  // Webhook Event Processing
  // --------------------------------------------------------------------------

  /**
   * Single entry point for processing webhook events
   */
  async processWebhookEvent(webhookData: WebhookData): Promise<Result<WebhookEventResult>> {
    const eventType = webhookData.event
    const data = webhookData.data || {}

    try {
      switch (eventType) {
        case 'billing.paid':
          return await this.handlePaymentPaid(data)

        case 'withdraw.done':
          return await this.handleWithdrawDone(data)

        case 'withdraw.failed':
          return await this.handleWithdrawFailed(data)

        default:
          // Try to process by status from billing/pixQrCode data
          const providerId = data.pixQrCode?.id || data.billing?.id
          const status = data.pixQrCode?.status || data.billing?.status

          if (providerId && status) {
            if (status === 'PAID') {
              return await this.handlePaymentPaid(data)
            } else if (['REFUNDED', 'EXPIRED', 'CANCELLED'].includes(status)) {
              return await this.handlePaymentStatusChange(providerId, status as PaymentStatus)
            }
          }

          console.warn('Unhandled webhook event:', eventType, data)
          return success({ processed: false, message: 'Evento não reconhecido' })
      }
    } catch (error) {
      console.error('Error processing webhook event:', error)
      return failure('Erro ao processar evento do webhook', 'INTERNAL_ERROR')
    }
  },

  /**
   * Confirm payment (transactional) - updates payment and order status atomically
   */
  async confirmPayment(providerId: string): Promise<Result<WebhookEventResult>> {
    try {
      // Find payment by provider ID
      const payment = await prisma.payment.findFirst({
        where: { providerId },
        include: { order: true },
      })

      if (!payment) {
        console.error('Payment not found for providerId:', providerId)
        return failure('Pagamento não encontrado', 'PAYMENT_NOT_FOUND')
      }

      // Idempotency: check if already processed
      if (payment.status === PaymentStatus.PAID) {
        console.log(`Payment ${payment.id} already processed, skipping`)
        return success({ processed: true, message: 'Já processado', paymentId: payment.id, orderId: payment.orderId })
      }

      // Update payment and order in transaction
      await prisma.$transaction(async (tx: any) => {
        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        })

        // Update order to PAID if was PENDING
        if (payment.order.status === OrderStatus.PENDING) {
          await tx.order.update({
            where: { id: payment.order.id },
            data: { status: OrderStatus.PAID },
          })

          // Create notification for user
          await tx.notification.create({
            data: {
              userId: payment.order.userId,
              type: 'PAYMENT',
              title: 'Pagamento Confirmado',
              message: `O pagamento do pedido #${payment.order.id} foi confirmado e aguarda um booster.`,
            },
          })
        }
      })

      console.log(`Payment ${payment.id} confirmed, order ${payment.orderId} updated to PAID`)

      // Send email notification in background
      this.sendPaymentConfirmationEmailAsync(payment.order.userId, payment.orderId, payment.total)

      return success({
        processed: true,
        message: 'Pagamento confirmado',
        paymentId: payment.id,
        orderId: payment.orderId,
      })
    } catch (error) {
      console.error('Error confirming payment:', error)
      return failure('Erro ao confirmar pagamento', 'DATABASE_ERROR')
    }
  },

  // --------------------------------------------------------------------------
  // Private Webhook Handlers
  // --------------------------------------------------------------------------

  /**
   * Handle billing.paid event
   */
  async handlePaymentPaid(data: WebhookData['data']): Promise<Result<WebhookEventResult>> {
    const providerId = data?.pixQrCode?.id || data?.billing?.id

    if (!providerId) {
      console.warn('No provider ID found in webhook data')
      return success({ processed: false, message: 'ID do provedor não encontrado' })
    }

    return await this.confirmPayment(providerId)
  },

  /**
   * Handle withdraw.done event
   */
  async handleWithdrawDone(data: WebhookData['data']): Promise<Result<WebhookEventResult>> {
    const transaction = data?.transaction
    const withdrawId = transaction?.id
    const externalId = transaction?.externalId

    console.log('Processing withdraw.done:', { withdrawId, externalId })

    if (!withdrawId && !externalId) {
      return success({ processed: false, message: 'ID do saque não encontrado' })
    }

    try {
      const updateResult = await prisma.withdrawal.updateMany({
        where: {
          OR: [
            ...(withdrawId ? [{ providerId: withdrawId }] : []),
            ...(externalId ? [{ externalId: externalId }] : []),
          ],
        },
        data: {
          status: WithdrawalStatus.COMPLETE,
          completedAt: new Date(),
        },
      })

      if (updateResult.count === 0) {
        console.warn('Withdrawal not found:', { withdrawId, externalId })
        return success({ processed: false, message: 'Saque não encontrado' })
      }

      console.log(`Withdrawal updated to COMPLETE: ${withdrawId || externalId}`)
      return success({ processed: true, message: 'Saque concluído' })
    } catch (error) {
      console.error('Error processing withdraw.done:', error)
      return failure('Erro ao processar saque', 'DATABASE_ERROR')
    }
  },

  /**
   * Handle withdraw.failed event
   */
  async handleWithdrawFailed(data: WebhookData['data']): Promise<Result<WebhookEventResult>> {
    const transaction = data?.transaction
    const withdrawId = transaction?.id
    const externalId = transaction?.externalId

    console.log('Processing withdraw.failed:', { withdrawId, externalId })

    if (!withdrawId && !externalId) {
      return success({ processed: false, message: 'ID do saque não encontrado' })
    }

    try {
      const updateResult = await prisma.withdrawal.updateMany({
        where: {
          OR: [
            ...(withdrawId ? [{ providerId: withdrawId }] : []),
            ...(externalId ? [{ externalId: externalId }] : []),
          ],
        },
        data: {
          status: WithdrawalStatus.FAILED,
        },
      })

      if (updateResult.count === 0) {
        console.warn('Withdrawal not found for failed event:', { withdrawId, externalId })
        return success({ processed: false, message: 'Saque não encontrado' })
      }

      console.log(`Withdrawal marked as FAILED: ${withdrawId || externalId}`)
      return success({ processed: true, message: 'Saque falhou' })
    } catch (error) {
      console.error('Error processing withdraw.failed:', error)
      return failure('Erro ao processar falha do saque', 'DATABASE_ERROR')
    }
  },

  /**
   * Handle payment status change (REFUNDED, EXPIRED, CANCELLED)
   */
  async handlePaymentStatusChange(
    providerId: string,
    newStatus: PaymentStatus
  ): Promise<Result<WebhookEventResult>> {
    try {
      const payment = await prisma.payment.findFirst({
        where: { providerId },
        include: { order: true },
      })

      if (!payment) {
        console.warn(`Payment not found for providerId: ${providerId}`)
        return success({ processed: false, message: 'Pagamento não encontrado' })
      }

      // Process REFUNDED
      if (newStatus === PaymentStatus.REFUNDED && payment.status !== PaymentStatus.REFUNDED) {
        await prisma.$transaction(async (tx: any) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.REFUNDED },
          })

          // Cancel order if refunded
          if (payment.order.status !== OrderStatus.CANCELLED) {
            await tx.order.update({
              where: { id: payment.order.id },
              data: { status: OrderStatus.CANCELLED },
            })

            await tx.notification.create({
              data: {
                userId: payment.order.userId,
                type: 'PAYMENT',
                title: 'Pagamento Reembolsado',
                message: `O pagamento do pedido #${payment.order.id} foi reembolsado e o pedido cancelado.`,
              },
            })
          }
        })

        console.log(`Payment ${payment.id} refunded, order ${payment.order.id} cancelled`)
        return success({ processed: true, message: 'Pagamento reembolsado', paymentId: payment.id, orderId: payment.orderId })
      }

      // Process EXPIRED or CANCELLED
      if ((newStatus === PaymentStatus.EXPIRED || newStatus === PaymentStatus.CANCELLED) && payment.status === PaymentStatus.PENDING) {
        await prisma.$transaction(async (tx: any) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: newStatus },
          })

          const statusLabel = newStatus === PaymentStatus.EXPIRED ? 'Expirado' : 'Cancelado'
          await tx.notification.create({
            data: {
              userId: payment.order.userId,
              type: 'PAYMENT',
              title: `Pagamento ${statusLabel}`,
              message: `O pagamento do pedido #${payment.order.id} foi ${statusLabel.toLowerCase()}.`,
            },
          })
        })

        console.log(`Payment ${payment.id} ${newStatus}`)
        return success({ processed: true, message: `Pagamento ${newStatus.toLowerCase()}`, paymentId: payment.id, orderId: payment.orderId })
      }

      console.log(`Payment ${payment.id} status ${newStatus} already processed or invalid transition`)
      return success({ processed: true, message: 'Nenhuma ação necessária' })
    } catch (error) {
      console.error('Error handling payment status change:', error)
      return failure('Erro ao processar mudança de status', 'DATABASE_ERROR')
    }
  },

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Send payment confirmation email asynchronously (non-blocking)
   */
  async sendPaymentConfirmationEmailAsync(userId: number, orderId: number, total: number): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      })

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { game: true, gameMode: true },
      })

      if (user && order) {
        const serviceName = order.gameMode ? `CS2 ${order.gameMode}` : 'Boost CS2'
        sendPaymentConfirmationEmail(
          user.email,
          orderId,
          total,
          serviceName
        ).then((sent) => {
          if (sent) {
            console.log(`✅ Payment confirmation email sent to ${user.email} for order #${orderId}`)
          }
        }).catch((error) => {
          console.error(`❌ Failed to send payment confirmation email:`, error)
        })
      }
    } catch (error) {
      console.error('Error preparing payment confirmation email:', error)
    }
  },
}
