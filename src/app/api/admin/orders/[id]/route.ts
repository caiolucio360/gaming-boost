import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

async function checkAdmin() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) {
    return { error: 'Não autenticado', status: 401, user: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    return {
      error: 'Acesso negado. Apenas administradores.',
      status: 403,
      user: null,
    }
  }

  return { error: null, status: null, user: null }
}

// GET - Buscar pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await checkAdmin()
    if (adminCheck.error) {
      return NextResponse.json(
        { message: adminCheck.error },
        { status: adminCheck.status! }
      )
    }

    const { id } = await params

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

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedido' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar status do pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await checkAdmin()
    if (adminCheck.error) {
      return NextResponse.json(
        { message: adminCheck.error },
        { status: adminCheck.status! }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status, boosterId } = body

    const updateData: any = {}

    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      updateData.status = status
    }

    if (boosterId !== undefined) {
      if (boosterId === null || boosterId === '') {
        updateData.boosterId = null
      } else {
        // Verificar se o booster existe e tem role BOOSTER
        const booster = await prisma.user.findUnique({
          where: { id: boosterId },
          select: { role: true },
        })

        if (!booster) {
          return NextResponse.json(
            { message: 'Booster não encontrado' },
            { status: 404 }
          )
        }

        if (booster.role !== 'BOOSTER') {
          return NextResponse.json(
            { message: 'Usuário não é um booster' },
            { status: 400 }
          )
        }

        updateData.boosterId = boosterId
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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
      { message: 'Status atualizado com sucesso', order },
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

