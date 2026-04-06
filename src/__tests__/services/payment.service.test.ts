/**
 * @jest-environment node
 */

const mockTx = {
  payment: { updateMany: jest.fn() },
  order: { update: jest.fn() },
  notification: { create: jest.fn() },
}

jest.mock('@/lib/db', () => ({
  prisma: {
    payment: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(mockTx)),
  },
}))

jest.mock('@/lib/email', () => ({
  sendPaymentConfirmationEmail: jest.fn().mockResolvedValue(true),
}))

import { prisma } from '@/lib/db'
import { PaymentService } from '@/services/payment.service'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('PaymentService.confirmPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Defaults for email async path — avoid unresolved promise noise
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(null)
  })

  describe('when payment is not found', () => {
    it('returns failure with PAYMENT_NOT_FOUND', async () => {
      ;(mockPrisma.payment.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await PaymentService.confirmPayment('provider-123')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Pagamento não encontrado')
      }
      // Transaction should NOT be called
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('when payment is found and is PENDING (first call)', () => {
    const mockPayment = {
      id: 1,
      orderId: 10,
      providerId: 'provider-abc',
      status: 'PENDING',
      total: 5000,
      order: {
        id: 10,
        userId: 42,
        status: 'PENDING',
      },
    }

    beforeEach(() => {
      ;(mockPrisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      mockTx.payment.updateMany.mockResolvedValue({ count: 1 })
      mockTx.order.update.mockResolvedValue({})
      mockTx.notification.create.mockResolvedValue({})
    })

    it('returns success with "Pagamento confirmado"', async () => {
      const result = await PaymentService.confirmPayment('provider-abc')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.processed).toBe(true)
        expect(result.data.message).toBe('Pagamento confirmado')
        expect(result.data.paymentId).toBe(1)
        expect(result.data.orderId).toBe(10)
      }
    })

    it('updates order status to PAID', async () => {
      await PaymentService.confirmPayment('provider-abc')

      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPayment.order.id },
          data: expect.objectContaining({ status: 'PAID' }),
        })
      )
    })

    it('creates a PAYMENT notification for the user', async () => {
      await PaymentService.confirmPayment('provider-abc')

      expect(mockTx.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockPayment.order.userId,
            type: 'PAYMENT',
            title: 'Pagamento Confirmado',
          }),
        })
      )
    })
  })

  describe('when payment has already been processed (duplicate webhook)', () => {
    const mockPayment = {
      id: 2,
      orderId: 20,
      providerId: 'provider-dup',
      status: 'PAID',
      total: 3000,
      order: {
        id: 20,
        userId: 99,
        status: 'PAID',
      },
    }

    beforeEach(() => {
      ;(mockPrisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      // updateMany returns 0 — the PENDING guard prevents double-processing
      mockTx.payment.updateMany.mockResolvedValue({ count: 0 })
    })

    it('returns success with "Já processado"', async () => {
      const result = await PaymentService.confirmPayment('provider-dup')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.processed).toBe(true)
        expect(result.data.message).toBe('Já processado')
        expect(result.data.paymentId).toBe(2)
        expect(result.data.orderId).toBe(20)
      }
    })

    it('does NOT update order status again', async () => {
      await PaymentService.confirmPayment('provider-dup')

      expect(mockTx.order.update).not.toHaveBeenCalled()
    })

    it('does NOT create a duplicate notification', async () => {
      await PaymentService.confirmPayment('provider-dup')

      expect(mockTx.notification.create).not.toHaveBeenCalled()
    })
  })
})
