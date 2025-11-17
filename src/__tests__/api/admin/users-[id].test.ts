/**
 * @jest-environment node
 */

import { GET, PUT, DELETE } from '@/app/api/admin/users/[id]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-middleware'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAdmin: jest.fn(),
  createAuthErrorResponse: jest.fn((message: string, status: number) => {
    return new Response(JSON.stringify({ message }), { status })
  }),
}))

describe('GET /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar usuário específico para admin', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })

    const mockUser = {
      id: 1,
      email: 'user1@test.com',
      name: 'User 1',
      role: 'CLIENT',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 5 },
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/admin/users/1', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe(1)
    expect(data.user.email).toBe('user1@test.com')
  })

  it('deve retornar erro 401 se não autenticado', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/users/1', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })

  it('deve retornar erro 403 se não for admin', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Apenas administradores podem acessar esta rota',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/users/1', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('administradores')
  })

  it('deve retornar erro 404 se usuário não existir', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/admin/users/999', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: '999' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })
})

describe('PUT /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve atualizar usuário com sucesso', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })

    const existingUser = {
      id: 1,
      email: 'user1@test.com',
      name: 'User 1',
      role: 'CLIENT',
    }

    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(null) // Verificar se email já existe

    const updatedUser = {
      ...existingUser,
      email: 'updated@test.com',
      name: 'Updated User',
      role: 'BOOSTER',
    }

    ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

    const request = new NextRequest('http://localhost:3000/api/admin/users/1', {
      method: 'PUT',
      body: JSON.stringify({
        email: 'updated@test.com',
        name: 'Updated User',
        role: 'BOOSTER',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('updated@test.com')
    expect(data.user.role).toBe('BOOSTER')
    expect(prisma.user.update).toHaveBeenCalled()
  })

  it('deve retornar erro 404 se usuário não existir', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/admin/users/999', {
      method: 'PUT',
      body: JSON.stringify({
        email: 'updated@test.com',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })
})

describe('DELETE /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve deletar usuário com sucesso', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      email: 'user1@test.com',
      role: 'CLIENT',
    })

    ;(prisma.user.delete as jest.Mock).mockResolvedValue({
      id: 2,
      email: 'user1@test.com',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/users/2', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '2' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('deletado')
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } })
  })

  it('deve retornar erro 404 se usuário não existir', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/admin/users/999', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })
})

