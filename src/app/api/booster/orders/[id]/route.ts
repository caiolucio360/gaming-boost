import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

async function checkBooster() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) {
    return { error: 'Não autenticado', status: 401, user: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user || user.role !== 'BOOSTER') {
    return {
      error: 'Acesso negado. Apenas boosters.',
      status: 403,
      user: null,
    }
  }

  return { error: null, status: null, user: { id: userId } }
}

// POST - Aceitar um pedido disponível
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const boosterCheck = await checkBooster()
    if (boosterCheck.error) {
      return NextResponse.json(
        { message: boosterCheck.error },
        { status: boosterCheck.status! }
      )
    }

    const { id } = await params
    const boosterId = boosterCheck.user!.id

    // Verificar se o pedido existe e está disponível
    const order = await prisma.order.findUnique({
      where: { id },
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
      where: { id },
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
    const boosterCheck = await checkBooster()
    if (boosterCheck.error) {
      return NextResponse.json(
        { message: boosterCheck.error },
        { status: boosterCheck.status! }
      )
    }

    const { id } = await params
    const boosterId = boosterCheck.user!.id
    const body = await request.json()
    const { status } = body

    if (!status || !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { message: 'Status inválido. Use IN_PROGRESS ou COMPLETED' },
        { status: 400 }
      )
    }

    // Verificar se o pedido pertence ao booster
    const order = await prisma.order.findUnique({
      where: { id },
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
      where: { id },
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

