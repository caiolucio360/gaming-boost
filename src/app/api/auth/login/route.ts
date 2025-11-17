import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validações
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verificar se o usuário está ativo
    if (!user.active) {
      return NextResponse.json(
        { message: 'Conta desativada. Entre em contato com o suporte.' },
        { status: 403 }
      )
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Gerar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Redirecionar baseado no role após login
    let redirectPath = '/dashboard'
    if (user.role === 'ADMIN') {
      redirectPath = '/admin'
    } else if (user.role === 'BOOSTER') {
      redirectPath = '/booster'
    }

    return NextResponse.json(
      {
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        redirectPath,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return NextResponse.json(
      { message: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}

