/**
 * @jest-environment node
 */

import { GET as getConfigRoute, PUT as updateConfigRoute } from '@/app/api/admin/commission-config/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    commissionConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAdmin: jest.fn(),
  createAuthErrorResponseFromResult: jest.fn(),
}))

import { verifyAdmin } from '@/lib/auth-middleware'

describe('/api/admin/commission-config', () => {
  let adminToken: string

  beforeEach(() => {
    adminToken = 'mock-admin-token'
    
    // Mock verifyAdmin para retornar admin
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/commission-config', () => {
    it('deve retornar a configuração de comissão ativa', async () => {
      const mockConfig = {
        id: 1,
        boosterPercentage: 0.70,
        adminPercentage: 0.30,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.commissionConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig)

      const request = new NextRequest('http://localhost/api/admin/commission-config', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const response = await getConfigRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.config.boosterPercentage).toBe(0.70)
      expect(data.config.adminPercentage).toBe(0.30)
      expect(data.config.enabled).toBe(true)
      expect(prisma.commissionConfig.findFirst).toHaveBeenCalledWith({
        where: { enabled: true },
      })
    })

    it('deve criar configuração padrão se não existir', async () => {
      const mockConfig = {
        id: 1,
        boosterPercentage: 0.70,
        adminPercentage: 0.30,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.commissionConfig.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.commissionConfig.create as jest.Mock).mockResolvedValue(mockConfig)

      const request = new NextRequest('http://localhost/api/admin/commission-config', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const response = await getConfigRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.config.boosterPercentage).toBe(0.70)
      expect(data.config.adminPercentage).toBe(0.30)
      expect(data.config.enabled).toBe(true)
      expect(prisma.commissionConfig.create).toHaveBeenCalledWith({
        data: {
          boosterPercentage: 0.70,
          adminPercentage: 0.30,
          enabled: true,
        },
      })
    })
  })

  describe('PUT /api/admin/commission-config', () => {
    it('deve atualizar a configuração de comissão', async () => {
      const mockConfig = {
        id: 1,
        boosterPercentage: 0.80,
        adminPercentage: 0.20,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          commissionConfig: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockResolvedValue(mockConfig),
          },
        })
      })

      const request = new NextRequest('http://localhost/api/admin/commission-config', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          boosterPercentage: 0.80,
          adminPercentage: 0.20,
        }),
      })

      const response = await updateConfigRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Configuração de comissão atualizada com sucesso')
      expect(data.config.boosterPercentage).toBe(0.80)
      expect(data.config.adminPercentage).toBe(0.20)
      expect(data.config.enabled).toBe(true)
    })

    it('deve retornar 400 se porcentagens não somarem 100%', async () => {
      const request = new NextRequest('http://localhost/api/admin/commission-config', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          boosterPercentage: 0.70,
          adminPercentage: 0.20, // Soma = 90%
        }),
      })

      const response = await updateConfigRoute(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('A soma das porcentagens deve ser 100%')
    })

    it('deve retornar 400 se porcentagem for negativa', async () => {
      const request = new NextRequest('http://localhost/api/admin/commission-config', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          boosterPercentage: -0.10,
          adminPercentage: 1.10,
        }),
      })

      const response = await updateConfigRoute(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Porcentagens devem estar entre 0 e 1 (0% e 100%)')
    })

    it('deve retornar 400 se porcentagem for maior que 1', async () => {
      const request = new NextRequest('http://localhost/api/admin/commission-config', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          boosterPercentage: 1.10,
          adminPercentage: -0.10,
        }),
      })

      const response = await updateConfigRoute(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Porcentagens devem estar entre 0 e 1 (0% e 100%)')
    })
  })
})

