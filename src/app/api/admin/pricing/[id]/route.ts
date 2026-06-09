import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Game, ServiceType, Prisma } from '@/generated/prisma/client'
import { withApiHandler, parseIntParam } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { HttpStatus } from '@/lib/http-status'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Helper to check if a range overlaps with existing ranges
 */
async function checkRangeOverlap(
  game: Game,
  gameMode: string,
  rangeStart: number,
  rangeEnd: number,
  excludeId: number,
  serviceType: ServiceType = 'RANK_BOOST'
): Promise<{ overlaps: boolean; overlappingRange?: { id: number; rangeStart: number; rangeEnd: number } }> {
  const existingRanges = await prisma.pricingConfig.findMany({
    where: { game, gameMode, serviceType, enabled: true, id: { not: excludeId } },
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
 * PUT /api/admin/pricing/[id]
 * Atualiza uma configuração de preço
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withApiHandler(
    async ({ request }) => {
      const { id: idParam } = await params
      const id = parseIntParam(idParam)
      if (id === null) {
        return NextResponse.json({ message: 'ID inválido' }, { status: HttpStatus.BAD_REQUEST })
      }

      const body = await request.json()
      const { rangeStart, rangeEnd, price, enabled, gameMode } = body

      if (rangeStart !== undefined && rangeEnd !== undefined && rangeStart >= rangeEnd) {
        return NextResponse.json(
          { message: 'O valor final da faixa deve ser maior que o valor inicial' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      if (price !== undefined && price <= 0) {
        return NextResponse.json({ message: 'O preço deve ser maior que zero' }, { status: HttpStatus.BAD_REQUEST })
      }

      const existing = await prisma.pricingConfig.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ message: 'Configuração de preço não encontrada' }, { status: HttpStatus.NOT_FOUND })
      }

      // Check for overlapping ranges when updating range values
      const newRangeStart = rangeStart !== undefined ? parseInt(rangeStart) : existing.rangeStart
      const newRangeEnd = rangeEnd !== undefined ? parseInt(rangeEnd) : existing.rangeEnd
      const newEnabled = enabled !== undefined ? enabled : existing.enabled

      if (newEnabled && (rangeStart !== undefined || rangeEnd !== undefined)) {
        const overlapCheck = await checkRangeOverlap(existing.game, existing.gameMode, newRangeStart, newRangeEnd, id, existing.serviceType)
        if (overlapCheck.overlaps) {
          const overlap = overlapCheck.overlappingRange!
          return NextResponse.json(
            {
              message: `Esta faixa sobrepõe uma faixa existente (${overlap.rangeStart} - ${overlap.rangeEnd}). Ajuste os valores ou desative a faixa existente primeiro.`,
            },
            { status: HttpStatus.CONFLICT }
          )
        }
      }

      const updateData: Prisma.PricingConfigUpdateInput = {}
      if (rangeStart !== undefined) updateData.rangeStart = parseInt(rangeStart)
      if (rangeEnd !== undefined) updateData.rangeEnd = parseInt(rangeEnd)
      if (price !== undefined) updateData.price = parseFloat(price)
      if (gameMode !== undefined) {
        updateData.gameMode = gameMode
        updateData.unit = gameMode === 'PREMIER' ? '1000 pontos' : '1 nível'
      }
      if (enabled !== undefined) updateData.enabled = enabled

      const pricingConfig = await prisma.pricingConfig.update({ where: { id }, data: updateData })

      return NextResponse.json({ data: pricingConfig }, { status: HttpStatus.OK })
    },
    { auth: { roles: ['ADMIN'] }, errorMessage: ErrorMessages.GENERIC_ERROR, endpoint: 'PUT /api/admin/pricing/[id]' }
  )(request)
}

/**
 * PATCH /api/admin/pricing/[id]
 * Toggle enabled status of a pricing config
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withApiHandler(
    async ({ request }) => {
      const { id: idParam } = await params
      const id = parseIntParam(idParam)
      if (id === null) {
        return NextResponse.json({ message: 'ID inválido' }, { status: HttpStatus.BAD_REQUEST })
      }

      const { enabled } = await request.json()
      if (enabled === undefined) {
        return NextResponse.json({ message: 'O campo enabled é obrigatório' }, { status: HttpStatus.BAD_REQUEST })
      }

      const existing = await prisma.pricingConfig.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ message: 'Configuração de preço não encontrada' }, { status: HttpStatus.NOT_FOUND })
      }

      // If re-enabling, check for overlaps with other enabled ranges
      if (enabled === true && !existing.enabled) {
        const overlapCheck = await checkRangeOverlap(existing.game, existing.gameMode, existing.rangeStart, existing.rangeEnd, id, existing.serviceType)
        if (overlapCheck.overlaps) {
          const overlap = overlapCheck.overlappingRange!
          return NextResponse.json(
            {
              message: `Não é possível ativar esta faixa pois ela sobrepõe a faixa ${overlap.rangeStart} - ${overlap.rangeEnd}. Desative a outra faixa primeiro.`,
            },
            { status: HttpStatus.CONFLICT }
          )
        }
      }

      const pricingConfig = await prisma.pricingConfig.update({ where: { id }, data: { enabled } })

      return NextResponse.json({ data: pricingConfig }, { status: HttpStatus.OK })
    },
    { auth: { roles: ['ADMIN'] }, errorMessage: ErrorMessages.GENERIC_ERROR, endpoint: 'PATCH /api/admin/pricing/[id]' }
  )(request)
}

/**
 * DELETE /api/admin/pricing/[id]
 * Deleta uma configuração de preço
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withApiHandler(
    async () => {
      const { id: idParam } = await params
      const id = parseIntParam(idParam)
      if (id === null) {
        return NextResponse.json({ message: 'ID inválido' }, { status: HttpStatus.BAD_REQUEST })
      }

      const existing = await prisma.pricingConfig.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ message: 'Configuração de preço não encontrada' }, { status: HttpStatus.NOT_FOUND })
      }

      await prisma.pricingConfig.delete({ where: { id } })

      return NextResponse.json({ message: 'Configuração de preço excluída com sucesso' }, { status: HttpStatus.OK })
    },
    { auth: { roles: ['ADMIN'] }, errorMessage: ErrorMessages.GENERIC_ERROR, endpoint: 'DELETE /api/admin/pricing/[id]' }
  )(request)
}
