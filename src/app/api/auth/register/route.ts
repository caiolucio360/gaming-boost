import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/jwt'
import { RegisterSchema } from '@/schemas/auth'
import { validateBody } from '@/lib/validate'
import { AuthService } from '@/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with Zod schema
    const validation = validateBody(RegisterSchema, body)

    if (!validation.success) {
      const errors = validation.errors
      const hasEmailError = errors.some(e => e.field === 'email')
      const hasPasswordError = errors.some(e => e.field === 'password')

      if (!body.email || !body.password) {
        return NextResponse.json(
          { message: 'Email e senha são obrigatórios' },
          { status: 400 }
        )
      }

      if (hasPasswordError) {
        return NextResponse.json(
          { message: 'A senha deve ter pelo menos 6 caracteres' },
          { status: 400 }
        )
      }

      if (hasEmailError) {
        return NextResponse.json(
          { message: 'Email inválido' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: 'Dados inválidos', errors },
        { status: 400 }
      )
    }

    // Use AuthService for business logic
    const result = await AuthService.registerUser(validation.data)

    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: 400 }
      )
    }

    const { user } = result

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'CLIENT' | 'BOOSTER' | 'ADMIN',
    })

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso',
        token,
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
