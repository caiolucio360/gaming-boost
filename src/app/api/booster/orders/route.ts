import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyBooster, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'

// GET - Listar pedidos disponíveis e atribuídos ao booster
export async function GET(request: NextRequest) {
  try {
    // Verificar se é booster
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || ErrorMessages.AUTH_UNAUTHENTICATED,
        401
      )
    }

    const userId = authResult.user.id

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'available' | 'assigned' | 'completed'
    const status = searchParams.get('status')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    let where: any = {}

    if (type === 'available') {
      // Pedidos disponíveis: PAID e sem booster atribuído
      where = {
        status: 'PAID',
        boosterId: null,
      }
    } else if (type === 'assigned') {
      // Pedidos atribuídos ao booster
      where = {
        boosterId: userId,
        status: 'IN_PROGRESS',
      }
    } else if (type === 'completed') {
      // Pedidos completos do booster
      where = {
        boosterId: userId,
        status: 'COMPLETED',
      }
    } else {
      // Todos os pedidos relacionados ao booster
      where = {
        OR: [
          { boosterId: userId },
          { status: 'PAID', boosterId: null },
        ],
      }
    }

    const validStatuses = ['PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    if (status && validStatuses.includes(status)) {
      where.status = status
    }

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          booster: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          commission: {
            select: {
              id: true,
              amount: true,
              percentage: true,
              status: true,
              paidAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ])

    // Calcular estatísticas
    const stats = {
      available: await prisma.order.count({
        where: {
          status: 'PAID',
          boosterId: null,
          game: 'CS2',
        },
      }),
      assigned: await prisma.order.count({
        where: {
          boosterId: userId,
          status: 'IN_PROGRESS',
          game: 'CS2',
        },
      }),
      completed: await prisma.order.count({
        where: {
          boosterId: userId,
          status: 'COMPLETED',
          game: 'CS2',
        },
      }),
      totalEarnings: await prisma.boosterCommission.aggregate({
        where: {
          boosterId: userId,
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      }),
      pendingEarnings: await prisma.boosterCommission.aggregate({
        where: {
          boosterId: userId,
          status: 'PENDING',
        },
        _sum: {
          amount: true,
        },
      }),
    }

    // Map orders to include constructed service object
    const mappedOrders = orders.map((order: any) => {
      const gameMode = order.gameMode || 'PREMIER'
      const isDuo = order.serviceType === 'DUO_BOOST'
      const typeLabel = isDuo ? 'Duo Boost' : 'Boost'
      const serviceName = gameMode === 'GAMERS_CLUB'
        ? `${typeLabel} Gamers Club ${order.currentRank || ''} → ${order.targetRank || ''}`.trim()
        : `${typeLabel} Premier ${order.currentRating || order.currentRank || ''} → ${order.targetRating || order.targetRank || ''}`.trim()

      return {
        ...order,
        service: {
          name: serviceName || 'Boost CS2',
          game: order.game || 'CS2',
          type: order.gameMode || 'Boost de Rank',
          serviceType: order.serviceType || 'RANK_BOOST',
          description: serviceName
        }
      }
    })

    return NextResponse.json(
      {
        orders: mappedOrders,
        stats: {
          available: stats.available,
          assigned: stats.assigned,
          completed: stats.completed,
          totalEarnings: stats.totalEarnings._sum.amount || 0,
          pendingEarnings: stats.pendingEarnings._sum.amount || 0,
        },
        pagination: { total, limit, offset },
      },
      { status: 200 }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.ORDER_FETCH_FAILED, 'GET /api/booster/orders')
  }
}
