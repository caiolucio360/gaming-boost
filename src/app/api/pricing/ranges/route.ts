import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { Game, ServiceType } from '@/generated/prisma/client'
import { HttpStatus } from '@/lib/http-status'

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
    let serviceType: ServiceType
    if (rawServiceType === 'DUO_BOOST') serviceType = 'DUO_BOOST'
    else if (rawServiceType === 'COACHING') serviceType = 'COACHING'
    else serviceType = 'RANK_BOOST'

    const configs = await prisma.pricingConfig.findMany({
      where: { game, gameMode, serviceType, enabled: true },
      orderBy: { rangeStart: 'asc' },
      select: { rangeStart: true, rangeEnd: true }
    })

    if (configs.length === 0) {
      return Response.json({ data: { points: [], min: 0, max: 0 } }, { status: HttpStatus.OK })
    }

    const min = configs[0].rangeStart
    const max = configs[configs.length - 1].rangeEnd

    let points: number[]

    if (serviceType === 'COACHING') {
      // Generate hour increments from rangeStart to rangeEnd
      const hours: number[] = []
      for (let h = min; h <= max; h++) {
        hours.push(h)
      }
      return Response.json({
        data: { hours, min, max }
      }, { status: HttpStatus.OK })
    } else if (gameMode === 'PREMIER') {
      // Generate 1K increments from first available 1K boundary to max
      const maxRounded = Math.floor(max / 1000) * 1000
      const startPoint = Math.max(1000, Math.ceil(min / 1000) * 1000)
      points = []
      for (let p = startPoint; p <= maxRounded; p += 1000) {
        points.push(p)
      }
    } else {
      points = []
    }

    return Response.json({
      data: { points, min, max }
    }, { status: HttpStatus.OK })
  } catch (error) {
    console.error('[API /pricing/ranges] Error:', error)
    return Response.json({ message: 'Erro interno do servidor' }, { status: HttpStatus.INTERNAL_SERVER_ERROR })
  }
}
