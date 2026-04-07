// src/app/api/user/retention/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createApiErrorResponse } from '@/lib/api-errors'
import { getStreakDiscount } from '@/lib/retention-utils'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult.error || 'Não autenticado', 401)
    }

    const userId = authResult.user.id

    const completedOrders = await prisma.order.findMany({
      where: { userId, status: 'COMPLETED' },
      select: {
        id: true,
        targetRating: true,
        targetRank: true,
        gameMode: true,
        updatedAt: true,
      },
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

    return NextResponse.json({ completedOrders: orders, streak, discountPct }, { status: 200 })
  } catch (error) {
    return createApiErrorResponse(error, 'Erro ao buscar dados de retenção', 'GET /api/user/retention')
  }
}
