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
      const user = authResult.user as any
      const isDevAdmin = user.isDevAdmin === true

      // Admin count: only regular admins (isDevAdmin != true, handles false and null)
      const adminCountWhere = {
        role: 'ADMIN' as const,
        isDevAdmin: { not: true }
      }

      // Total users filter: exclude dev-admin
      const totalUsersWhere = { NOT: { isDevAdmin: true } }

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
        devAdminRevenueResult,
      ] = await Promise.all([
        prisma.user.count({ where: totalUsersWhere }).catch(() => 0),
        prisma.user.count({ where: { role: 'CLIENT' } }).catch(() => 0),
        prisma.user.count({ where: { role: 'BOOSTER' } }).catch(() => 0),
        prisma.user.count({ where: adminCountWhere }).catch(() => 0),
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
        // Calculate Dev-Admin revenue ONLY if user is dev-admin
        isDevAdmin ? prisma.devAdminRevenue.aggregate({
          where: { devAdminId: user.id, status: 'PAID' },
          _sum: { amount: true }
        }).catch(() => ({ _sum: { amount: 0 } })) : Promise.resolve({ _sum: { amount: 0 } }),
      ])

      const totalRevenue = totalRevenueResult._sum?.total ?? 0
      const devRevenue = devAdminRevenueResult._sum?.amount ?? 0

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
          devRevenue: devRevenue || 0, // Include dev revenue in response
        },
        isDevAdmin, // Flag to frontend
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

