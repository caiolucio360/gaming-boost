import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

// GET - Buscar pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

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
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const { id } = await params
    const body = await request.json()
    const { status, boosterId } = body

    // Converter id para número
    const orderIdNum = parseInt(id, 10)
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    const updateData: any = {}

    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      updateData.status = status
      
      // Se estiver marcando como COMPLETED, liberar automaticamente as comissões/receitas
      if (status === 'COMPLETED') {
        // Liberar automaticamente comissão do booster (disponível para saque)
        await prisma.boosterCommission.updateMany({
          where: {
            orderId: orderIdNum,
            status: 'PENDING',
          },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })

        // Liberar automaticamente receita do admin (disponível para saque)
        await prisma.adminRevenue.updateMany({
          where: {
            orderId: orderIdNum,
            status: 'PENDING',
          },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })
      }
    }

    if (boosterId !== undefined) {
      if (boosterId === null || boosterId === '') {
        updateData.boosterId = null
      } else {
        // Converter boosterId para número
        const boosterIdNum = typeof boosterId === 'string' ? parseInt(boosterId, 10) : boosterId
        if (isNaN(boosterIdNum)) {
          return NextResponse.json(
            { message: 'ID do booster inválido' },
            { status: 400 }
          )
        }

        // Verificar se o booster existe e tem role BOOSTER
        const booster = await prisma.user.findUnique({
          where: { id: boosterIdNum },
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

        updateData.boosterId = boosterIdNum
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id: orderIdNum },
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

