import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import { HttpStatus } from '@/lib/http-status'
import bcrypt from 'bcryptjs'

// GET - Buscar usuário específico
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
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'ID do usuário inválido' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        boosterCommissionPercentage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: HttpStatus.NOT_FOUND }
      )
    }

    return NextResponse.json({ user }, { status: HttpStatus.OK })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar usuário' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// PUT - Atualizar usuário
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
    const { name, email, role, password, boosterCommissionPercentage } = body

    // Converter id para número
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'ID do usuário inválido' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Preparar dados para atualização
    const updateData: Prisma.UserUpdateInput = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) {
      // Verificar se email já existe em outro usuário
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })
      if (emailExists && emailExists.id !== userId) {
        return NextResponse.json(
          { message: 'Email já está em uso' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }
      updateData.email = email
    }
    if (role !== undefined && ['CLIENT', 'BOOSTER', 'ADMIN'].includes(role)) {
      // Contas que ainda não confirmaram o e-mail não podem ser promovidas
      // (BOOSTER/ADMIN). Admin pode editar e-mail e excluir, mas não elevar o
      // cargo — comparar com o cargo atual para não bloquear edições de e-mail.
      if (!existingUser.active && role !== existingUser.role && role !== 'CLIENT') {
        return NextResponse.json(
          { message: 'Não é possível promover uma conta que ainda não confirmou o e-mail' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }
      updateData.role = role
    }
    if (password !== undefined && password.length >= 8) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Ativação manual pelo admin (libera edição/promoção etc. para contas não verificadas)
    const { active } = body
    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        return NextResponse.json(
          { message: 'Campo "active" deve ser booleano' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }
      updateData.active = active
    }

    // Permitir atualizar comissão do booster (apenas para usuários com role BOOSTER)
    if (boosterCommissionPercentage !== undefined) {
      // Validar se é um número entre 0 e 1
      const percentage = parseFloat(boosterCommissionPercentage)
      if (isNaN(percentage) || percentage < 0 || percentage > 1) {
        return NextResponse.json(
          { message: 'Porcentagem de comissão deve ser um número entre 0 e 1 (ex: 0.75 para 75%)' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      // Verificar se o usuário é um booster
      if (existingUser.role !== 'BOOSTER') {
        return NextResponse.json(
          { message: 'Apenas boosters podem ter comissão personalizada' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      updateData.boosterCommissionPercentage = percentage
    }

    // Permitir atualizar share de lucro do admin (apenas para usuários com role ADMIN)
    const { adminProfitShare } = body
    if (adminProfitShare !== undefined) {
      // Validar se é um número entre 0 e 1
      const share = parseFloat(adminProfitShare)
      if (isNaN(share) || share < 0 || share > 1) {
        return NextResponse.json(
          { message: 'Share de lucro deve ser um número entre 0 e 1 (ex: 0.5 para 50%)' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      // Verificar se o usuário é um admin
      // Se estiver mudando o role para ADMIN agora, permite. Se já for ADMIN, permite.
      const newRole = role || existingUser.role
      if (newRole !== 'ADMIN') {
        return NextResponse.json(
          { message: 'Apenas admins podem ter share de lucro' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      updateData.adminProfitShare = share
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        boosterCommissionPercentage: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      { message: 'Usuário atualizado com sucesso', user: updatedUser },
      { status: HttpStatus.OK }
    )
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar usuário' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

// DELETE - Deletar usuário
export async function DELETE(
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
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'ID do usuário inválido' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Não permitir deletar o próprio admin
    const currentUserId = authResult.user.id
    if (currentUserId === userId) {
      return NextResponse.json(
        { message: 'Não é possível deletar seu próprio usuário' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Deletar usuário (pedidos serão deletados em cascade se configurado)
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json(
      { message: 'Usuário deletado com sucesso' },
      { status: HttpStatus.OK }
    )
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao deletar usuário' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

