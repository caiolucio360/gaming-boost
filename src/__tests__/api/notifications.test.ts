/**
 * @jest-environment node
 */
import { GET, PATCH } from '@/app/api/notifications/route'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-middleware'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        notification: {
            findMany: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
            update: jest.fn(),
        },
    },
}))

jest.mock('@/lib/auth-middleware', () => ({
    verifyAuth: jest.fn(),
    createAuthErrorResponse: jest.fn((msg, status) => ({ status, json: async () => ({ message: msg }) })),
}))

describe('Notifications API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET', () => {
        it('should return notifications for authenticated user', async () => {
            const mockUser = { id: 1, role: 'CLIENT' }
                ; (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: mockUser })

            const mockNotifications = [
                { id: 1, title: 'Test', read: false },
                { id: 2, title: 'Test 2', read: true },
            ]

                ; (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications)
                ; (prisma.notification.count as jest.Mock).mockResolvedValue(2)

            const req = new NextRequest('http://localhost:3000/api/notifications')
            const res = await GET(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.notifications).toHaveLength(2)
            expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId: 1 },
            }))
        })

        it('should return 401 if not authenticated', async () => {
            ; (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: false })

            const req = new NextRequest('http://localhost:3000/api/notifications')
            const res = await GET(req)

            expect(res.status).toBe(401)
        })
    })

    describe('PATCH', () => {
        it('should mark all notifications as read', async () => {
            const mockUser = { id: 1 }
                ; (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: mockUser })
                ; (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

            const req = new NextRequest('http://localhost:3000/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ markAllRead: true }),
            })
            const res = await PATCH(req)

            expect(res.status).toBe(200)
            expect(prisma.notification.updateMany).toHaveBeenCalledWith({
                where: { userId: 1, read: false },
                data: { read: true },
            })
        })
    })
})
