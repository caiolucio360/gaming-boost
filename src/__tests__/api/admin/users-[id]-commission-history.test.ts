/**
 * @jest-environment node
 */

import { GET as getCommissionHistoryRoute } from '@/app/api/admin/users/[id]/commission-history/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    boosterCommissionHistory: {
      findMany: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAdmin: jest.fn(),
  createAuthErrorResponseFromResult: jest.fn(),
}))

import { verifyAdmin } from '@/lib/auth-middleware'

describe('/api/admin/users/[id]/commission-history', () => {
  let adminToken: string
  let adminId: number
  let boosterId: number

  beforeEach(() => {
    adminToken = 'mock-admin-token'
    adminId = 1
    boosterId = 2
    
    // Mock verifyAdmin para retornar admin
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: adminId,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/users/[id]/commission-history', () => {
    it('deve retornar o histórico de comissão do booster', async () => {
      const mockBooster = {
        id: boosterId,
        email: 'booster@test.com',
        role: 'BOOSTER',
      }

      const mockHistory = [
        {
          id: 1,
          boosterId: boosterId,
          previousPercentage: 0.70,
          newPercentage: 0.75,
          changedBy: adminId,
          reason: 'Ajuste por desempenho',
          createdAt: new Date('2024-01-15'),
          changedByUser: {
            id: adminId,
            email: 'admin@test.com',
            name: 'Admin Test',
          },
        },
        {
          id: 2,
          boosterId: boosterId,
          previousPercentage: null,
          newPercentage: 0.70,
          changedBy: adminId,
          reason: null,
          createdAt: new Date('2024-01-10'),
          changedByUser: {
            id: adminId,
            email: 'admin@test.com',
            name: 'Admin Test',
          },
        },
      ]

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)
      ;(prisma.boosterCommissionHistory.findMany as jest.Mock).mockResolvedValue(mockHistory)

      const request = new NextRequest(`http://localhost/api/admin/users/${boosterId}/commission-history`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const response = await getCommissionHistoryRoute(request, { params: Promise.resolve({ id: boosterId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.history).toHaveLength(2)
      expect(data.history[0].newPercentage).toBe(0.75)
      expect(data.history[0].previousPercentage).toBe(0.70)
      expect(data.history[0].reason).toBe('Ajuste por desempenho')
      expect(data.history[0].changedByUser).toBeDefined()
      expect(data.history[1].previousPercentage).toBeNull()
      expect(prisma.boosterCommissionHistory.findMany).toHaveBeenCalledWith({
        where: { boosterId: boosterId },
        include: {
          changedByUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('deve retornar array vazio se não houver histórico', async () => {
      const mockBooster = {
        id: boosterId,
        email: 'booster@test.com',
        role: 'BOOSTER',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)
      ;(prisma.boosterCommissionHistory.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest(`http://localhost/api/admin/users/${boosterId}/commission-history`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const response = await getCommissionHistoryRoute(request, { params: Promise.resolve({ id: boosterId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.history).toHaveLength(0)
    })

    it('deve retornar 404 se usuário não encontrado', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest(`http://localhost/api/admin/users/999/commission-history`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const response = await getCommissionHistoryRoute(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Usuário não encontrado')
      expect(prisma.boosterCommissionHistory.findMany).not.toHaveBeenCalled()
    })

    it('deve retornar 400 se usuário não for booster', async () => {
      const mockClient = {
        id: 3,
        email: 'client@test.com',
        role: 'CLIENT',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockClient)

      const request = new NextRequest(`http://localhost/api/admin/users/3/commission-history`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const response = await getCommissionHistoryRoute(request, { params: Promise.resolve({ id: '3' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Este usuário não é um booster')
      expect(prisma.boosterCommissionHistory.findMany).not.toHaveBeenCalled()
    })

    it('deve retornar 400 se ID for inválido', async () => {
      const request = new NextRequest(`http://localhost/api/admin/users/invalid/commission-history`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const response = await getCommissionHistoryRoute(request, { params: Promise.resolve({ id: 'invalid' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('ID do usuário inválido')
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })
  })
})

