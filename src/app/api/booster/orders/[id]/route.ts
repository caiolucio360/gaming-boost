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

    // Buscar o booster para verificar se tem comissão personalizada
    const booster = await prisma.user.findUnique({
      where: { id: boosterId },
      select: { boosterCommissionPercentage: true },
    })

    let boosterPercentage: number

    // Se o booster tem comissão personalizada, usar ela
    if (booster?.boosterCommissionPercentage !== null && booster?.boosterCommissionPercentage !== undefined) {
      boosterPercentage = booster.boosterCommissionPercentage
    } else {
      // Caso contrário, usar a configuração global
      let commissionConfig = await prisma.commissionConfig.findFirst({
        where: { enabled: true },
      })

      // Se não houver configuração, criar uma padrão
      if (!commissionConfig) {
        commissionConfig = await prisma.commissionConfig.create({
          data: {
            boosterPercentage: 0.70,
            adminPercentage: 0.30,
            enabled: true,
          },
        })
      }

      boosterPercentage = commissionConfig.boosterPercentage
    }

    const boosterCommission = order.total * boosterPercentage

    // Calcular a receita do admin baseada na comissão do booster
    // Se o booster tem comissão personalizada, a receita do admin será o restante
    const adminRevenue = order.total - boosterCommission
    const adminPercentage = 1 - boosterPercentage

    // Atribuir pedido ao booster, calcular comissão e mudar status para IN_PROGRESS
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Buscar o admin do pedido
      const orderWithAdmin = await tx.order.findUnique({
        where: { id: orderId },
        select: { adminId: true },
      })

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          boosterId,
          status: 'IN_PROGRESS',
          boosterCommission,
          boosterPercentage,
          adminRevenue,
          adminPercentage,
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

      // Criar comissão do booster
      await tx.boosterCommission.create({
        data: {
          orderId: orderId,
          boosterId,
          orderTotal: order.total,
          percentage: boosterPercentage,
          amount: boosterCommission,
          status: 'PENDING',
        },
      })

      // Atualizar receita do admin se já existir
      if (orderWithAdmin?.adminId) {
        await tx.adminRevenue.updateMany({
          where: {
            orderId: orderId,
          },
          data: {
            amount: adminRevenue,
            percentage: adminPercentage,
          },
        })
      }

      return updated
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
      include: {
        payments: {
          where: {
            status: 'PAID',
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

    // Se estiver marcando como COMPLETED, liberar automaticamente as comissões/receitas
    const updateData: any = { status }

    if (status === 'COMPLETED') {
      // Liberar automaticamente comissão do booster (disponível para saque)
      await prisma.boosterCommission.updateMany({
        where: {
          orderId: orderId,
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
          orderId: orderId,
          status: 'PENDING',
        },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      })
    }

    // Atualizar status do pedido
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
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

