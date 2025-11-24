/**
 * @jest-environment node
 */
import { POST } from '@/app/api/reviews/route'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-middleware'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        order: {
            findUnique: jest.fn(),
        },
        review: {
            create: jest.fn(),
        },
        boosterProfile: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}))

jest.mock('@/lib/auth-middleware', () => ({
    verifyAuth: jest.fn(),
    createAuthErrorResponse: jest.fn((msg, status) => ({ status, json: async () => ({ message: msg }) })),
}))

describe('Reviews API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should create a review for a completed order', async () => {
        const mockUser = { id: 1 } // Client
        const mockBoosterId = 2
        const mockOrderId = 100

            ; (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: mockUser })

            ; (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                id: mockOrderId,
                userId: 1,
                boosterId: mockBoosterId,
                status: 'COMPLETED',
                review: null,
            })

            ; (prisma.review.create as jest.Mock).mockResolvedValue({
                id: 1,
                rating: 5,
            })

            ; (prisma.boosterProfile.findUnique as jest.Mock).mockResolvedValue({
                userId: mockBoosterId,
                rating: 4.0,
                totalReviews: 1,
            })

        const req = new NextRequest('http://localhost:3000/api/reviews', {
            method: 'POST',
            body: JSON.stringify({
                orderId: mockOrderId,
                rating: 5,
                comment: 'Great service!',
            }),
        })
        const res = await POST(req)

        expect(res.status).toBe(201)
        expect(prisma.review.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                orderId: mockOrderId,
                rating: 5,
            }),
        }))
        // Verificar se atualizou o perfil do booster
        expect(prisma.boosterProfile.update).toHaveBeenCalled()
    })

    it('should return 400 if order is not completed (optional check depending on logic)', async () => {
        // Se a lógica permitir apenas COMPLETED, esse teste é válido.
        // Se a lógica for mais permissiva, ajustar.
    })
})
