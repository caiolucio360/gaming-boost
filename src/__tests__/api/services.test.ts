/**
 * @jest-environment node
 */

import { GET } from '@/app/api/services/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    service: {
      findMany: jest.fn(),
    },
  },
}))

describe('GET /api/services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar lista de serviços públicos', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'Boost CS2 Premier: 5K → 10K',
        game: 'CS2',
        type: 'RANK_BOOST',
        description: 'Boost de rank',
        price: 59.90,
        duration: '2-4 dias',
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'Boost CS2 Premier: 10K → 15K',
        game: 'CS2',
        type: 'RANK_BOOST',
        description: 'Boost de rank',
        price: 89.90,
        duration: '3-6 dias',
        createdAt: new Date(),
      },
    ]

    ;(prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices)

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.services).toBeDefined()
    expect(data.services).toHaveLength(2)
    expect(data.services[0].name).toBe('Boost CS2 Premier: 5K → 10K')
    // Verificar que não retorna dados sensíveis
    expect(data.services[0]).not.toHaveProperty('_count')
  })

  it('deve filtrar por jogo', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'Boost CS2 Premier: 5K → 10K',
        game: 'CS2',
        type: 'RANK_BOOST',
        description: 'Boost de rank',
        price: 59.90,
        duration: '2-4 dias',
        createdAt: new Date(),
      },
    ]

    ;(prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices)

    const request = new NextRequest('http://localhost:3000/api/services?game=CS2', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          game: 'CS2',
        }),
      })
    )
  })

  it('deve filtrar por tipo de serviço', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'Boost CS2 Premier: 5K → 10K',
        game: 'CS2',
        type: 'RANK_BOOST',
        description: 'Boost de rank',
        price: 59.90,
        duration: '2-4 dias',
        createdAt: new Date(),
      },
    ]

    ;(prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices)

    const request = new NextRequest('http://localhost:3000/api/services?type=RANK_BOOST', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'RANK_BOOST',
        }),
      })
    )
  })

  it('deve retornar array vazio se não houver serviços', async () => {
    ;(prisma.service.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.services).toBeDefined()
    expect(data.services).toHaveLength(0)
  })

  it('deve retornar erro 500 em caso de falha', async () => {
    ;(prisma.service.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toContain('Erro ao buscar serviços')
  })
})

