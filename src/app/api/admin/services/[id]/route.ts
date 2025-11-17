import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponse } from '@/lib/auth-middleware'

// GET - Buscar serviço específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const { id } = await params

    // Converter id para número
    const serviceId = parseInt(id, 10)
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { message: 'ID do serviço inválido' },
        { status: 400 }
      )
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
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
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const { id } = await params
    const body = await request.json()
    const { game, type, name, description, price, duration } = body

    // Converter id para número
    const serviceId = parseInt(id, 10)
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { message: 'ID do serviço inválido' },
        { status: 400 }
      )
    }

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
      where: { id: serviceId },
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
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const { id } = await params

    // Converter id para número
    const serviceId = parseInt(id, 10)
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { message: 'ID do serviço inválido' },
        { status: 400 }
      )
    }

    // Verificar se serviço existe
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
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
      where: { id: serviceId },
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

