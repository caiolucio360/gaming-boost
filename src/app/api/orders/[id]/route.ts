import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

// GET - Buscar pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
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
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id },
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
      where: { id },
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

