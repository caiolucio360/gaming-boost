/**
 * @jest-environment node
 */
import { POST } from '@/app/api/booster/apply/route'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-middleware'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        boosterProfile: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}))

jest.mock('@/lib/auth-middleware', () => ({
    verifyAuth: jest.fn(),
    createAuthErrorResponse: jest.fn((msg, status) => ({ status, json: async () => ({ message: msg }) })),
}))

describe('Booster Apply API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should create a booster profile application', async () => {
        const mockUser = { id: 1 }
            ; (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: mockUser })
            ; (prisma.boosterProfile.findUnique as jest.Mock).mockResolvedValue(null)
            ; (prisma.boosterProfile.create as jest.Mock).mockResolvedValue({
                id: 1,
                userId: 1,
                bio: 'Test Bio',
                verificationStatus: 'PENDING',
            })

        const req = new NextRequest('http://localhost:3000/api/booster/apply', {
            method: 'POST',
            body: JSON.stringify({
                bio: 'I am a pro player with 10 years experience',
                languages: ['pt-BR'],
                portfolioUrl: 'https://example.com',
            }),
        })
        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(201)
        expect(prisma.boosterProfile.create).toHaveBeenCalled()
        expect(data.profile.verificationStatus).toBe('PENDING')
    })

    it('should return 400 if user already has a profile', async () => {
        const mockUser = { id: 1 }
            ; (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: mockUser })
            ; (prisma.boosterProfile.findUnique as jest.Mock).mockResolvedValue({ id: 1 })

        const req = new NextRequest('http://localhost:3000/api/booster/apply', {
            method: 'POST',
            body: JSON.stringify({ bio: 'Test' }),
        })
        const res = await POST(req)

        expect(res.status).toBe(400)
    })
})
