import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
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

    // Buscar orders do usuário com informações do serviço
    const orders = await prisma.order.findMany({
      where: {
        userId,
        service: {
          game: 'CS2', // Filtrar apenas orders com games válidos
        },
      },
      include: {
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar orders:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar solicitações' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const { 
      serviceId, 
      total,
      currentRank,
      targetRank,
      currentRating,
      targetRating,
      gameMode,
      gameType,
      metadata,
      notes
    } = await request.json()

    if (!serviceId || !total) {
      return NextResponse.json(
        { message: 'serviceId e total são obrigatórios' },
        { status: 400 }
      )
    }

    // Converter serviceId para número
    const serviceIdNum = typeof serviceId === 'string' ? parseInt(serviceId, 10) : serviceId
    if (isNaN(serviceIdNum)) {
      return NextResponse.json(
        { message: 'serviceId inválido' },
        { status: 400 }
      )
    }

    // Verificar se o serviço existe
    const service = await prisma.service.findUnique({
      where: { id: serviceIdNum },
    })

    if (!service) {
      return NextResponse.json(
        { message: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    // Validar: usuário não pode ter mais de 1 boost de rank ativo por modalidade
    // Só pode pedir outro quando o anterior for COMPLETED ou CANCELLED
    if (gameMode && (gameMode === 'PREMIER' || gameMode === 'GAMERS_CLUB')) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId,
          status: {
            in: ['PENDING', 'IN_PROGRESS'], // Verificar pedidos pendentes e em andamento
          },
          gameMode: gameMode,
          service: {
            type: 'RANK_BOOST',
          },
        },
      })

      if (existingOrder) {
        const modeName = gameMode === 'PREMIER' ? 'Premier' : 'Gamers Club'
        const statusName = existingOrder.status === 'PENDING' ? 'pendente' : 'em andamento'
        return NextResponse.json(
          { 
            message: `Você já possui um boost de rank ${modeName} ${statusName}. Finalize ou cancele o pedido anterior antes de criar um novo.`,
          },
          { status: 400 }
        )
      }
    }

    // Preparar dados do pedido
    const orderData: any = {
      userId,
      serviceId: serviceIdNum,
      total: parseFloat(total),
      status: 'PENDING',
    }

    // Adicionar metadados se fornecidos
    if (currentRank) orderData.currentRank = currentRank
    if (targetRank) orderData.targetRank = targetRank
    if (currentRating !== undefined) orderData.currentRating = parseInt(currentRating)
    if (targetRating !== undefined) orderData.targetRating = parseInt(targetRating)
    if (gameMode) orderData.gameMode = gameMode
    if (gameType) orderData.gameType = gameType
    if (metadata) orderData.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    if (notes) orderData.notes = notes

    // Criar order
    const order = await prisma.order.create({
      data: orderData,
      include: {
        service: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Solicitação criada com sucesso',
        order,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar order:', error)
    return NextResponse.json(
      { message: 'Erro ao criar solicitação' },
      { status: 500 }
    )
  }
}

