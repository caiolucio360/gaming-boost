import { NextResponse } from 'next/server'

export async function POST() {
  // O logout no backend apenas confirma a ação
  // O token será removido do localStorage no frontend
  return NextResponse.json(
    { message: 'Logout realizado com sucesso' },
    { status: 200 }
  )
}

