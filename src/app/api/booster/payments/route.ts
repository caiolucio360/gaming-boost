import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyBooster, createAuthErrorResponse } from '@/lib/auth-middleware'

// GET - Listar pagamentos/comissões do booster
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const boosterId = authResult.user.id

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, PAID, CANCELLED
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const where: any = {
      boosterId,
    }

    if (status && ['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      where.status = status
    }

    // Buscar comissões
    const [commissions, total] = await prisma.$transaction([
      prisma.boosterCommission.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              status: true,
              serviceType: true,
              gameMode: true,
              currentRating: true,
              targetRating: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.boosterCommission.count({ where }),
    ])

    // Calcular estatísticas
    const [
      totalEarningsAgg,
      pendingEarningsAgg,
      totalCommissions,
      paidCommissions,
      pendingCommissions,
    ] = await Promise.all([
      prisma.boosterCommission.aggregate({
        where: { boosterId, status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.boosterCommission.aggregate({
        where: { boosterId, status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.boosterCommission.count({ where: { boosterId } }),
      prisma.boosterCommission.count({ where: { boosterId, status: 'PAID' } }),
      prisma.boosterCommission.count({ where: { boosterId, status: 'PENDING' } }),
    ])

    return NextResponse.json(
      {
        commissions,
        stats: {
          totalEarnings: totalEarningsAgg._sum.amount || 0,
          pendingEarnings: pendingEarningsAgg._sum.amount || 0,
          totalCommissions,
          paidCommissions,
          pendingCommissions,
        },
        pagination: { total, limit, offset },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao buscar pagamentos do booster:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pagamentos' },
      { status: 500 }
    )
  }
}

