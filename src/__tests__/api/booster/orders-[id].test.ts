/**
 * @jest-environment node
 */

import { POST, PUT } from '@/app/api/booster/orders/[id]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyBooster } from '@/lib/auth-middleware'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    commissionConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    boosterCommission: {
      create: jest.fn(),
      updateMany: jest.fn(),
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
  createAuthErrorResponse: jest.fn((message: string, status: number) => {
    return new Response(JSON.stringify({ message }), { status })
  }),
}))

describe('POST /api/booster/orders/[id] (aceitar pedido)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve aceitar pedido com sucesso usando transação atômica', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const existingOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'PENDING',
      boosterId: null,
      total: 100,
    }

    const booster = {
      boosterCommissionPercentage: null,
    }

    const commissionConfig = {
      boosterPercentage: 0.70,
      adminPercentage: 0.30,
    }

    const updatedOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'IN_PROGRESS',
      boosterId: 1,
      total: 100,
      adminId: 1,
      boosterCommission: 70,
      adminRevenue: 30,
      user: { id: 1, email: 'client@test.com', name: 'Client' },
      service: { id: 1, name: 'Service' },
      booster: { id: 1, email: 'booster@test.com', name: 'Booster' },
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(existingOrder)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(booster)
    ;(prisma.commissionConfig.findFirst as jest.Mock).mockResolvedValue(commissionConfig)

    // Simular transação atômica
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        order: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          findUnique: jest.fn().mockResolvedValue(updatedOrder),
        },
        boosterCommission: {
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
        adminRevenue: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      }
      return callback(tx)
    })

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.order).toBeDefined()
    expect(data.order.status).toBe('IN_PROGRESS')
    expect(data.order.boosterId).toBe(1)
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('deve retornar erro 404 se pedido não existir', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/999', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '999' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })

  it('deve retornar erro 400 se pedido já foi aceito', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const existingOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'IN_PROGRESS',
      boosterId: 2,
      total: 100,
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(existingOrder)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('não está disponível')
  })
})

describe('PUT /api/booster/orders/[id] (atualizar status)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve atualizar status do pedido para COMPLETED', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const existingOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'IN_PROGRESS',
      boosterId: 1,
      total: 100,
    }

    const updatedOrder = {
      ...existingOrder,
      status: 'COMPLETED',
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(existingOrder)
    ;(prisma.order.update as jest.Mock).mockResolvedValue(updatedOrder)
    ;(prisma.boosterCommission.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'COMPLETED',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.order).toBeDefined()
    expect(data.order.status).toBe('COMPLETED')
  })

  it('deve retornar erro 404 se pedido não existir', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/999', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'COMPLETED',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })

  it('deve retornar erro 403 se pedido não pertence ao booster', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const existingOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'IN_PROGRESS',
      boosterId: 2,
      total: 100,
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(existingOrder)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'COMPLETED',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('não foi atribuído')
  })
})

