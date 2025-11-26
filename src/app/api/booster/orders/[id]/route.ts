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

    // Buscar o pedido primeiro para obter o total
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { total: true, status: true, boosterId: true },
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

    // Validar: booster só pode aceitar 1 pedido por vez
    // Só pode aceitar outro quando o atual for COMPLETED ou CANCELLED
    const activeOrder = await prisma.order.findFirst({
      where: {
        boosterId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'], // Verificar pedidos pendentes e em andamento
        },
      },
      select: {
        id: true,
        status: true,
      },
    })

    if (activeOrder) {
      const statusName = activeOrder.status === 'PENDING' ? 'pendente' : 'em andamento'
      return NextResponse.json(
        {
          message: `Você já possui um pedido ${statusName} (ID: ${activeOrder.id}). Finalize ou cancele o pedido atual antes de aceitar um novo.`,
        },
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
    // Usar transação atômica para evitar race conditions
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Verificar e atualizar em uma única operação atômica
      // Usar updateMany com condições para garantir atomicidade
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: 'PENDING',
          boosterId: null, // Apenas se ainda não tiver booster
        },
        data: {
          boosterId,
          status: 'IN_PROGRESS',
          boosterCommission,
          boosterPercentage,
          adminRevenue,
          adminPercentage,
        },
      })

      // Se nenhuma linha foi atualizada, significa que o pedido já foi pego
      if (updateResult.count === 0) {
        // Verificar o estado atual para retornar erro apropriado
        const currentOrder = await tx.order.findUnique({
          where: { id: orderId },
        })

        if (!currentOrder) {
          throw new Error('Pedido não encontrado')
        }
        if (currentOrder.status !== 'PENDING') {
          throw new Error('Pedido não está disponível para aceitação')
        }
        if (currentOrder.boosterId) {
          throw new Error('Pedido já foi atribuído a outro booster')
        }
        throw new Error('Erro ao aceitar pedido')
      }

      // Buscar o pedido atualizado com todas as informações
      const updated = await tx.order.findUnique({
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

      if (!updated) {
        throw new Error('Erro ao buscar pedido atualizado')
      }

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

      // Buscar todos os admins ativos para dividir a receita
      const admins = await tx.user.findMany({
        where: { role: 'ADMIN', active: true },
        select: { id: true, adminProfitShare: true }
      })

      // Calcular total de shares para normalização (caso a soma não seja 1 ou 100)
      const totalShares = admins.reduce((sum, admin) => sum + (admin.adminProfitShare || 0), 0)

      // Criar registros de receita para cada admin
      if (admins.length > 0) {
        for (const admin of admins) {
          let sharePercentage = 0

          // Se houver shares definidos, calcular proporcionalmente
          if (totalShares > 0) {
            sharePercentage = (admin.adminProfitShare || 0) / totalShares
          } else {
            // Se ninguém tiver share definido, dividir igualmente
            sharePercentage = 1 / admins.length
          }

          const adminAmount = adminRevenue * sharePercentage

          await tx.adminRevenue.create({
            data: {
              orderId: orderId,
              adminId: admin.id,
              orderTotal: order.total,
              percentage: adminPercentage * sharePercentage, // Porcentagem real do total do pedido
              amount: adminAmount,
              status: 'PENDING',
            }
          })
        }
      }

      return updated
    }).catch((error) => {
      // Se for erro de validação, retornar erro específico
      if (error.message.includes('já foi atribuído') ||
        error.message.includes('não está disponível') ||
        error.message.includes('não encontrado')) {
        return NextResponse.json(
          { message: error.message },
          { status: error.message.includes('não encontrado') ? 404 : 400 }
        )
      }
      throw error
    })

    // Se retornou erro, retornar resposta de erro
    if (updatedOrder instanceof NextResponse) {
      return updatedOrder
    }

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

