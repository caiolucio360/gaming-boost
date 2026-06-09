/**
 * @jest-environment node
 */

const mockTx = {
  payment: { updateMany: jest.fn(), update: jest.fn() },
  order: { update: jest.fn() },
  notification: { create: jest.fn() },
}

jest.mock('@/lib/db', () => ({
  prisma: {
    payment: { findFirst: jest.fn(), findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    withdrawal: { updateMany: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(mockTx)),
  },
}))

jest.mock('@/lib/email', () => ({
  sendPaymentConfirmationEmail: jest.fn().mockResolvedValue(true),
}))

import { prisma } from '@/lib/db'
import { PaymentService } from '@/services/payment.service'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('PaymentService.processWebhookEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(null)
  })

  describe('billing.paid event (AbacatePay style)', () => {
    const mockPayment = {
      id: 1,
      orderId: 10,
      providerId: 'abacate-123',
      status: 'PENDING',
      total: 5000,
      order: {
        id: 10,
        userId: 42,
        status: 'PENDING',
      },
    }

    it('processes successfully and confirms payment', async () => {
      ;(mockPrisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      mockTx.payment.updateMany.mockResolvedValue({ count: 1 })
      mockTx.order.update.mockResolvedValue({})
      mockTx.notification.create.mockResolvedValue({})

      const payload = {
        event: 'billing.paid',
        data: {
          billing: {
            id: 'abacate-123',
            status: 'PAID'
          }
        }
      }

      const result = await PaymentService.processWebhookEvent(payload)

      expect(result.success).toBe(true)
      expect(mockPrisma.payment.findFirst).toHaveBeenCalledWith({
        where: { providerId: 'abacate-123' },
        include: { order: true }
      })
      if (result.success) {
        expect(result.data.message).toBe('Pagamento confirmado')
        expect(result.data.processed).toBe(true)
      }
    })
  })

  describe('Status inference (Asaas/Generic style)', () => {
    it('processes EXPIRED status correctly', async () => {
      const mockPayment = {
        id: 2,
        orderId: 20,
        providerId: 'pix-456',
        status: 'PENDING',
        order: { id: 20, userId: 10, status: 'PENDING' },
      }
      ;(mockPrisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      
      const payload = {
        data: {
          pixQrCode: {
            id: 'pix-456',
            status: 'EXPIRED'
          }
        }
      }

      const result = await PaymentService.processWebhookEvent(payload)

      expect(result.success).toBe(true)
      expect(mockTx.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: { status: 'EXPIRED' }
        })
      )
      expect(mockTx.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'PAYMENT', title: 'Pagamento Expirado' })
        })
      )
    })

    it('processes REFUNDED status correctly and cancels order', async () => {
      const mockPayment = {
        id: 3,
        orderId: 30,
        providerId: 'pix-789',
        status: 'PAID',
        order: { id: 30, userId: 11, status: 'PAID' },
      }
      ;(mockPrisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      
      const payload = {
        data: {
          billing: {
            id: 'pix-789',
            status: 'REFUNDED'
          }
        }
      }

      const result = await PaymentService.processWebhookEvent(payload)

      expect(result.success).toBe(true)
      expect(mockTx.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'REFUNDED' }
        })
      )
      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 30 },
          data: { status: 'CANCELLED' }
        })
      )
    })
  })

  describe('Withdrawal events', () => {
    it('processes withdraw.done correctly', async () => {
      ;(mockPrisma.withdrawal.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      
      const payload = {
        event: 'withdraw.done',
        data: {
          transaction: {
            id: 'tx_withdraw_1',
            externalId: 'ext_123'
          }
        }
      }

      const result = await PaymentService.processWebhookEvent(payload)
      
      expect(result.success).toBe(true)
      expect(mockPrisma.withdrawal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          data: expect.objectContaining({ status: 'COMPLETE' })
        })
      )
    })

    it('processes withdraw.failed correctly', async () => {
      ;(mockPrisma.withdrawal.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      
      const payload = {
        event: 'withdraw.failed',
        data: {
          transaction: {
            id: 'tx_withdraw_2'
          }
        }
      }

      const result = await PaymentService.processWebhookEvent(payload)
      
      expect(result.success).toBe(true)
      expect(mockPrisma.withdrawal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' })
        })
      )
    })
  })

  describe('Unhandled events', () => {
    it('returns processed: false for unknown event without id/status', async () => {
      const payload = {
        event: 'unknown.event',
        data: {}
      }

      const result = await PaymentService.processWebhookEvent(payload)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.processed).toBe(false)
        expect(result.data.message).toBe('Evento não reconhecido')
      }
    })
  })
})
