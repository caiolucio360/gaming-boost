import { NextRequest, NextResponse } from 'next/server'
import { verifyBooster, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { OrderService } from '@/services'

// POST - Accept an available order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const { id } = await params
    const boosterId = authResult.user.id

    // Parse order ID
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Use OrderService to accept order
    const result = await OrderService.acceptOrder({ orderId, boosterId })

    if (!result.success) {
      // Map error codes to appropriate HTTP status
      const statusMap: Record<string, number> = {
        'ORDER_NOT_FOUND': 404,
        'ORDER_ALREADY_ACCEPTED': 400,
        'INVALID_STATUS_TRANSITION': 400,
        'DUPLICATE_ORDER': 400,
        'FORBIDDEN': 403,
      }
      const status = result.code ? statusMap[result.code] || 500 : 500

      return NextResponse.json(
        { message: result.error, code: result.code },
        { status }
      )
    }

    return NextResponse.json(
      { message: 'Pedido aceito com sucesso', order: result.data },
      { status: 200 }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.BOOSTER_ACCEPT_ORDER_FAILED, 'POST /api/booster/orders/[id]')
  }
}

// PUT - Update order status (mark as complete)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const { id } = await params
    const boosterId = authResult.user.id
    const body = await request.json()
    const { status } = body

    // Parse order ID
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Validate status
    if (!status || !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { message: 'Status inválido. Use IN_PROGRESS ou COMPLETED' },
        { status: 400 }
      )
    }

    // Use OrderService for status updates
    let result
    if (status === 'COMPLETED') {
      result = await OrderService.completeOrder({ orderId, boosterId })
    } else {
      // For other status updates, we need to verify ownership first
      const orderResult = await OrderService.getOrderById(orderId)
      if (!orderResult.success || !orderResult.data) {
        return NextResponse.json(
          { message: 'Pedido não encontrado' },
          { status: 404 }
        )
      }
      if (orderResult.data.boosterId !== boosterId) {
        return NextResponse.json(
          { message: 'Acesso negado. Este pedido não foi atribuído a você.' },
          { status: 403 }
        )
      }
      result = await OrderService.updateOrderStatus(orderId, status)
    }

    if (!result.success) {
      // Map error codes to appropriate HTTP status
      const statusMap: Record<string, number> = {
        'ORDER_NOT_FOUND': 404,
        'INVALID_STATUS_TRANSITION': 400,
        'FORBIDDEN': 403,
      }
      const statusCode = result.code ? statusMap[result.code] || 500 : 500

      return NextResponse.json(
        { message: result.error, code: result.code },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { message: 'Status atualizado com sucesso', order: result.data },
      { status: 200 }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.BOOSTER_UPDATE_ORDER_FAILED, 'PUT /api/booster/orders/[id]')
  }
}
