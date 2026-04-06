/**
 * @jest-environment node
 */

jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    order: { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
    commissionConfig: { findFirst: jest.fn() },
    notification: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/lib/retention', () => ({
  bestAvailableDiscount: jest.fn().mockReturnValue(0),
  updateUserStreak: jest.fn().mockResolvedValue({ newStreak: 1, leveledUp: false, newDiscountPct: 0 }),
  isReactivationDiscountValid: jest.fn().mockReturnValue(false),
}))
jest.mock('@/lib/retention-utils', () => ({
  getNextMilestone: jest.fn().mockReturnValue(null),
  calculateProgressPct: jest.fn().mockReturnValue(100),
}))
jest.mock('@/lib/email', () => ({
  sendOrderCompletedEmail: jest.fn().mockResolvedValue(undefined),
  sendOrderAcceptedEmail: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/services/chat.service', () => ({
  ChatService: { wipeSteamCredentials: jest.fn().mockResolvedValue(undefined) },
}))

import { prisma } from '@/lib/db'
import { OrderService } from '@/services/order.service'
import { bestAvailableDiscount } from '@/lib/retention'

const mockPrisma = prisma as jest.Mocked<typeof prisma> & {
  order: {
    findFirst: jest.MockedFunction<any>
    create: jest.MockedFunction<any>
    findUnique: jest.MockedFunction<any>
  }
  user: {
    findUnique: jest.MockedFunction<any>
    update: jest.MockedFunction<any>
  }
  commissionConfig: {
    findFirst: jest.MockedFunction<any>
  }
  $transaction: jest.MockedFunction<any>
}

// ---------------------------------------------------------------------------
// createOrder
// ---------------------------------------------------------------------------

describe('OrderService.createOrder', () => {
  const baseInput = {
    userId: 1,
    game: 'CS2' as const,
    serviceType: 'RANK_BOOST' as const,
    total: 100,
    gameMode: 'PREMIER' as const,
    currentRank: '10000',
    targetRank: '15000',
    currentRating: 10000,
    targetRating: 15000,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(bestAvailableDiscount as jest.MockedFunction<any>).mockReturnValue(0)
  })

  it('returns failure when a duplicate active order exists in same gameMode', async () => {
    // hasActiveOrderInGameMode → prisma.order.findFirst returns an existing order
    ;(mockPrisma.order.findFirst as jest.MockedFunction<any>).mockResolvedValue({
      id: 42,
      status: 'PENDING',
    })

    const result = await OrderService.createOrder(baseInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Premier')
    }
    expect(mockPrisma.order.create).not.toHaveBeenCalled()
  })

  it('creates order without discount when discountPct is 0', async () => {
    // No active order
    ;(mockPrisma.order.findFirst as jest.MockedFunction<any>).mockResolvedValue(null)
    // User without discount fields
    ;(mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue({
      currentDiscountPct: 0,
      reactivationDiscountPct: 0,
      reactivationDiscountExpiresAt: null,
    })
    ;(bestAvailableDiscount as jest.MockedFunction<any>).mockReturnValue(0)

    const createdOrder = { id: 1, ...baseInput, total: 100, discountApplied: false, discountPct: 0, status: 'PENDING' }
    ;(mockPrisma.order.create as jest.MockedFunction<any>).mockResolvedValue(createdOrder)

    const result = await OrderService.createOrder(baseInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.total).toBe(100)
    }
    expect(mockPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total: 100,
          discountApplied: false,
          discountPct: 0,
        }),
      })
    )
    // Should NOT update user to clear reactivation discount
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('creates order with discounted total when discountPct > 0', async () => {
    ;(mockPrisma.order.findFirst as jest.MockedFunction<any>).mockResolvedValue(null)
    ;(mockPrisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue({
      currentDiscountPct: 0,
      reactivationDiscountPct: 0.1,
      reactivationDiscountExpiresAt: new Date(Date.now() + 86400000),
    })
    ;(bestAvailableDiscount as jest.MockedFunction<any>).mockReturnValue(0.1) // 10% discount

    const discountedTotal = Math.round(100 * (1 - 0.1) * 100) / 100 // 90
    const createdOrder = { id: 2, ...baseInput, total: discountedTotal, discountApplied: true, discountPct: 0.1, status: 'PENDING' }
    ;(mockPrisma.order.create as jest.MockedFunction<any>).mockResolvedValue(createdOrder)
    ;(mockPrisma.user.update as jest.MockedFunction<any>).mockResolvedValue({})

    const result = await OrderService.createOrder(baseInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.total).toBe(90)
    }
    expect(mockPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total: 90,
          discountApplied: true,
          discountPct: 0.1,
        }),
      })
    )
    // Should clear the reactivation discount after use
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          reactivationDiscountPct: 0,
          reactivationDiscountExpiresAt: null,
        }),
      })
    )
  })
})

// ---------------------------------------------------------------------------
// completeOrder
// ---------------------------------------------------------------------------

describe('OrderService.completeOrder', () => {
  const baseInput = {
    orderId: 10,
    boosterId: 5,
    completionProofUrl: 'https://example.com/proof.png',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns failure when order is not found', async () => {
    ;(mockPrisma.order.findUnique as jest.MockedFunction<any>).mockResolvedValue(null)

    const result = await OrderService.completeOrder(baseInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it("returns failure when boosterId doesn't match order's boosterId", async () => {
    ;(mockPrisma.order.findUnique as jest.MockedFunction<any>).mockResolvedValue({
      id: 10,
      status: 'IN_PROGRESS',
      boosterId: 99, // different from baseInput.boosterId = 5
    })

    const result = await OrderService.completeOrder(baseInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('completes order successfully when order is found and boosterId matches', async () => {
    ;(mockPrisma.order.findUnique as jest.MockedFunction<any>).mockResolvedValue({
      id: 10,
      status: 'IN_PROGRESS',
      boosterId: 5,
    })
    ;(mockPrisma.commissionConfig.findFirst as jest.MockedFunction<any>).mockResolvedValue({
      withdrawalWaitingDays: 7,
    })

    const updatedOrder = {
      id: 10,
      status: 'COMPLETED',
      boosterId: 5,
      completionProofUrl: 'https://example.com/proof.png',
      gameMode: 'PREMIER',
      targetRating: 15000,
      targetRank: '15000',
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
      booster: { id: 5, name: 'Booster', email: 'booster@example.com' },
    }

    ;(mockPrisma.$transaction as jest.MockedFunction<any>).mockImplementation(async (cb: any) => {
      const tx = {
        order: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn().mockResolvedValue(updatedOrder),
        },
        boosterCommission: { updateMany: jest.fn().mockResolvedValue({}) },
        adminRevenue: { updateMany: jest.fn().mockResolvedValue({}) },
        devAdminRevenue: { updateMany: jest.fn().mockResolvedValue({}) },
      }
      return await cb(tx)
    })

    const result = await OrderService.completeOrder(baseInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('COMPLETED')
    }
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })
})
