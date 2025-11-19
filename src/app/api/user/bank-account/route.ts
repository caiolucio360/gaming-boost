import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'

// GET - Obter conta bancária do usuário
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id

    // Verificar se é booster ou admin
    if (authResult.user.role !== 'BOOSTER' && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Apenas boosters e admins podem ter conta bancária' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        pixKey: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ pixKey: user.pixKey }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar conta bancária:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar conta bancária' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar conta bancária do usuário
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id

    // Verificar se é booster ou admin
    if (authResult.user.role !== 'BOOSTER' && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Apenas boosters e admins podem ter conta bancária' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { pixKey } = body

    // Validar campo obrigatório
    if (!pixKey || pixKey.trim() === '') {
      return NextResponse.json(
        { message: 'Chave PIX é obrigatória' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        pixKey: pixKey.trim(),
      },
      select: {
        id: true,
        pixKey: true,
      },
    })

    return NextResponse.json(
      { message: 'Chave PIX atualizada com sucesso', pixKey: updatedUser.pixKey },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao atualizar conta bancária:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar conta bancária' },
      { status: 500 }
    )
  }
}

