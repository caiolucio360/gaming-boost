import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { isGameEnabled, isServiceTypeSupported, GameId, ServiceType } from '@/lib/games-config'

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

// GET - Listar todos os serviços
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin()
    if (adminCheck.error) {
      return NextResponse.json(
        { message: adminCheck.error },
        { status: adminCheck.status! }
      )
    }

    const { searchParams } = new URL(request.url)
    const game = searchParams.get('game') as GameId | null
    const type = searchParams.get('type') as ServiceType | null

    const where: any = {
      game: 'CS2', // Filtrar apenas CS2 (único jogo válido no enum)
    }
    if (game && isGameEnabled(game) && game === 'CS2') {
      where.game = game
    }
    if (type) {
      where.type = type
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ services }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar serviços:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar serviços' },
      { status: 500 }
    )
  }
}

// POST - Criar novo serviço
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin()
    if (adminCheck.error) {
      return NextResponse.json(
        { message: adminCheck.error },
        { status: adminCheck.status! }
      )
    }

    const body = await request.json()
    const { game, type, name, description, price, duration } = body

    // Validação
    if (!game || !isGameEnabled(game as GameId)) {
      return NextResponse.json(
        { message: 'Jogo inválido ou não habilitado' },
        { status: 400 }
      )
    }

    if (!type || !isServiceTypeSupported(game as GameId, type as ServiceType)) {
      return NextResponse.json(
        { message: 'Tipo de serviço inválido ou não suportado para este jogo' },
        { status: 400 }
      )
    }

    if (!name || !description || !price || !duration) {
      return NextResponse.json(
        { message: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        game,
        type,
        name,
        description,
        price: parseFloat(price),
        duration,
      },
    })

    return NextResponse.json(
      { message: 'Serviço criado com sucesso', service },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar serviço:', error)
    return NextResponse.json(
      { message: 'Erro ao criar serviço' },
      { status: 500 }
    )
  }
}

