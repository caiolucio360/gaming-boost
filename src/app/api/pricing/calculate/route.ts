import { NextRequest } from 'next/server'
import { calculatePrice, validatePricingRange } from '@/lib/pricing'
import { Game } from '@/generated/prisma/client'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'

/**
 * POST /api/pricing/calculate
 * Calcula o preço de um boost baseado nas configurações do banco de dados
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[API /pricing/calculate] Request received')

  try {
    const body = await request.json()
    const { game, gameMode, current, target } = body
    console.log(`[API /pricing/calculate] Params: game=${game}, mode=${gameMode}, current=${current}, target=${target}`)

    // Validações
    if (!game || !gameMode || current === undefined || target === undefined) {
      return Response.json({ error: 'Campos obrigatórios ausentes: jogo, modo, pontuação atual e desejada' }, { status: 400 })
    }

    const currentValue = parseInt(current)
    const targetValue = parseInt(target)

    if (isNaN(currentValue) || isNaN(targetValue)) {
      return Response.json({ error: 'Valores de pontuação atual ou desejada são inválidos' }, { status: 400 })
    }

    if (currentValue >= targetValue) {
      return Response.json({ error: 'A pontuação atual deve ser menor que a pontuação desejada' }, { status: 400 })
    }

    // Validar se existe configuração para o range
    console.log('[API /pricing/calculate] Starting validation...')
    const validation = await validatePricingRange(
      game as Game,
      gameMode,
      currentValue,
      targetValue
    )
    console.log(`[API /pricing/calculate] Validation completed: ${JSON.stringify(validation)}`)

    if (!validation.valid) {
      return Response.json({
        error: validation.error || 'Faixa de pontuação inválida ou não configurada'
      }, { status: 400 })
    }

    // Calcular preço
    console.log('[API /pricing/calculate] Starting price calculation...')
    const price = await calculatePrice(
      game as Game,
      gameMode,
      currentValue,
      targetValue
    )
    console.log(`[API /pricing/calculate] Price calculated: ${price} in ${Date.now() - startTime}ms`)

    return Response.json({
      data: {
        price,
        current: currentValue,
        target: targetValue,
        game,
        gameMode
      }
    }, { status: 200 })
  } catch (error) {
    console.error(`[API /pricing/calculate] Error after ${Date.now() - startTime}ms:`, error)
    return createApiErrorResponse(error, ErrorMessages.PRICING_CALCULATE_FAILED, 'POST /api/pricing/calculate')
  }
}
