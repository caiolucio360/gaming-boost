import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponse } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
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
        totalServices,
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
        prisma.service.count().catch(() => 0),
        prisma.order.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { total: true },
        }).catch(() => ({ _sum: { total: null } })),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: {
            service: {
              game: 'CS2', // Filtrar apenas orders com games válidos
            },
          },
          include: {
            user: { select: { email: true, name: true } },
            service: { select: { name: true, game: true } },
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
        services: {
          total: totalServices,
        },
        revenue: {
          total: totalRevenue || 0,
        },
        recentOrders: recentOrders.map((order) => {
          // Garantir que createdAt seja uma string ISO
          let createdAtStr: string
          if (order.createdAt instanceof Date) {
            createdAtStr = order.createdAt.toISOString()
          } else if (typeof order.createdAt === 'string') {
            createdAtStr = order.createdAt
          } else {
            createdAtStr = new Date().toISOString()
          }

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
              name: order.service?.name || 'Serviço não encontrado',
              game: order.service?.game || 'CS2',
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
    console.error('Erro ao buscar estatísticas:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Detalhes do erro:', { message: errorMessage, stack: errorStack })
    return NextResponse.json(
      { 
        message: 'Erro ao buscar estatísticas',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

