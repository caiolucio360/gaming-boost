/**
 * @jest-environment node
 */

import { GET, PUT, DELETE } from '@/app/api/admin/users/[id]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

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

describe('GET /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar usuário específico para admin', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    const mockUser = {
      id: 'user1',
      email: 'user1@test.com',
      name: 'User 1',
      role: 'CLIENT',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 5 },
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'admin123',
      role: 'ADMIN',
    }).mockResolvedValueOnce(mockUser)

    const request = new NextRequest('http://localhost:3000/api/admin/users/user1', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'user1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe('user1')
    expect(data.user.email).toBe('user1@test.com')
  })

  it('deve retornar erro 401 se não autenticado', async () => {
    const { cookies } = require('next/headers')
    cookies.mockReturnValueOnce({
      get: jest.fn(() => null),
    })

    const request = new NextRequest('http://localhost:3000/api/admin/users/user1', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'user1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })

  it('deve retornar erro 403 se não for admin', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user123',
      role: 'CLIENT',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/users/user1', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'user1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('administradores')
  })

  it('deve retornar erro 404 se usuário não existir', async () => {
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'admin123', role: 'ADMIN' })
      .mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/admin/users/userinexistente', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'userinexistente' }) })
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
    const existingUser = {
      id: 'user1',
      email: 'user1@test.com',
      name: 'User 1',
      role: 'CLIENT',
    }

    // Primeiro check de admin
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'admin123', role: 'ADMIN' })
      // Segundo check para verificar se usuário existe
      .mockResolvedValueOnce(existingUser)
      // Terceiro check para verificar se email já existe (caso seja necessário)
      .mockResolvedValueOnce(null)

    const updatedUser = {
      ...existingUser,
      email: 'updated@test.com',
      name: 'Updated User',
      role: 'BOOSTER',
    }

    ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

    const request = new NextRequest('http://localhost:3000/api/admin/users/user1', {
      method: 'PUT',
      body: JSON.stringify({
        email: 'updated@test.com',
        name: 'Updated User',
        role: 'BOOSTER',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: 'user1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('updated@test.com')
    expect(data.user.role).toBe('BOOSTER')
    expect(prisma.user.update).toHaveBeenCalled()
  })

  it('deve retornar erro 404 se usuário não existir', async () => {
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'admin123', role: 'ADMIN' })
      .mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/admin/users/userinexistente', {
      method: 'PUT',
      body: JSON.stringify({
        email: 'updated@test.com',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: 'userinexistente' }) })
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
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'admin123', role: 'ADMIN' })
      .mockResolvedValueOnce({ id: 'user1', email: 'user1@test.com', role: 'CLIENT' })

    ;(prisma.user.delete as jest.Mock).mockResolvedValue({
      id: 'user1',
      email: 'user1@test.com',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/users/user1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'user1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('deletado')
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user1' } })
  })

  it('deve retornar erro 404 se usuário não existir', async () => {
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'admin123', role: 'ADMIN' })
      .mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/admin/users/userinexistente', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'userinexistente' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })
})

