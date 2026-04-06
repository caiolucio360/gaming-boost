import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifyBooster, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createApiErrorResponse } from '@/lib/api-errors'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult.error || 'Não autenticado', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Formato inválido. Use JPG, PNG ou WebP.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'Arquivo muito grande. Tamanho máximo: 5 MB.' },
        { status: 400 }
      )
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[UPLOAD] BLOB_READ_WRITE_TOKEN not configured')
      return NextResponse.json(
        { message: 'Serviço de upload não configurado. Contate o suporte.' },
        { status: 503 }
      )
    }

    const filename = `completion-proofs/${authResult.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const blob = await put(filename, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url }, { status: 200 })
  } catch (error) {
    return createApiErrorResponse(error, 'Erro ao fazer upload do arquivo', 'POST /api/upload/completion-proof')
  }
}
