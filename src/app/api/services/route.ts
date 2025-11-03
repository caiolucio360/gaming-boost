import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isGameEnabled, GameId, ServiceType } from '@/lib/games-config'

/**
 * GET - Listar serviços do banco de dados
 * 
 * Nota: A página pública /services agora exibe serviços estáticos.
 * Esta API ainda é usada para:
 * - Admin gerenciar serviços
 * - Pedidos referenciarem serviços
 * - Outras funcionalidades internas que precisam dos serviços do banco
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const game = searchParams.get('game') as GameId | null
    const type = searchParams.get('type') as ServiceType | null

    const where: any = {
      game: 'CS2', // Filtrar apenas CS2 (único jogo válido no enum)
    }
    
    // Filtrar apenas jogos habilitados (mas garantir que seja CS2)
    if (game && isGameEnabled(game) && game === 'CS2') {
      where.game = game
    }
    
    if (type) {
      where.type = type
    }

    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        game: true,
        type: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        createdAt: true,
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

