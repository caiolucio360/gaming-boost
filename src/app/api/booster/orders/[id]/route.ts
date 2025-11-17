import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyBooster, createAuthErrorResponse } from '@/lib/auth-middleware'

// POST - Aceitar um pedido disponível
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

    // Converter id para número
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Verificar se o pedido existe e está disponível
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        service: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Pedido não está disponível para aceitação' },
        { status: 400 }
      )
    }

    if (order.boosterId) {
      return NextResponse.json(
        { message: 'Pedido já foi atribuído a outro booster' },
        { status: 400 }
      )
    }

    // Atribuir pedido ao booster e mudar status para IN_PROGRESS
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        boosterId,
        status: 'IN_PROGRESS',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        service: true,
        booster: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Pedido aceito com sucesso', order: updatedOrder },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao aceitar pedido:', error)
    return NextResponse.json(
      { message: 'Erro ao aceitar pedido' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar status do pedido (marcar como completo)
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

    // Converter id para número
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    if (!status || !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { message: 'Status inválido. Use IN_PROGRESS ou COMPLETED' },
        { status: 400 }
      )
    }

    // Verificar se o pedido pertence ao booster
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (order.boosterId !== boosterId) {
      return NextResponse.json(
        { message: 'Acesso negado. Este pedido não foi atribuído a você.' },
        { status: 403 }
      )
    }

    if (order.status === 'COMPLETED' && status === 'IN_PROGRESS') {
      return NextResponse.json(
        { message: 'Não é possível reverter um pedido completo' },
        { status: 400 }
      )
    }

    // Atualizar status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        service: true,
        booster: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Status atualizado com sucesso', order: updatedOrder },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar pedido' },
      { status: 500 }
    )
  }
}

