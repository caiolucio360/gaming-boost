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

    const where: any = {
      boosterId,
    }

    if (status && ['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      where.status = status
    }

    // Buscar comissões
    const commissions = await prisma.boosterCommission.findMany({
      where,
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                game: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calcular estatísticas
    const stats = {
      totalEarnings: await prisma.boosterCommission.aggregate({
        where: {
          boosterId,
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      }),
      pendingEarnings: await prisma.boosterCommission.aggregate({
        where: {
          boosterId,
          status: 'PENDING',
        },
        _sum: {
          amount: true,
        },
      }),
      totalCommissions: await prisma.boosterCommission.count({
        where: {
          boosterId,
        },
      }),
      paidCommissions: await prisma.boosterCommission.count({
        where: {
          boosterId,
          status: 'PAID',
        },
      }),
      pendingCommissions: await prisma.boosterCommission.count({
        where: {
          boosterId,
          status: 'PENDING',
        },
      }),
    }

    return NextResponse.json(
      {
        commissions,
        stats: {
          totalEarnings: stats.totalEarnings._sum.amount || 0,
          pendingEarnings: stats.pendingEarnings._sum.amount || 0,
          totalCommissions: stats.totalCommissions,
          paidCommissions: stats.paidCommissions,
          pendingCommissions: stats.pendingCommissions,
        },
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

