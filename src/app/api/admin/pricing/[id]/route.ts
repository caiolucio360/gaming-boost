import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'

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
