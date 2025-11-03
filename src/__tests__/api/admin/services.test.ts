/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/admin/services/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

// Mock de cookies do Next.js
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((key: string) => {
      if (key === 'userId') {
        return { value: 'admin123' }
      }
      return null
    }),
  })),
}))

describe('GET /api/admin/services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar lista de serviços para admin', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    const mockServices = [
      {
        id: 'service1',
        name: 'Boost CS2 Premier: 10K → 15K',
        game: 'CS2',
        type: 'RANK_BOOST',
        description: 'Boost de rank',
        price: 100,
        duration: '2-5 dias',
      },
      {
        id: 'service2',
        name: 'Boost CS2 Premier: 15K → 20K',
        game: 'CS2',
        type: 'RANK_BOOST',
        description: 'Boost de rank',
        price: 150,
        duration: '3-6 dias',
      },
    ]

    ;(prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices)

    const request = new NextRequest('http://localhost:3000/api/admin/services', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.services).toBeDefined()
    expect(data.services).toHaveLength(2)
    expect(data.services[0].name).toBe('Boost CS2 Premier: 10K → 15K')
  })

  it('deve retornar erro 401 se não autenticado', async () => {
    const { cookies } = require('next/headers')
    cookies.mockReturnValueOnce({
      get: jest.fn(() => null),
    })

    const request = new NextRequest('http://localhost:3000/api/admin/services', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })

  it('deve retornar erro 403 se não for admin', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user123',
      role: 'CLIENT',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/services', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('administradores')
  })
})

describe('POST /api/admin/services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve criar serviço com sucesso', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    const newService = {
      id: 'service3',
      name: 'Boost CS2 Premier: 20K → 25K',
      game: 'CS2',
      type: 'RANK_BOOST',
      description: 'Boost de rank',
      price: 200,
      duration: '4-7 dias',
    }

    ;(prisma.service.create as jest.Mock).mockResolvedValue(newService)

    const request = new NextRequest('http://localhost:3000/api/admin/services', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Boost CS2 Premier: 20K → 25K',
        game: 'CS2',
        type: 'RANK_BOOST',
        description: 'Boost de rank',
        price: 200,
        duration: '4-7 dias',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.service).toBeDefined()
    expect(data.service.name).toBe('Boost CS2 Premier: 20K → 25K')
    expect(data.service.price).toBe(200)
  })

  it('deve retornar erro 400 se campos obrigatórios faltarem', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/services', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Boost CS2',
        // campos obrigatórios faltando (game, type, etc)
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    // A API pode retornar erro sobre jogo inválido se game não for fornecido
    expect(data.message).toBeDefined()
  })
})

