/**
 * @jest-environment node
 */

import { POST as acceptOrderRoute } from '@/app/api/booster/orders/[id]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    commissionConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    boosterCommission: {
      create: jest.fn(),
    },
    adminRevenue: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyBooster: jest.fn(),
  createAuthErrorResponse: jest.fn(),
}))

import { verifyBooster } from '@/lib/auth-middleware'

describe('/api/booster/orders/[id] - Comissão Personalizada', () => {
  let boosterToken: string
  let boosterId: number
  let orderId: number

  beforeEach(() => {
    boosterToken = 'mock-booster-token'
    boosterId = 2
    orderId = 1
    
    // Mock verifyBooster para retornar booster
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: boosterId,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/booster/orders/[id] - Aceitar pedido com comissão personalizada', () => {
    it('deve usar comissão personalizada do booster se existir', async () => {
      const mockOrder = {
        id: orderId,
        userId: 3,
        serviceId: 1,
        boosterId: null,
        status: 'PENDING',
        total: 100.0,
        adminId: 1,
      }

      const mockBooster = {
        id: boosterId,
        boosterCommissionPercentage: 0.75, // Comissão personalizada
      }

      const mockUpdatedOrder = {
        id: orderId,
        userId: 3,
        serviceId: 1,
        boosterId: boosterId,
        status: 'IN_PROGRESS',
        total: 100.0,
        boosterCommission: 75.0,
        boosterPercentage: 0.75,
        adminRevenue: 25.0,
        adminPercentage: 0.25,
        user: {
          id: 3,
          email: 'client@test.com',
          name: 'Client',
        },
        service: {
          id: 1,
          name: 'Boost CS2',
        },
        booster: {
          id: boosterId,
          email: 'booster@test.com',
          name: 'Booster',
        },
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          order: {
            findUnique: jest.fn().mockResolvedValue({ adminId: 1 }),
            update: jest.fn().mockResolvedValue(mockUpdatedOrder),
          },
          boosterCommission: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              orderId: orderId,
              boosterId: boosterId,
              orderTotal: 100.0,
              percentage: 0.75,
              amount: 75.0,
              status: 'PENDING',
            }),
          },
          adminRevenue: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return await callback(tx)
      })

      const request = new NextRequest(`http://localhost/api/booster/orders/${orderId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${boosterToken}`,
        },
      })

      const response = await acceptOrderRoute(request, { params: Promise.resolve({ id: orderId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.order.boosterCommission).toBe(75.0)
      expect(data.order.boosterPercentage).toBe(0.75)
      expect(data.order.adminRevenue).toBe(25.0)
      expect(data.order.adminPercentage).toBe(0.25)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: boosterId },
        select: { boosterCommissionPercentage: true },
      })
    })

    it('deve usar configuração global se booster não tiver comissão personalizada', async () => {
      const mockOrder = {
        id: orderId,
        userId: 3,
        serviceId: 1,
        boosterId: null,
        status: 'PENDING',
        total: 100.0,
        adminId: 1,
      }

      const mockBooster = {
        id: boosterId,
        boosterCommissionPercentage: null, // Sem comissão personalizada
      }

      const mockConfig = {
        id: 1,
        boosterPercentage: 0.70,
        adminPercentage: 0.30,
        enabled: true,
      }

      const mockUpdatedOrder = {
        id: orderId,
        userId: 3,
        serviceId: 1,
        boosterId: boosterId,
        status: 'IN_PROGRESS',
        total: 100.0,
        boosterCommission: 70.0,
        boosterPercentage: 0.70,
        adminRevenue: 30.0,
        adminPercentage: 0.30,
        user: {
          id: 3,
          email: 'client@test.com',
          name: 'Client',
        },
        service: {
          id: 1,
          name: 'Boost CS2',
        },
        booster: {
          id: boosterId,
          email: 'booster@test.com',
          name: 'Booster',
        },
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)
      ;(prisma.commissionConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          order: {
            findUnique: jest.fn().mockResolvedValue({ adminId: 1 }),
            update: jest.fn().mockResolvedValue(mockUpdatedOrder),
          },
          boosterCommission: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              orderId: orderId,
              boosterId: boosterId,
              orderTotal: 100.0,
              percentage: 0.70,
              amount: 70.0,
              status: 'PENDING',
            }),
          },
          adminRevenue: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return await callback(tx)
      })

      const request = new NextRequest(`http://localhost/api/booster/orders/${orderId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${boosterToken}`,
        },
      })

      const response = await acceptOrderRoute(request, { params: Promise.resolve({ id: orderId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.order.boosterCommission).toBe(70.0)
      expect(data.order.boosterPercentage).toBe(0.70)
      expect(data.order.adminRevenue).toBe(30.0)
      expect(data.order.adminPercentage).toBe(0.30)
      expect(prisma.commissionConfig.findFirst).toHaveBeenCalledWith({
        where: { enabled: true },
      })
    })

    it('deve criar configuração padrão se não existir', async () => {
      const mockOrder = {
        id: orderId,
        userId: 3,
        serviceId: 1,
        boosterId: null,
        status: 'PENDING',
        total: 100.0,
        adminId: 1,
      }

      const mockBooster = {
        id: boosterId,
        boosterCommissionPercentage: null,
      }

      const mockConfig = {
        id: 1,
        boosterPercentage: 0.70,
        adminPercentage: 0.30,
        enabled: true,
      }

      const mockUpdatedOrder = {
        id: orderId,
        userId: 3,
        serviceId: 1,
        boosterId: boosterId,
        status: 'IN_PROGRESS',
        total: 100.0,
        boosterCommission: 70.0,
        boosterPercentage: 0.70,
        adminRevenue: 30.0,
        adminPercentage: 0.30,
        user: {
          id: 3,
          email: 'client@test.com',
          name: 'Client',
        },
        service: {
          id: 1,
          name: 'Boost CS2',
        },
        booster: {
          id: boosterId,
          email: 'booster@test.com',
          name: 'Booster',
        },
      }

      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)
      ;(prisma.commissionConfig.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.commissionConfig.create as jest.Mock).mockResolvedValue(mockConfig)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          order: {
            findUnique: jest.fn().mockResolvedValue({ adminId: 1 }),
            update: jest.fn().mockResolvedValue(mockUpdatedOrder),
          },
          boosterCommission: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              orderId: orderId,
              boosterId: boosterId,
              orderTotal: 100.0,
              percentage: 0.70,
              amount: 70.0,
              status: 'PENDING',
            }),
          },
          adminRevenue: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return await callback(tx)
      })

      const request = new NextRequest(`http://localhost/api/booster/orders/${orderId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${boosterToken}`,
        },
      })

      const response = await acceptOrderRoute(request, { params: Promise.resolve({ id: orderId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prisma.commissionConfig.create).toHaveBeenCalledWith({
        data: {
          boosterPercentage: 0.70,
          adminPercentage: 0.30,
          enabled: true,
        },
      })
    })
  })
})

