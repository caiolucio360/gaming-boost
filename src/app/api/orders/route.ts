import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { z } from 'zod'

// Simple schema for order creation
const CreateOrderSchema = z.object({
  serviceId: z.number().or(z.string().transform(Number)),
  total: z.number().or(z.string().transform(Number)),
  currentRank: z.string().optional(),
  targetRank: z.string().optional(),
  currentRating: z.number().or(z.string().transform(Number)).optional(),
  targetRating: z.number().or(z.string().transform(Number)).optional(),
  gameMode: z.string().optional(),
  gameType: z.string().optional(),
  notes: z.string().optional(),
  currentLevel: z.number().optional(),
  targetLevel: z.number().optional(),
  gameCredentials: z.string().optional(),
  boosterId: z.string().optional(),
})

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
          game: 'CS2',
        },
      },
      include: {
        service: true,
        review: true,
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
    const body = await request.json()

    // Validate with Zod
    const parseResult = CreateOrderSchema.safeParse(body)

    if (!parseResult.success) {
      if (!body.serviceId || !body.total) {
        return NextResponse.json(
          { message: 'serviceId e total são obrigatórios' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { message: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const data = parseResult.data
    const serviceId = typeof data.serviceId === 'number' ? data.serviceId : parseInt(String(data.serviceId))
    const total = typeof data.total === 'number' ? data.total : parseFloat(String(data.total))

    // Verificar se o serviço existe
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { message: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    // Validar: usuário não pode ter mais de 1 boost de rank ativo por modalidade
    const gameMode = data.gameMode
    if (gameMode && (gameMode === 'PREMIER' || gameMode === 'GAMERS_CLUB')) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId,
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
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

    // Buscar um admin ativo
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        active: true,
      },
    })

    if (!admin) {
      return NextResponse.json(
        { message: 'Nenhum administrador ativo encontrado' },
        { status: 400 }
      )
    }

    // Buscar configuração de comissão ativa
    let commissionConfig = await prisma.commissionConfig.findFirst({
      where: { enabled: true },
    })

    if (!commissionConfig) {
      commissionConfig = await prisma.commissionConfig.create({
        data: {
          boosterPercentage: 0.70,
          adminPercentage: 0.30,
          enabled: true,
        },
      })
    }

    const boosterPercentage = commissionConfig.boosterPercentage
    const adminPercentage = commissionConfig.adminPercentage
    const orderTotal = total
    const adminRevenue = orderTotal * adminPercentage

    // Preparar dados do pedido
    const orderData: Record<string, unknown> = {
      userId,
      serviceId,
      adminId: admin.id,
      total: orderTotal,
      status: 'PENDING',
      adminRevenue,
      adminPercentage,
      boosterPercentage,
    }

    // Adicionar metadados se fornecidos
    if (data.currentRank) orderData.currentRank = data.currentRank
    if (data.targetRank) orderData.targetRank = data.targetRank
    if (data.currentRating !== undefined) orderData.currentRating = data.currentRating
    if (data.targetRating !== undefined) orderData.targetRating = data.targetRating
    if (data.gameMode) orderData.gameMode = data.gameMode
    if (data.gameType) orderData.gameType = data.gameType
    if (data.notes) orderData.notes = data.notes

    // Criar order e receita do admin em uma transação
    const order = await prisma.$transaction(async (tx: unknown) => {
      const prismaClient = tx as typeof prisma
      const newOrder = await prismaClient.order.create({
        data: orderData as never,
        include: {
          service: true,
        },
      })

      await prismaClient.adminRevenue.create({
        data: {
          orderId: newOrder.id,
          adminId: admin.id,
          orderTotal: orderTotal,
          percentage: adminPercentage,
          amount: adminRevenue,
          status: 'PENDING',
        },
      })

      return newOrder
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
