/**
 * @jest-environment node
 */

import { GET } from '@/app/api/auth/me/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-middleware'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAuth: jest.fn(),
  verifyRole: jest.fn(),
  verifyAdmin: jest.fn(),
  createAuthErrorResponse: jest.fn((message, status) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json({ message }, { status })
  }),
}))

// Mock do JWT
jest.mock('@/lib/jwt', () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  decodeToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
}))

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar dados do usuário autenticado', async () => {
    const mockUser = {
      id: 1,
      email: 'teste@teste.com',
      name: 'Teste',
      role: 'CLIENT',
      phone: null,
      active: true,
      createdAt: new Date(),
    }

    // Mock do verifyAuth retornando autenticação válida (agora é async)
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer mock-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('teste@teste.com')
    expect(data.user.role).toBe('CLIENT')
    expect(data.user.id).toBe(1)
    expect(data.user.active).toBe(true)
    // A senha não é retornada pois não está no select
    expect(data.user).not.toHaveProperty('password')
    expect(verifyAuth).toHaveBeenCalled()
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
      },
    })
  })

  it('deve retornar erro 401 se o usuário não estiver autenticado', async () => {
    // Mock do verifyAuth retornando não autenticado (agora é async)
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
    expect(verifyAuth).toHaveBeenCalled()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('deve retornar erro 404 se o usuário não for encontrado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer mock-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })

  it('deve retornar erro 403 se a conta estiver desativada', async () => {
    const mockUser = {
      id: 1,
      email: 'teste@teste.com',
      name: 'Teste',
      role: 'CLIENT',
      active: false, // Conta desativada
    }

    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer mock-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('desativada')
  })
})

