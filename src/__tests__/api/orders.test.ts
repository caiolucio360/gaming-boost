/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/orders/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-middleware'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    commissionConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    adminRevenue: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAuth: jest.fn(),
  verifyRole: jest.fn(),
  verifyAdmin: jest.fn(),
  verifyBooster: jest.fn(),
  createAuthErrorResponse: jest.fn((message, status) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json({ message }, { status })
  }),
}))

describe('GET /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar lista de pedidos do usuário autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    const mockOrders = [
      {
        id: 1,
        userId: 1,
        serviceId: 1,
        status: 'PENDING',
        total: 89.90,
        createdAt: new Date(),
        service: {
          id: 1,
          name: 'Boost CS2 Premier: 10K → 15K',
          game: 'CS2',
        },
      },
    ]

    ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.orders).toBeDefined()
    expect(data.orders).toHaveLength(1)
    expect(data.orders[0].status).toBe('PENDING')
  })

  it('deve retornar erro 401 se o usuário não estiver autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'GET',
      headers: {},
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
    expect(prisma.order.findMany).not.toHaveBeenCalled()
  })
})

describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve criar um novo pedido com sucesso', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    const mockService = {
      id: 1,
      name: 'Boost CS2 Premier: 10K → 15K',
      price: 89.90,
    }

    const mockOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'PENDING',
        total: 89.90,
      createdAt: new Date(),
      service: mockService,
    }

    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService)
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null) // Não há order ativa existente
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'admin@test.com',
      role: 'ADMIN',
      active: true,
    })
    ;(prisma.commissionConfig.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      boosterPercentage: 0.70,
      adminPercentage: 0.30,
      enabled: true,
    })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        order: {
          create: jest.fn().mockResolvedValue(mockOrder),
        },
        adminRevenue: {
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
      }
      return await callback(tx)
    })

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: 1,
        total: 89.90,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.order).toBeDefined()
    expect(data.order.status).toBe('PENDING')
    expect(data.order.total).toBe(89.90)
  })

  it('deve retornar erro 400 se já existir um pedido ativo (PENDING ou IN_PROGRESS) para a mesma modalidade', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    const mockService = {
      id: 1,
      name: 'Boost CS2 Premier: 10K → 15K',
      price: 89.90,
      type: 'RANK_BOOST',
    }

    const existingOrder = {
      id: 2,
      userId: 1,
      status: 'PENDING',
      gameMode: 'PREMIER',
    }

    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService)
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(existingOrder) // Já existe order ativa

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: 1,
        total: 89.90,
        gameMode: 'PREMIER',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('já possui um boost de rank Premier')
    expect(prisma.order.create).not.toHaveBeenCalled()
  })

  it('deve permitir criar novo pedido se o anterior for COMPLETED', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    const mockService = {
      id: 1,
      name: 'Boost CS2 Premier: 10K → 15K',
      price: 89.90,
      type: 'RANK_BOOST',
    }

    const mockOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'PENDING',
      total: 89.90,
      createdAt: new Date(),
      service: mockService,
    }

    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService)
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null) // Não há order ativa (a anterior está COMPLETED)
    ;(prisma.commissionConfig.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      boosterPercentage: 0.70,
      adminPercentage: 0.30,
      enabled: true,
    })
    ;(prisma.adminRevenue.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(prisma.order.create as jest.Mock).mockResolvedValue(mockOrder)

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: 1,
        total: 89.90,
        gameMode: 'PREMIER',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.order).toBeDefined()
  })

  it('deve retornar erro 400 se serviceId ou total estiver faltando', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceId: 1,
        // total faltando
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('obrigatórios')
  })

  it('deve retornar erro 404 se o serviço não existir', async () => {
    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceId: 999,
        total: 89.90,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })

  it('deve retornar erro 401 se o usuário não estiver autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceId: 1,
        total: 89.90,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })
})

