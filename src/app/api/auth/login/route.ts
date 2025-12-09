import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/jwt'
import { LoginSchema } from '@/schemas/auth'
import { validateBody } from '@/lib/validate'
import { AuthService } from '@/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with Zod schema
    const validation = validateBody(LoginSchema, body)

    if (!validation.success) {
      if (!body.email || !body.password) {
        return NextResponse.json(
          { message: 'Email e senha são obrigatórios' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: 'Dados inválidos', errors: validation.errors },
        { status: 400 }
      )
    }

    // Use AuthService for credential validation
    const result = await AuthService.validateCredentials(validation.data)

    if (!result.success) {
      return NextResponse.json(
        { message: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    const { user } = result

    // Check if user is active
    if (!user.active) {
      return NextResponse.json(
        { message: 'Conta desativada. Entre em contato com o suporte.' },
        { status: 403 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'CLIENT' | 'BOOSTER' | 'ADMIN',
    })

    // Calculate redirect path based on role
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
