/**
 * @jest-environment node
 */

import { GET as getPixKeyRoute, PUT as updatePixKeyRoute } from '@/app/api/user/bank-account/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAuth: jest.fn(),
  createAuthErrorResponse: jest.fn(),
}))

import { verifyAuth } from '@/lib/auth-middleware'

describe('/api/user/bank-account', () => {
  let userId: number
  let token: string

  beforeEach(() => {
    userId = 1
    token = 'mock-token'
    
    // Mock verifyAuth para retornar usuário booster
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: userId,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/user/bank-account', () => {
    it('deve retornar a chave PIX do usuário', async () => {
      const mockUser = {
        id: userId,
        pixKey: 'test@email.com',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/user/bank-account', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const response = await getPixKeyRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pixKey).toBe('test@email.com')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          pixKey: true,
        },
      })
    })

    it('deve retornar 404 se usuário não encontrado', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/user/bank-account', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const response = await getPixKeyRoute(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Usuário não encontrado')
    })
  })

  describe('PUT /api/user/bank-account', () => {
    it('deve atualizar a chave PIX do usuário', async () => {
      const mockUpdatedUser = {
        id: userId,
        pixKey: 'new@email.com',
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser)

      const request = new NextRequest('http://localhost/api/user/bank-account', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pixKey: 'new@email.com',
        }),
      })

      const response = await updatePixKeyRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Chave PIX atualizada com sucesso')
      expect(data.pixKey).toBe('new@email.com')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          pixKey: 'new@email.com',
        },
        select: {
          id: true,
          pixKey: true,
        },
      })
    })

    it('deve retornar 400 se chave PIX não for fornecida', async () => {
      const request = new NextRequest('http://localhost/api/user/bank-account', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })

      const response = await updatePixKeyRoute(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Chave PIX é obrigatória')
    })

    it('deve retornar 400 se chave PIX estiver vazia', async () => {
      const request = new NextRequest('http://localhost/api/user/bank-account', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pixKey: '   ',
        }),
      })

      const response = await updatePixKeyRoute(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Chave PIX é obrigatória')
    })
  })
})

