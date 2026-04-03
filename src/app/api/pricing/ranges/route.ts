import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { Game, ServiceType } from '@/generated/prisma/client'

/**
 * GET /api/pricing/ranges
 * Returns available rating/level points for the calculator based on PricingConfig
 * Public endpoint (no auth required) - pricing info is not sensitive
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const game = (searchParams.get('game') || 'CS2') as Game
    const gameMode = searchParams.get('gameMode') || 'PREMIER'
    const rawServiceType = searchParams.get('serviceType')
    const serviceType: ServiceType = rawServiceType === 'DUO_BOOST' ? 'DUO_BOOST' : 'RANK_BOOST'

    const configs = await db.pricingConfig.findMany({
      where: { game, gameMode, serviceType, enabled: true },
      orderBy: { rangeStart: 'asc' },
      select: { rangeStart: true, rangeEnd: true }
    })

    if (configs.length === 0) {
      return Response.json({ data: { points: [], min: 0, max: 0 } }, { status: 200 })
    }

    const min = configs[0].rangeStart
    const max = configs[configs.length - 1].rangeEnd

    let points: number[]

    if (gameMode === 'PREMIER') {
      // Generate 1K increments from first available 1K boundary to max (rounded up to nearest 1K)
      const maxRounded = Math.ceil((max + 1) / 1000) * 1000
      const startPoint = Math.max(1000, Math.ceil(min / 1000) * 1000)
      points = []
      for (let p = startPoint; p <= maxRounded; p += 1000) {
        points.push(p)
      }
    } else if (gameMode === 'GAMERS_CLUB') {
      // Generate level increments from min to max
      const startLevel = Math.max(1, min)
      points = Array.from({ length: max - startLevel + 1 }, (_, i) => startLevel + i)
    } else {
      points = []
    }

    return Response.json({
      data: { points, min, max }
    }, { status: 200 })
  } catch (error) {
    console.error('[API /pricing/ranges] Error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
