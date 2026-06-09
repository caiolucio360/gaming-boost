import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma, CommissionStatus } from '@/generated/prisma/client'
import { withApiHandler } from '@/lib/api-handler'
import { HttpStatus } from '@/lib/http-status'

// GET - Listar pagamentos/comissões do booster
export const GET = withApiHandler(
  async ({ request, user }) => {
    const boosterId = user.id

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, PAID, CANCELLED
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const where: Prisma.BoosterCommissionWhereInput = { boosterId }
    if (status && ['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      where.status = status as CommissionStatus
    }

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
              user: { select: { id: true, email: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.boosterCommission.count({ where }),
    ])

    const [totalEarningsAgg, pendingEarningsAgg, totalCommissions, paidCommissions, pendingCommissions] =
      await Promise.all([
        prisma.boosterCommission.aggregate({ where: { boosterId, status: 'PAID' }, _sum: { amount: true } }),
        prisma.boosterCommission.aggregate({ where: { boosterId, status: 'PENDING' }, _sum: { amount: true } }),
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
      { status: HttpStatus.OK }
    )
  },
  { auth: { roles: ['BOOSTER'] }, errorMessage: 'Erro ao buscar pagamentos', endpoint: 'GET /api/booster/payments' }
)
