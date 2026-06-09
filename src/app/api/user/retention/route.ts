// src/app/api/user/retention/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiHandler } from '@/lib/api-handler'
import { HttpStatus } from '@/lib/http-status'
import { getStreakDiscount } from '@/lib/retention-utils'

export const GET = withApiHandler(
  async ({ user }) => {
    const completedOrders = await prisma.order.findMany({
      where: { userId: user.id, status: 'COMPLETED' },
      select: { id: true, targetRating: true, targetRank: true, gameMode: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    })

    const streak = completedOrders.length
    const discountPct = getStreakDiscount(streak)

    const orders = completedOrders.map((o: typeof completedOrders[0]) => ({
      id: o.id,
      targetRating: o.targetRating,
      targetRank: o.targetRank,
      gameMode: o.gameMode,
      completedAt: o.updatedAt,
    }))

    return NextResponse.json({ completedOrders: orders, streak, discountPct }, { status: HttpStatus.OK })
  },
  { auth: true, errorMessage: 'Erro ao buscar dados de retenção', endpoint: 'GET /api/user/retention' }
)
