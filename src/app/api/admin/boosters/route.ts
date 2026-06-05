/**
 * GET /api/admin/boosters
 * List all booster applications for admin review
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyAdmin(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponseFromResult(authResult)
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        // Build filter
        const where: Record<string, unknown> = {}
        if (status && ['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
            where.verificationStatus = status
        }

        const applications = await prisma.boosterProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        // Count by status for dashboard
        const counts = await prisma.boosterProfile.groupBy({
            by: ['verificationStatus'],
            _count: { _all: true },
        })

        const statusCounts: Record<string, number> = {
            PENDING: 0,
            VERIFIED: 0,
            REJECTED: 0,
        }

        counts.forEach((c: { verificationStatus: string | null; _count: { _all: number } }) => {
            const status = c.verificationStatus
            if (status && status in statusCounts) {
                statusCounts[status] = c._count._all
            }
        })

        return NextResponse.json({
            applications,
            counts: statusCounts,
            total: applications.length,
        })
    } catch (error) {
        console.error('Error fetching booster applications:', error)
        return NextResponse.json(
            { message: 'Erro ao buscar aplicações' },
            { status: 500 }
        )
    }
}
