/**
 * @jest-environment node
 */

import { GET } from '@/app/api/auth/me/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock de cookies do Next.js
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

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar dados do usuário autenticado', async () => {
    const mockUser = {
      id: 'user123',
      email: 'teste@teste.com',
      name: 'Teste',
      role: 'CLIENT',
      // Não incluir password, pois o select não inclui
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('teste@teste.com')
    expect(data.user.role).toBe('CLIENT')
    expect(data.user.id).toBe('user123')
    // A senha não é retornada pois não está no select
    expect(data.user).not.toHaveProperty('password')
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user123' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })
  })

  it('deve retornar erro 401 se o usuário não estiver autenticado', async () => {
    const { cookies } = require('next/headers')
    cookies.mockReturnValueOnce({
      get: jest.fn(() => null), // Sem userId
    })

    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('deve retornar erro 404 se o usuário não for encontrado', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })
})

