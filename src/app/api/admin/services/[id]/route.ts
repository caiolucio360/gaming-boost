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

// GET - Buscar serviço específico
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

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { message: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ service }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar serviço:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar serviço' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar serviço
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
    const { game, type, name, description, price, duration } = body

    const updateData: any = {}

    if (game && game === 'CS2') {
      updateData.game = game
    }
    if (type && type === 'RANK_BOOST') {
      updateData.type = type
    }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (duration !== undefined) updateData.duration = duration

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(
      { message: 'Serviço atualizado com sucesso', service },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar serviço' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar serviço
export async function DELETE(
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

    // Verificar se serviço existe
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { message: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há pedidos associados
    if (service._count.orders > 0) {
      return NextResponse.json(
        { message: 'Não é possível deletar serviço com pedidos associados' },
        { status: 400 }
      )
    }

    await prisma.service.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Serviço deletado com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao deletar serviço:', error)
    return NextResponse.json(
      { message: 'Erro ao deletar serviço' },
      { status: 500 }
    )
  }
}

