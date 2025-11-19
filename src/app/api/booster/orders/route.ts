import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyBooster, createAuthErrorResponse } from '@/lib/auth-middleware'

// GET - Listar pedidos disponíveis e atribuídos ao booster
export async function GET(request: NextRequest) {
  try {
    // Verificar se é booster
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'available' | 'assigned' | 'completed'
    const status = searchParams.get('status')

    let where: any = {}

    if (type === 'available') {
      // Pedidos disponíveis: PENDING e sem booster atribuído
      where = {
        status: 'PENDING',
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
          { boosterId: userId }, // Pedidos atribuídos
          { status: 'PENDING', boosterId: null }, // Pedidos disponíveis
        ],
      }
    }

    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        service: true,
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
    })

    // Calcular estatísticas
    const stats = {
      available: await prisma.order.count({
        where: {
          status: 'PENDING',
          boosterId: null,
          service: {
            game: 'CS2',
          },
        },
      }),
      assigned: await prisma.order.count({
        where: {
          boosterId: userId,
          status: 'IN_PROGRESS',
          service: {
            game: 'CS2',
          },
        },
      }),
      completed: await prisma.order.count({
        where: {
          boosterId: userId,
          status: 'COMPLETED',
          service: {
            game: 'CS2',
          },
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

    return NextResponse.json(
      {
        orders,
        stats: {
          available: stats.available,
          assigned: stats.assigned,
          completed: stats.completed,
          totalEarnings: stats.totalEarnings._sum.amount || 0,
          pendingEarnings: stats.pendingEarnings._sum.amount || 0,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao buscar pedidos do booster:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}

