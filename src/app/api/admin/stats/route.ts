import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    // Estatísticas gerais - executar queries de forma mais segura
    try {
      const [
        totalUsers,
        totalClients,
        totalBoosters,
        totalAdmins,
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        cancelledOrders,
        totalRevenueResult,
        recentOrders,
      ] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.user.count({ where: { role: 'CLIENT' } }).catch(() => 0),
        prisma.user.count({ where: { role: 'BOOSTER' } }).catch(() => 0),
        prisma.user.count({ where: { role: 'ADMIN' } }).catch(() => 0),
        prisma.order.count().catch(() => 0),
        prisma.order.count({ where: { status: 'PENDING' } }).catch(() => 0),
        prisma.order.count({ where: { status: 'IN_PROGRESS' } }).catch(() => 0),
        prisma.order.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
        prisma.order.count({ where: { status: 'CANCELLED' } }).catch(() => 0),
        prisma.order.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { total: true },
        }).catch(() => ({ _sum: { total: null } })),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { email: true, name: true } },
          },
        }).catch(() => []),
      ])

      const totalRevenue = totalRevenueResult._sum?.total ?? 0

      const stats = {
        users: {
          total: totalUsers,
          clients: totalClients,
          boosters: totalBoosters,
          admins: totalAdmins,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          inProgress: inProgressOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },
        revenue: {
          total: totalRevenue || 0,
        },
        recentOrders: recentOrders.map((order: any) => {
          // Garantir que createdAt seja uma string ISO
          let createdAtStr: string
          if (order.createdAt instanceof Date) {
            createdAtStr = order.createdAt.toISOString()
          } else if (typeof order.createdAt === 'string') {
            createdAtStr = order.createdAt
          } else {
            createdAtStr = new Date().toISOString()
          }

          // Build service name from order metadata
          const gameMode = order.gameMode || 'PREMIER'
          const serviceName = gameMode === 'GAMERS_CLUB'
            ? `Boost Gamers Club ${order.currentRank || ''} → ${order.targetRank || ''}`.trim()
            : `Boost Premier ${order.currentRating || order.currentRank || ''} → ${order.targetRating || order.targetRank || ''}`.trim()

          return {
            id: order.id,
            status: order.status,
            total: order.total || 0,
            createdAt: createdAtStr,
            user: {
              email: order.user?.email || '',
              name: order.user?.name || null,
            },
            service: {
              name: serviceName || 'Boost CS2',
              game: order.game || 'CS2',
            },
          }
        }),
      }

      return NextResponse.json({ stats }, { status: 200 })
    } catch (queryError) {
      console.error('Erro ao executar queries:', queryError)
      throw queryError // Re-lança para ser capturado pelo catch externo
    }
  } catch (error) {
    if (error instanceof Error) {
      const errorStack = error.stack
      console.error('Detalhes do erro:', { message: error.message, stack: errorStack })
    }
    return createApiErrorResponse(error, ErrorMessages.ADMIN_STATS_FAILED, 'GET /api/admin/stats')
  }
}

