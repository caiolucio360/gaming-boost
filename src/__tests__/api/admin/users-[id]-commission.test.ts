/**
 * @jest-environment node
 */

import { PUT as updateUserRoute } from '@/app/api/admin/users/[id]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    boosterCommissionHistory: {
      create: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAdmin: jest.fn(),
  createAuthErrorResponseFromResult: jest.fn(),
}))

import { verifyAdmin } from '@/lib/auth-middleware'

describe('/api/admin/users/[id] - Comissão do Booster', () => {
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

  describe('PUT /api/admin/users/[id] - Atualizar comissão do booster', () => {
    it('deve atualizar a comissão do booster e registrar no histórico', async () => {
      const mockBooster = {
        id: boosterId,
        email: 'booster@test.com',
        role: 'BOOSTER',
        boosterCommissionPercentage: 0.70, // Comissão anterior
      }

      const mockUpdatedBooster = {
        id: boosterId,
        email: 'booster@test.com',
        name: 'Booster Test',
        role: 'BOOSTER',
        boosterCommissionPercentage: 0.75,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockHistory = {
        id: 1,
        boosterId: boosterId,
        previousPercentage: 0.70,
        newPercentage: 0.75,
        changedBy: adminId,
        reason: 'Ajuste por desempenho',
        createdAt: new Date(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedBooster)
      ;(prisma.boosterCommissionHistory.create as jest.Mock).mockResolvedValue(mockHistory)

      const request = new NextRequest(`http://localhost/api/admin/users/${boosterId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boosterCommissionPercentage: 0.75,
          reason: 'Ajuste por desempenho',
        }),
      })

      const response = await updateUserRoute(request, { params: Promise.resolve({ id: boosterId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.boosterCommissionPercentage).toBe(0.75)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: boosterId },
        data: expect.objectContaining({
          boosterCommissionPercentage: 0.75,
        }),
        select: expect.any(Object),
      })
      expect(prisma.boosterCommissionHistory.create).toHaveBeenCalledWith({
        data: {
          boosterId: boosterId,
          previousPercentage: 0.70,
          newPercentage: 0.75,
          changedBy: adminId,
          reason: 'Ajuste por desempenho',
        },
      })
    })

    it('deve registrar histórico mesmo sem motivo', async () => {
      const mockBooster = {
        id: boosterId,
        email: 'booster@test.com',
        role: 'BOOSTER',
        boosterCommissionPercentage: null, // Primeira vez configurando
      }

      const mockUpdatedBooster = {
        id: boosterId,
        email: 'booster@test.com',
        name: 'Booster Test',
        role: 'BOOSTER',
        boosterCommissionPercentage: 0.80,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedBooster)
      ;(prisma.boosterCommissionHistory.create as jest.Mock).mockResolvedValue({
        id: 1,
        boosterId: boosterId,
        previousPercentage: null,
        newPercentage: 0.80,
        changedBy: adminId,
        reason: null,
        createdAt: new Date(),
      })

      const request = new NextRequest(`http://localhost/api/admin/users/${boosterId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boosterCommissionPercentage: 0.80,
        }),
      })

      const response = await updateUserRoute(request, { params: Promise.resolve({ id: boosterId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prisma.boosterCommissionHistory.create).toHaveBeenCalledWith({
        data: {
          boosterId: boosterId,
          previousPercentage: null,
          newPercentage: 0.80,
          changedBy: adminId,
          reason: null,
        },
      })
    })

    it('deve retornar 400 se porcentagem for inválida (menor que 0)', async () => {
      const mockBooster = {
        id: boosterId,
        email: 'booster@test.com',
        role: 'BOOSTER',
        boosterCommissionPercentage: 0.70,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)

      const request = new NextRequest(`http://localhost/api/admin/users/${boosterId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boosterCommissionPercentage: -0.10,
        }),
      })

      const response = await updateUserRoute(request, { params: Promise.resolve({ id: boosterId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toContain('Porcentagem de comissão deve ser um número entre 0 e 1')
      expect(prisma.user.update).not.toHaveBeenCalled()
      expect(prisma.boosterCommissionHistory.create).not.toHaveBeenCalled()
    })

    it('deve retornar 400 se porcentagem for inválida (maior que 1)', async () => {
      const mockBooster = {
        id: boosterId,
        email: 'booster@test.com',
        role: 'BOOSTER',
        boosterCommissionPercentage: 0.70,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)

      const request = new NextRequest(`http://localhost/api/admin/users/${boosterId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boosterCommissionPercentage: 1.10,
        }),
      })

      const response = await updateUserRoute(request, { params: Promise.resolve({ id: boosterId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toContain('Porcentagem de comissão deve ser um número entre 0 e 1')
    })

    it('deve retornar 400 se usuário não for booster', async () => {
      const mockClient = {
        id: 3,
        email: 'client@test.com',
        role: 'CLIENT',
        boosterCommissionPercentage: null,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockClient)

      const request = new NextRequest(`http://localhost/api/admin/users/3`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boosterCommissionPercentage: 0.75,
        }),
      })

      const response = await updateUserRoute(request, { params: Promise.resolve({ id: '3' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Apenas boosters podem ter comissão personalizada')
      expect(prisma.user.update).not.toHaveBeenCalled()
      expect(prisma.boosterCommissionHistory.create).not.toHaveBeenCalled()
    })

    it('não deve registrar histórico se a comissão não mudou', async () => {
      const mockBooster = {
        id: boosterId,
        email: 'booster@test.com',
        role: 'BOOSTER',
        boosterCommissionPercentage: 0.75,
      }

      const mockUpdatedBooster = {
        id: boosterId,
        email: 'booster@test.com',
        name: 'Booster Test',
        role: 'BOOSTER',
        boosterCommissionPercentage: 0.75,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockBooster)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedBooster)

      const request = new NextRequest(`http://localhost/api/admin/users/${boosterId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boosterCommissionPercentage: 0.75, // Mesma comissão
        }),
      })

      const response = await updateUserRoute(request, { params: Promise.resolve({ id: boosterId.toString() }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prisma.boosterCommissionHistory.create).not.toHaveBeenCalled()
    })
  })
})

