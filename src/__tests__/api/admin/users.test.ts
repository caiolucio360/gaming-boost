/**
 * @jest-environment node
 */

import { GET } from '@/app/api/admin/users/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar lista de usuários para admin', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    const mockUsers = [
      {
        id: 'user1',
        email: 'user1@test.com',
        name: 'User 1',
        role: 'CLIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { orders: 5 },
      },
      {
        id: 'user2',
        email: 'user2@test.com',
        name: 'User 2',
        role: 'BOOSTER',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { orders: 0 },
      },
    ]

    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.users).toBeDefined()
    expect(data.users).toHaveLength(2)
    expect(data.users[0].email).toBe('user1@test.com')
  })

  it('deve filtrar por role', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    const mockUsers = [
      {
        id: 'user1',
        email: 'user1@test.com',
        name: 'User 1',
        role: 'CLIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { orders: 5 },
      },
    ]

    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/users?role=CLIENT',
      {
        method: 'GET',
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'CLIENT',
        }),
      })
    )
  })

  it('deve retornar erro 401 se não autenticado', async () => {
    const { cookies } = require('next/headers')
    cookies.mockReturnValueOnce({
      get: jest.fn(() => null),
    })

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
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

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('administradores')
  })
})

