/**
 * @jest-environment node
 */

import { GET, PUT } from '@/app/api/orders/[id]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import * as authMiddleware from '@/lib/auth-middleware'

// Mock prisma
jest.mock('@/lib/db', () => ({
    prisma: {
        order: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        payment: {
            updateMany: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback({
            order: { update: jest.fn().mockResolvedValue({ id: 1, status: 'CANCELLED' }) },
            payment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        })),
    },
}))

// Mock auth middleware
jest.mock('@/lib/auth-middleware', () => ({
    verifyAuth: jest.fn(),
    createAuthErrorResponse: jest.fn().mockImplementation((msg, status) => {
        const { NextResponse } = require('next/server')
        return NextResponse.json({ message: msg }, { status })
    }),
}))

describe('GET /api/orders/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('deve retornar 401 se não autenticado', async () => {
        ; (authMiddleware.verifyAuth as jest.Mock).mockResolvedValue({
            authenticated: false,
            error: 'Não autenticado',
        })

        const request = new NextRequest('http://localhost/api/orders/1')
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) })

        expect(response.status).toBe(401)
    })

    it('deve retornar 400 para ID inválido', async () => {
        ; (authMiddleware.verifyAuth as jest.Mock).mockResolvedValue({
            authenticated: true,
            user: { id: 1 },
        })

        const request = new NextRequest('http://localhost/api/orders/abc')
        const response = await GET(request, { params: Promise.resolve({ id: 'abc' }) })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.message).toContain('inválido')
    })

    it('deve retornar 404 se pedido não encontrado', async () => {
        ; (authMiddleware.verifyAuth as jest.Mock).mockResolvedValue({
            authenticated: true,
            user: { id: 1 },
        })
            ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/orders/999')
        const response = await GET(request, { params: Promise.resolve({ id: '999' }) })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.message).toContain('não encontrado')
    })

    it('deve retornar 403 se pedido pertence a outro usuário', async () => {
        ; (authMiddleware.verifyAuth as jest.Mock).mockResolvedValue({
            authenticated: true,
            user: { id: 1 },
        })
            ; (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                id: 1,
                userId: 2, // Different user
                status: 'PENDING',
            })

        const request = new NextRequest('http://localhost/api/orders/1')
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.message).toContain('negado')
    })

    it('deve retornar pedido com sucesso', async () => {
        const mockOrder = {
            id: 1,
            userId: 1,
            status: 'PENDING',
            service: { id: 1, name: 'Boost' },
        }

            ; (authMiddleware.verifyAuth as jest.Mock).mockResolvedValue({
                authenticated: true,
                user: { id: 1 },
            })
            ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

        const request = new NextRequest('http://localhost/api/orders/1')
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.order).toEqual(mockOrder)
    })
})

describe('PUT /api/orders/[id] - Cancelar pedido', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('deve retornar 400 se pedido não está PENDING', async () => {
        ; (authMiddleware.verifyAuth as jest.Mock).mockResolvedValue({
            authenticated: true,
            user: { id: 1 },
        })
            ; (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                id: 1,
                userId: 1,
                status: 'IN_PROGRESS', // Cannot cancel
            })

        const request = new NextRequest('http://localhost/api/orders/1', {
            method: 'PUT',
        })
        const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.message).toContain('IN_PROGRESS')
    })

    it('deve cancelar pedido PENDING com sucesso', async () => {
        ; (authMiddleware.verifyAuth as jest.Mock).mockResolvedValue({
            authenticated: true,
            user: { id: 1 },
        })
            ; (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                id: 1,
                userId: 1,
                status: 'PENDING',
            })

        const request = new NextRequest('http://localhost/api/orders/1', {
            method: 'PUT',
        })
        const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toContain('cancelado')
    })
})
