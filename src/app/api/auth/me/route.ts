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

    // Buscar dados completos do usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário está ativo
    if (!user.active) {
      return NextResponse.json(
        { message: 'Conta desativada' },
        { status: 403 }
      )
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return NextResponse.json(
      { message: 'Erro ao verificar sessão' },
      { status: 500 }
    )
  }
}

