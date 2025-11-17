import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'

// GET - Buscar perfil do usuário autenticado
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            boosterOrders: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar perfil' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar perfil do usuário autenticado
export async function PUT(request: NextRequest) {
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
    const { name, phone, currentPassword, newPassword } = body

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim()
    }

    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() !== '' ? phone.trim() : null
    }

    // Se forneceu senha nova, precisa fornecer a atual
    if (newPassword !== undefined && newPassword.trim() !== '') {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Senha atual é obrigatória para alterar a senha' },
          { status: 400 }
        )
      }

      // Verificar senha atual
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        existingUser.password
      )

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Senha atual incorreta' },
          { status: 400 }
        )
      }

      // Validar nova senha
      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: 'A nova senha deve ter no mínimo 6 caracteres' },
          { status: 400 }
        )
      }

      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    // Se não há nada para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum dado para atualizar' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      { message: 'Perfil atualizado com sucesso', user: updatedUser },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}

