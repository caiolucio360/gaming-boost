/**
 * @jest-environment node
 */

import { GET } from '@/app/api/admin/users/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-middleware'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAdmin: jest.fn(),
  createAuthErrorResponse: jest.fn((message: string, status: number) => {
    return new Response(JSON.stringify({ message }), { status })
  }),
  createAuthErrorResponseFromResult: jest.fn((authResult: any) => {
    const isPermissionError = authResult.error?.includes('Acesso negado') || 
                             authResult.error?.includes('Permissão') ||
                             authResult.error?.includes('insuficiente') ||
                             authResult.error?.includes('administradores')
    const status = isPermissionError ? 403 : 401
    return new Response(JSON.stringify({ message: authResult.error || 'Não autenticado' }), { status })
  }),
}))

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar lista de usuários para admin', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })

    const mockUsers = [
      {
        id: 1,
        email: 'user1@test.com',
        name: 'User 1',
        role: 'CLIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { orders: 5 },
      },
      {
        id: 2,
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
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })

    const mockUsers = [
      {
        id: 1,
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
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
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
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Acesso negado. Permissão insuficiente.',
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 123,
      role: 'CLIENT',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('Acesso negado')
  })
})

