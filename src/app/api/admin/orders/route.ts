import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (status && ['PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      where.status = status
    }

    const [rawOrders, total] = await Promise.all([
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
          payments: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ])

    // Mapear orders para incluir service virtual baseado nos campos do Order
    const orders = rawOrders.map((order: typeof rawOrders[number]) => ({
      ...order,
      service: {
        id: order.id,
        name: order.gameMode
          ? `${order.game} ${order.gameMode.replace('_', ' ')} Boost`
          : `${order.game} Boost`,
        game: order.game,
        type: order.gameMode || 'BOOST',
      },
    }))

    return NextResponse.json(
      { orders, total, limit, offset },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}

