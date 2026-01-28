import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { Game } from '@/generated/prisma/client'

/**
 * Helper to check if a range overlaps with existing ranges
 */
async function checkRangeOverlap(
  game: Game,
  gameMode: string,
  rangeStart: number,
  rangeEnd: number,
  excludeId: number
): Promise<{ overlaps: boolean; overlappingRange?: { id: number; rangeStart: number; rangeEnd: number } }> {
  const existingRanges = await db.pricingConfig.findMany({
    where: {
      game,
      gameMode,
      enabled: true,
      id: { not: excludeId }
    },
    select: { id: true, rangeStart: true, rangeEnd: true }
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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const { rangeStart, rangeEnd, price, unit, enabled } = body

    // Validações
    if (rangeStart !== undefined && rangeEnd !== undefined && rangeStart >= rangeEnd) {
      return Response.json({ error: 'rangeStart must be less than rangeEnd' }, { status: 400 })
    }

    if (price !== undefined && price <= 0) {
      return Response.json({ error: 'price must be greater than 0' }, { status: 400 })
    }

    // Verificar se existe
    const existing = await db.pricingConfig.findUnique({
      where: { id }
    })

    if (!existing) {
      return Response.json({ error: 'Pricing config not found' }, { status: 404 })
    }

    // Check for overlapping ranges when updating range values
    const newRangeStart = rangeStart !== undefined ? parseInt(rangeStart) : existing.rangeStart
    const newRangeEnd = rangeEnd !== undefined ? parseInt(rangeEnd) : existing.rangeEnd
    const newEnabled = enabled !== undefined ? enabled : existing.enabled

    // Only check overlap if the range is enabled (or being enabled)
    if (newEnabled && (rangeStart !== undefined || rangeEnd !== undefined)) {
      const overlapCheck = await checkRangeOverlap(
        existing.game,
        existing.gameMode,
        newRangeStart,
        newRangeEnd,
        id
      )

      if (overlapCheck.overlaps) {
        const overlap = overlapCheck.overlappingRange!
        return Response.json({
          error: `Esta faixa sobrepõe uma faixa existente (${overlap.rangeStart} - ${overlap.rangeEnd}). Ajuste os valores ou desative a faixa existente primeiro.`
        }, { status: 409 })
      }
    }

    // Atualizar
    const updateData: any = {}
    if (rangeStart !== undefined) updateData.rangeStart = parseInt(rangeStart)
    if (rangeEnd !== undefined) updateData.rangeEnd = parseInt(rangeEnd)
    if (price !== undefined) updateData.price = parseFloat(price)
    if (unit !== undefined) updateData.unit = unit
    if (enabled !== undefined) updateData.enabled = enabled

    const pricingConfig = await db.pricingConfig.update({
      where: { id },
      data: updateData
    })

    return Response.json({ data: pricingConfig }, { status: 200 })
  } catch (error) {
    console.error('Error updating pricing config:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/pricing/[id]
 * Toggle enabled status of a pricing config
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const { enabled } = body

    if (enabled === undefined) {
      return Response.json({ error: 'enabled field is required' }, { status: 400 })
    }

    // Verificar se existe
    const existing = await db.pricingConfig.findUnique({
      where: { id }
    })

    if (!existing) {
      return Response.json({ error: 'Pricing config not found' }, { status: 404 })
    }

    // If re-enabling, check for overlaps with other enabled ranges
    if (enabled === true && !existing.enabled) {
      const overlapCheck = await checkRangeOverlap(
        existing.game,
        existing.gameMode,
        existing.rangeStart,
        existing.rangeEnd,
        id
      )

      if (overlapCheck.overlaps) {
        const overlap = overlapCheck.overlappingRange!
        return Response.json({
          error: `Não é possível ativar esta faixa pois ela sobrepõe a faixa ${overlap.rangeStart} - ${overlap.rangeEnd}. Desative a outra faixa primeiro.`
        }, { status: 409 })
      }
    }

    const pricingConfig = await db.pricingConfig.update({
      where: { id },
      data: { enabled }
    })

    return Response.json({ data: pricingConfig }, { status: 200 })
  } catch (error) {
    console.error('Error toggling pricing config:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/pricing/[id]
 * Deleta uma configuração de preço
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return Response.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Verificar se existe
    const existing = await db.pricingConfig.findUnique({
      where: { id }
    })

    if (!existing) {
      return Response.json({ error: 'Pricing config not found' }, { status: 404 })
    }

    await db.pricingConfig.delete({
      where: { id }
    })

    return Response.json({ message: 'Pricing config deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting pricing config:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

