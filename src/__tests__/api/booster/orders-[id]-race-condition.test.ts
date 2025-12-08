/**
 * @jest-environment node
 */

import { POST } from '@/app/api/booster/orders/[id]/route'
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
      findFirst: jest.fn(),
      updateMany: jest.fn(),
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
  createAuthErrorResponse: jest.fn((message: string, status: number) => {
    return new Response(JSON.stringify({ message }), { status })
  }),
}))

describe('POST /api/booster/orders/[id] - Race Conditions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve prevenir race condition quando dois boosters tentam aceitar o mesmo pedido', async () => {
    ; (verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster1@test.com',
        role: 'BOOSTER',
      },
    })

    const order = {
      id: 1,
      total: 100,
      status: 'PAID',
      boosterId: null,
    }

    const booster = {
      boosterCommissionPercentage: null,
    }

    const commissionConfig = {
      boosterPercentage: 0.70,
      adminPercentage: 0.30,
    }

      ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(order)
      ; (prisma.order.findFirst as jest.Mock).mockResolvedValue(null) // Nenhum pedido ativo
      ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(booster)
      ; (prisma.commissionConfig.findFirst as jest.Mock).mockResolvedValue(commissionConfig)

      // Simular transação onde updateMany retorna count: 0 (pedido já foi pego)
      ; (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          order: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }), // Nenhuma linha atualizada
            findUnique: jest.fn().mockResolvedValue({
              ...order,
              boosterId: 2, // Já foi atribuído a outro booster
            }),
          },
          boosterCommission: {
            create: jest.fn(),
          },
          user: {
            findMany: jest.fn().mockResolvedValue([
              { id: 1, adminProfitShare: 1.0 }
            ]),
          },
          adminRevenue: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        }
        return callback(tx)
      })

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('já foi atribuído')
  })

  it('deve aceitar pedido quando updateMany retorna count > 0', async () => {
    ; (verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster1@test.com',
        role: 'BOOSTER',
      },
    })

    const order = {
      id: 1,
      total: 100,
      status: 'PAID',
      boosterId: null,
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
      total: 100,
      status: 'IN_PROGRESS',
      boosterId: 1,
      adminId: 1,
      user: { id: 1, email: 'client@test.com', name: 'Client' },
      service: { id: 1, name: 'Service' },
      booster: { id: 1, email: 'booster1@test.com', name: 'Booster' },
    }

      ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(order)
      ; (prisma.order.findFirst as jest.Mock).mockResolvedValue(null) // Nenhum pedido ativo
      ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(booster)
      ; (prisma.commissionConfig.findFirst as jest.Mock).mockResolvedValue(commissionConfig)

      // Simular transação onde updateMany retorna count: 1 (sucesso)
      ; (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          order: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }), // 1 linha atualizada
            findUnique: jest.fn().mockResolvedValue(updatedOrder),
          },
          boosterCommission: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
          user: {
            findMany: jest.fn().mockResolvedValue([
              { id: 1, adminProfitShare: 1.0 }
            ]),
          },
          adminRevenue: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
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
  })

  it('deve validar status do pedido antes de aceitar', async () => {
    ; (verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster1@test.com',
        role: 'BOOSTER',
      },
    })

    // Pedido já está IN_PROGRESS
    const order = {
      id: 1,
      total: 100,
      status: 'IN_PROGRESS',
      boosterId: null,
    }

      ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(order)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('não está pago')
  })

  it('deve validar se pedido já tem booster atribuído', async () => {
    ; (verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster1@test.com',
        role: 'BOOSTER',
      },
    })

    // Pedido já tem booster atribuído
    const order = {
      id: 1,
      total: 100,
      status: 'PAID',
      boosterId: 2, // Outro booster
    }

      ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(order)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('já foi atribuído')
  })

  it('deve usar comissão personalizada do booster se disponível', async () => {
    ; (verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster1@test.com',
        role: 'BOOSTER',
      },
    })

    const order = {
      id: 1,
      total: 100,
      status: 'PAID',
      boosterId: null,
    }

    // Booster tem comissão personalizada de 75%
    const booster = {
      boosterCommissionPercentage: 0.75,
    }

      ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(order)
      ; (prisma.order.findFirst as jest.Mock).mockResolvedValue(null) // Nenhum pedido ativo
      ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(booster)

      // Simular transação bem-sucedida
      ; (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          order: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({
              ...order,
              boosterId: 1,
              status: 'IN_PROGRESS',
              boosterCommission: 75, // 100 * 0.75
              adminRevenue: 25, // 100 * 0.25
            }),
          },
          boosterCommission: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
          user: {
            findMany: jest.fn().mockResolvedValue([
              { id: 1, adminProfitShare: 1.0 }
            ]),
          },
          adminRevenue: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        }
        return callback(tx)
      })

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '1' }) })

    expect(response.status).toBe(200)

    // Verificar que a transação foi chamada corretamente
    expect(prisma.$transaction).toHaveBeenCalled()

    // Verificar que a comissão personalizada foi usada (verificar se user.findUnique foi chamado com o booster)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { boosterCommissionPercentage: true },
    })
  })
})

