import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { Game } from '@/generated/prisma/client'

/**
 * Helper to check if a new range overlaps with existing ranges
 * Overlap condition: (NewStart <= ExistingEnd) AND (NewEnd >= ExistingStart)
 */
async function checkRangeOverlap(
  game: Game,
  gameMode: string,
  rangeStart: number,
  rangeEnd: number,
  excludeId?: number
): Promise<{ overlaps: boolean; overlappingRange?: { id: number; rangeStart: number; rangeEnd: number } }> {
  const existingRanges = await db.pricingConfig.findMany({
    where: {
      game,
      gameMode,
      enabled: true,
      ...(excludeId ? { id: { not: excludeId } } : {})
    },
    select: { id: true, rangeStart: true, rangeEnd: true }
  })

  for (const existing of existingRanges) {
    // Check overlap: new range overlaps if it starts before existing ends AND ends after existing starts
    if (rangeStart <= existing.rangeEnd && rangeEnd >= existing.rangeStart) {
      return { overlaps: true, overlappingRange: existing }
    }
  }

  return { overlaps: false }
}

/**
 * GET /api/admin/pricing
 * Lista todas as configurações de preços
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const game = searchParams.get('game') as Game | null
    const gameMode = searchParams.get('gameMode')

    const where: any = {}
    if (game) where.game = game
    if (gameMode) where.gameMode = gameMode

    const pricingConfigs = await db.pricingConfig.findMany({
      where,
      orderBy: [
        { game: 'asc' },
        { gameMode: 'asc' },
        { rangeStart: 'asc' }
      ]
    })

    return Response.json({ data: pricingConfigs }, { status: 200 })
  } catch (error) {
    console.error('Error fetching pricing configs:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/pricing
 * Cria uma nova configuração de preço
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { game, gameMode, rangeStart, rangeEnd, price, unit, enabled } = body

    // Validações
    if (!game || !gameMode || rangeStart === undefined || rangeEnd === undefined || !price || !unit) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rangeStart >= rangeEnd) {
      return Response.json({ error: 'rangeStart must be less than rangeEnd' }, { status: 400 })
    }

    if (price <= 0) {
      return Response.json({ error: 'price must be greater than 0' }, { status: 400 })
    }

    // Check for overlapping ranges
    const parsedRangeStart = parseInt(rangeStart)
    const parsedRangeEnd = parseInt(rangeEnd)
    const overlapCheck = await checkRangeOverlap(game, gameMode, parsedRangeStart, parsedRangeEnd)

    if (overlapCheck.overlaps) {
      const existing = overlapCheck.overlappingRange!
      return Response.json({
        error: `Esta faixa sobrepõe uma faixa existente (${existing.rangeStart} - ${existing.rangeEnd}). Ajuste os valores ou desative a faixa existente primeiro.`
      }, { status: 409 })
    }

    const pricingConfig = await db.pricingConfig.create({
      data: {
        game,
        gameMode,
        rangeStart: parseInt(rangeStart),
        rangeEnd: parseInt(rangeEnd),
        price: parseFloat(price),
        unit,
        enabled: enabled !== undefined ? enabled : true
      }
    })

    return Response.json({ data: pricingConfig }, { status: 201 })
  } catch (error) {
    console.error('Error creating pricing config:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
