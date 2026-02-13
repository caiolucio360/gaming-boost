import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/services'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function DELETE(request: NextRequest) {
    try {
        // 1. Verify session using NextAuth
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const userId = Number(session.user.id)

        // 2. Call Service to delete user
        const result = await AuthService.deleteUser(userId)

        if (!result.success) {
            // Map specific errors to status codes
            const status = result.code === 'USER_HAS_ACTIVE_ORDERS' ? 400 : 500

            return NextResponse.json(
                { message: result.error, code: result.code },
                { status }
            )
        }

        return NextResponse.json(
            { message: 'Conta excluída com sucesso' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Erro ao excluir conta:', error)
        return NextResponse.json(
            { message: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
