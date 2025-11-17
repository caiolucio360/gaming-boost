import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'

// GET - Buscar pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação via NextAuth
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id
    const { id } = await params

    // Converter id para número
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o pedido pertence ao usuário
    if (order.userId !== userId) {
      return NextResponse.json(
        { message: 'Acesso negado. Este pedido não pertence a você.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}

// PUT - Cancelar pedido (apenas para o dono do pedido)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação via NextAuth
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id
    const { id } = await params

    // Converter id para número
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        service: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o pedido pertence ao usuário
    if (order.userId !== userId) {
      return NextResponse.json(
        { message: 'Acesso negado. Este pedido não pertence a você.' },
        { status: 403 }
      )
    }

    // Verificar se o pedido pode ser cancelado
    // Apenas pedidos PENDING podem ser cancelados pelo cliente
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { 
          message: `Não é possível cancelar um pedido com status ${order.status}. Apenas pedidos pendentes podem ser cancelados.`,
        },
        { status: 400 }
      )
    }

    // Cancelar o pedido
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
      },
      include: {
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
      { 
        message: 'Pedido cancelado com sucesso',
        order: updatedOrder,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error)
    return NextResponse.json(
      { message: 'Erro ao cancelar pedido' },
      { status: 500 }
    )
  }
}

