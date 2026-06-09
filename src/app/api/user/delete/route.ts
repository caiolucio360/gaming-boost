import { NextResponse } from 'next/server'
import { AuthService } from '@/services'
import { withApiHandler } from '@/lib/api-handler'
import { getStatusForError } from '@/lib/error-constants'
import { HttpStatus } from '@/lib/http-status'

export const DELETE = withApiHandler(
  async ({ user }) => {
    const result = await AuthService.deleteUser(user.id)

    if (!result.success) {
      const status = result.code ? getStatusForError(result.code) : HttpStatus.INTERNAL_SERVER_ERROR
      return NextResponse.json({ message: result.error, code: result.code }, { status })
    }

    return NextResponse.json({ message: 'Conta excluída com sucesso' }, { status: HttpStatus.OK })
  },
  { auth: true, errorMessage: 'Erro interno do servidor', endpoint: 'DELETE /api/user/delete' }
)
