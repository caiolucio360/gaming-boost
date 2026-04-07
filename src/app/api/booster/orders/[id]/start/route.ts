// src/app/api/booster/orders/[id]/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyBooster, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { getStatusForError } from '@/lib/error-constants'
import { OrderService } from '@/services'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult.error || ErrorMessages.AUTH_UNAUTHENTICATED, 401)
    }

    const { id } = await params
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json({ message: 'ID do pedido inválido' }, { status: 400 })
    }

    const boosterId = authResult.user.id
    const result = await OrderService.startOrder({ orderId, boosterId })

    if (!result.success) {
      const status = result.code ? getStatusForError(result.code) : 500
      return NextResponse.json({ message: result.error, code: result.code }, { status })
    }

    return NextResponse.json(
      { message: 'Boost iniciado com sucesso', order: result.data },
      { status: 200 }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.BOOSTER_START_ORDER_FAILED, 'POST /api/booster/orders/[id]/start')
  }
}
