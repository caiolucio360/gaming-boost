/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/orders/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

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
  },
}))

// Mock de cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((key: string) => {
      if (key === 'userId') {
        return { value: 'user123' }
      }
      return null
    }),
  })),
}))

describe('GET /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar lista de pedidos do usuário autenticado', async () => {
    const mockOrders = [
      {
        id: 'order1',
        userId: 'user123',
        serviceId: 'service1',
        status: 'PENDING',
        total: 89.90,
        createdAt: new Date(),
        service: {
          id: 'service1',
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
    const { cookies } = require('next/headers')
    cookies.mockReturnValueOnce({
      get: jest.fn(() => null), // Sem userId
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
    const mockService = {
      id: 'service1',
      name: 'Boost CS2 Premier: 10K → 15K',
      price: 89.90,
    }

    const mockOrder = {
      id: 'order1',
      userId: 'user123',
      serviceId: 'service1',
      status: 'PENDING',
        total: 89.90,
      createdAt: new Date(),
      service: mockService,
    }

    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService)
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null) // Não há order ativa existente
    ;(prisma.order.create as jest.Mock).mockResolvedValue(mockOrder)

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: 'service1',
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
    const mockService = {
      id: 'service1',
      name: 'Boost CS2 Premier: 10K → 15K',
      price: 89.90,
      type: 'RANK_BOOST',
    }

    const existingOrder = {
      id: 'existing-order',
      userId: 'user123',
      status: 'PENDING',
      gameMode: 'PREMIER',
    }

    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService)
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(existingOrder) // Já existe order ativa

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: 'service1',
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
    const mockService = {
      id: 'service1',
      name: 'Boost CS2 Premier: 10K → 15K',
      price: 89.90,
      type: 'RANK_BOOST',
    }

    const mockOrder = {
      id: 'order1',
      userId: 'user123',
      serviceId: 'service1',
      status: 'PENDING',
      total: 89.90,
      createdAt: new Date(),
      service: mockService,
    }

    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService)
    ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null) // Não há order ativa (a anterior está COMPLETED)
    ;(prisma.order.create as jest.Mock).mockResolvedValue(mockOrder)

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: 'service1',
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
        serviceId: 'service1',
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
        serviceId: 'servicoinexistente',
        total: 89.90,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })

  it('deve retornar erro 401 se o usuário não estiver autenticado', async () => {
    const { cookies } = require('next/headers')
    cookies.mockReturnValueOnce({
      get: jest.fn(() => null), // Sem userId
    })

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceId: 'service1',
        total: 89.90,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })
})

