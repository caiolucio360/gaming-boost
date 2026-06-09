import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Game, ServiceType, Prisma } from '@/generated/prisma/client'
import { withApiHandler } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { HttpStatus } from '@/lib/http-status'

/**
 * Helper to check if a new range overlaps with existing ranges
 * Overlap condition: (NewStart <= ExistingEnd) AND (NewEnd >= ExistingStart)
 */
async function checkRangeOverlap(
  game: Game,
  gameMode: string,
  rangeStart: number,
  rangeEnd: number,
  excludeId?: number,
  serviceType: ServiceType = 'RANK_BOOST'
): Promise<{ overlaps: boolean; overlappingRange?: { id: number; rangeStart: number; rangeEnd: number } }> {
  const existingRanges = await prisma.pricingConfig.findMany({
    where: {
      game,
      gameMode,
      serviceType,
      enabled: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, rangeStart: true, rangeEnd: true },
  })

  for (const existing of existingRanges) {
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
export const GET = withApiHandler(
  async ({ request }) => {
    const { searchParams } = new URL(request.url)
    const game = searchParams.get('game') as Game | null
    const gameMode = searchParams.get('gameMode')
    const serviceType = searchParams.get('serviceType') as ServiceType | null

    const where: Prisma.PricingConfigWhereInput = {}
    if (game) where.game = game
    if (gameMode) where.gameMode = gameMode
    if (serviceType) where.serviceType = serviceType

    const pricingConfigs = await prisma.pricingConfig.findMany({
      where,
      orderBy: [{ game: 'asc' }, { gameMode: 'asc' }, { rangeStart: 'asc' }],
    })

    return NextResponse.json({ data: pricingConfigs }, { status: HttpStatus.OK })
  },
  { auth: { roles: ['ADMIN'] }, errorMessage: ErrorMessages.GENERIC_ERROR, endpoint: 'GET /api/admin/pricing' }
)

/**
 * POST /api/admin/pricing
 * Cria uma nova configuração de preço
 */
export const POST = withApiHandler(
  async ({ request }) => {
    const body = await request.json()
    const { game, gameMode, serviceType: bodyServiceType, rangeStart, rangeEnd, price, enabled } = body
    const svcType: ServiceType = ['DUO_BOOST', 'COACHING'].includes(bodyServiceType as string)
      ? (bodyServiceType as ServiceType)
      : 'RANK_BOOST'

    if (!game || !gameMode || rangeStart === undefined || rangeEnd === undefined || !price) {
      return NextResponse.json(
        { message: 'Preencha todos os campos (Início da faixa, Fim da faixa e Preço)' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    if (rangeStart >= rangeEnd) {
      return NextResponse.json(
        { message: 'O valor final da faixa deve ser maior que o valor inicial. Ex: Inicial 0, Final 4999.' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    if (price <= 0) {
      return NextResponse.json({ message: 'O preço configurado deve ser maior que zero' }, { status: HttpStatus.BAD_REQUEST })
    }

    // Check for overlapping ranges
    const parsedRangeStart = parseInt(rangeStart)
    const parsedRangeEnd = parseInt(rangeEnd)
    const overlapCheck = await checkRangeOverlap(game, gameMode, parsedRangeStart, parsedRangeEnd, undefined, svcType)

    if (overlapCheck.overlaps) {
      const existing = overlapCheck.overlappingRange!
      return NextResponse.json(
        {
          message: `Esta faixa sobrepõe uma faixa existente (${existing.rangeStart} - ${existing.rangeEnd}). Ajuste os valores ou desative a faixa existente primeiro.`,
        },
        { status: HttpStatus.CONFLICT }
      )
    }

    const unit = gameMode === 'PREMIER' ? '1000 pontos' : '1 nível'

    const pricingConfig = await prisma.pricingConfig.create({
      data: {
        game,
        gameMode,
        serviceType: svcType,
        rangeStart: parsedRangeStart,
        rangeEnd: parsedRangeEnd,
        price: parseFloat(price),
        unit,
        enabled: enabled !== undefined ? enabled : true,
      },
    })

    return NextResponse.json({ data: pricingConfig }, { status: HttpStatus.CREATED })
  },
  { auth: { roles: ['ADMIN'] }, errorMessage: ErrorMessages.GENERIC_ERROR, endpoint: 'POST /api/admin/pricing' }
)
