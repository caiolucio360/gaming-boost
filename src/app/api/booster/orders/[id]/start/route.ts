// src/app/api/booster/orders/[id]/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler, parseIntParam } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { getStatusForError } from '@/lib/error-constants'
import { HttpStatus } from '@/lib/http-status'
import { OrderService } from '@/services'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withApiHandler(
    async ({ user }) => {
      const { id } = await params
      const orderId = parseIntParam(id)
      if (orderId === null) {
        return NextResponse.json({ message: 'ID do pedido inválido' }, { status: HttpStatus.BAD_REQUEST })
      }

      const result = await OrderService.startOrder({ orderId, boosterId: user.id })
      if (!result.success) {
        const status = result.code ? getStatusForError(result.code) : HttpStatus.INTERNAL_SERVER_ERROR
        return NextResponse.json({ message: result.error, code: result.code }, { status })
      }

      return NextResponse.json({ message: 'Boost iniciado com sucesso', order: result.data }, { status: HttpStatus.OK })
    },
    { auth: { roles: ['BOOSTER'] }, errorMessage: ErrorMessages.BOOSTER_START_ORDER_FAILED, endpoint: 'POST /api/booster/orders/[id]/start' }
  )(request)
}
