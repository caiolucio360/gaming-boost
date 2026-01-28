/**
 * Sistema de cálculo de preços baseado em configurações do banco de dados
 * Permite que admins configurem preços dinamicamente por faixa
 */

import { db } from '@/lib/db'
import { Game, PricingConfig } from '@/generated/prisma/client'

export type GameMode = 'PREMIER' | 'GAMERS_CLUB'

interface PricingRange {
  id: number
  rangeStart: number
  rangeEnd: number
  price: number
  unit: string
}

/**
 * Busca as configurações de preço do banco de dados
 */
export async function getPricingRanges(game: Game, gameMode: GameMode): Promise<PricingRange[]> {
  try {
    console.log(`[PRICING] Fetching pricing config for ${game} ${gameMode}...`)
    const startTime = Date.now()

    const configs = await db.pricingConfig.findMany({
      where: {
        game,
        gameMode,
        enabled: true
      },
      orderBy: {
        rangeStart: 'asc'
      }
    })

    console.log(`[PRICING] Query completed in ${Date.now() - startTime}ms, found ${configs.length} ranges`)

    if (configs.length === 0) {
      console.error(`⚠️  No pricing configuration found for ${game} ${gameMode}`)
      console.error(`   Admin must configure pricing at /admin/pricing`)
      console.error(`   Run 'npm run db:seed' to populate default pricing`)
      throw new Error(`Pricing not configured for ${game} ${gameMode}. Please contact support.`)
    }

    return configs.map((config: PricingConfig) => ({
      id: config.id,
      rangeStart: config.rangeStart,
      rangeEnd: config.rangeEnd,
      price: config.price,
      unit: config.unit
    }))
  } catch (error) {
    console.error(`[PRICING] Error fetching pricing config:`, error)
    // Re-throw the error with context
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch pricing configuration')
  }
}

/**
 * Calcula o preço total para Premier (baseado em pontos)
 * Exemplo: De 10.000 para 15.000 pontos
 */
export async function calculatePremierPrice(current: number, target: number): Promise<number> {
  if (current >= target) {
    return 0
  }

  const ranges = await getPricingRanges('CS2', 'PREMIER')

  if (ranges.length === 0) {
    throw new Error('No pricing configuration found for CS2 Premier')
  }

  let total = 0
  let currentRating = current

  // Safety guard contra loops infinitos
  const MAX_ITERATIONS = 1000
  let iterations = 0

  // Calcular por faixas progressivas
  while (currentRating < target) {
    iterations++
    if (iterations > MAX_ITERATIONS) {
      console.error(`[PRICING] Infinite loop detected: current=${current}, target=${target}, currentRating=${currentRating}`)
      throw new Error('Erro no cálculo de preço. Por favor, tente novamente.')
    }

    // Encontrar a faixa atual
    // Prioridade 1: Faixa onde estamos DENTRO (não no fim)
    let currentRange = ranges.find(
      r => currentRating >= r.rangeStart && currentRating < r.rangeEnd
    )

    // Prioridade 2: Faixa que COMEÇA exatamente onde estamos
    if (!currentRange) {
      currentRange = ranges.find(r => r.rangeStart === currentRating)
    }

    // Prioridade 3: Próxima faixa disponível (para gaps)
    if (!currentRange) {
      currentRange = ranges.find(r => r.rangeStart > currentRating)
      if (currentRange) {
        // Pular para o início da próxima faixa (gap nos ranges)
        currentRating = currentRange.rangeStart
      }
    }

    if (!currentRange) {
      throw new Error(`No pricing range found for rating ${currentRating}`)
    }

    // Determinar quantos pontos processar nesta faixa
    const rangeEnd = Math.min(target, currentRange.rangeEnd)
    const pointsToProcess = rangeEnd - currentRating

    // Garantir que sempre avançamos (evitar loop infinito)
    if (pointsToProcess <= 0) {
      console.error(`[PRICING] Zero points to process: currentRating=${currentRating}, rangeEnd=${rangeEnd}, range=${JSON.stringify(currentRange)}`)
      throw new Error('Erro no cálculo de preço: configuração de faixas inválida.')
    }

    // Calcular preço para esses pontos (preço é por 1000 pontos)
    const thousands = Math.ceil(pointsToProcess / 1000)
    total += thousands * currentRange.price

    // Avançar para a próxima faixa
    currentRating += pointsToProcess
  }

  return total
}

/**
 * Calcula o preço total para Gamers Club (baseado em níveis)
 * Exemplo: Do nível 5 para o nível 10
 */
export async function calculateGamersClubPrice(current: number, target: number): Promise<number> {
  if (current >= target) {
    return 0
  }

  const ranges = await getPricingRanges('CS2', 'GAMERS_CLUB')

  if (ranges.length === 0) {
    throw new Error('No pricing configuration found for CS2 Gamers Club')
  }

  let total = 0

  // Calcular preço por nível
  for (let level = current + 1; level <= target; level++) {
    // Encontrar a faixa que contém este nível
    const range = ranges.find(
      r => level >= r.rangeStart && level <= r.rangeEnd
    )

    if (!range) {
      throw new Error(`No pricing range found for level ${level}`)
    }

    total += range.price
  }

  return total
}

/**
 * Calcula o preço baseado no modo de jogo
 */
export async function calculatePrice(
  game: Game,
  gameMode: GameMode,
  current: number,
  target: number
): Promise<number> {
  switch (gameMode) {
    case 'PREMIER':
      return calculatePremierPrice(current, target)
    case 'GAMERS_CLUB':
      return calculateGamersClubPrice(current, target)
    default:
      throw new Error(`Unsupported game mode: ${gameMode}`)
  }
}

/**
 * Valida se existe configuração de preço para o range solicitado
 */
export async function validatePricingRange(
  game: Game,
  gameMode: GameMode,
  current: number,
  target: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const ranges = await getPricingRanges(game, gameMode)

    if (ranges.length === 0) {
      return {
        valid: false,
        error: 'No pricing configuration available for this game mode'
      }
    }

    // Verificar se todos os valores entre current e target têm configuração
    if (gameMode === 'PREMIER') {
      // Para Premier, verificar se há cobertura completa do range
      for (let rating = current; rating < target; rating += 1000) {
        const hasRange = ranges.some(
          r => rating >= r.rangeStart && rating <= r.rangeEnd
        )
        if (!hasRange) {
          return {
            valid: false,
            error: `No pricing configured for rating ${rating}`
          }
        }
      }
    } else if (gameMode === 'GAMERS_CLUB') {
      // Para GC, verificar se há preço para cada nível
      for (let level = current + 1; level <= target; level++) {
        const hasRange = ranges.some(
          r => level >= r.rangeStart && level <= r.rangeEnd
        )
        if (!hasRange) {
          return {
            valid: false,
            error: `No pricing configured for level ${level}`
          }
        }
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
