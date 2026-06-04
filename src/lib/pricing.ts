/**
 * Sistema de cálculo de preços baseado em configurações do banco de dados
 * Permite que admins configurem preços dinamicamente por faixa e tipo de serviço
 */

import { db } from '@/lib/db'
import { Game, PricingConfig, ServiceType } from '@/generated/prisma/client'

export type GameMode = 'PREMIER'

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
export async function getPricingRanges(
  game: Game,
  gameMode: GameMode,
  serviceType: ServiceType = 'RANK_BOOST'
): Promise<PricingRange[]> {
  try {
    console.log(`[PRICING] Fetching pricing config for ${game} ${gameMode} ${serviceType}...`)
    const startTime = Date.now()

    const configs = await db.pricingConfig.findMany({
      where: {
        game,
        gameMode,
        serviceType,
        enabled: true
      },
      orderBy: {
        rangeStart: 'asc'
      }
    })

    console.log(`[PRICING] Query completed in ${Date.now() - startTime}ms, found ${configs.length} ranges`)

    if (configs.length === 0) {
      console.error(`⚠️  No pricing configuration found for ${game} ${gameMode} ${serviceType}`)
      console.error(`   Admin must configure pricing at /admin/pricing`)
      console.error(`   Run 'npm run db:seed' to populate default pricing`)
      throw new Error(`Pricing not configured for ${game} ${gameMode} ${serviceType}. Please contact support.`)
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
export async function calculatePremierPrice(
  current: number,
  target: number,
  serviceType: ServiceType = 'RANK_BOOST'
): Promise<number> {
  if (current >= target) {
    return 0
  }

  const ranges = await getPricingRanges('CS2', 'PREMIER', serviceType)

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
    // Prioridade 1: Faixa onde estamos DENTRO (agora inclusivo no final)
    let currentRange = ranges.find(
      r => currentRating >= r.rangeStart && currentRating <= r.rangeEnd
    )

    // Prioridade 2: Faixa que COMEÇA exatamente onde estamos (caso redundancy)
    if (!currentRange) {
      currentRange = ranges.find(r => r.rangeStart === currentRating)
    }

    // Prioridade 3: Próxima faixa disponível (para gaps)
    if (!currentRange) {
      currentRange = ranges.find(r => r.rangeStart > currentRating)
      if (currentRange) {
        // Pular para o início da próxima faixa (gap nos ranges)
        const gapSize = currentRange.rangeStart - currentRating
        console.warn(`[PRICING] Detected gap of ${gapSize} points. Jumping from ${currentRating} to ${currentRange.rangeStart}`)
        currentRating = currentRange.rangeStart
      }
    }

    if (!currentRange) {
      throw new Error(`No pricing range found for rating ${currentRating}`)
    }

    // Determinar quantos pontos processar nesta faixa
    // Nota: rangeEnd é inclusivo (ex: 4999), então o limite é rangeEnd + 1 (5000)
    const rangeLimit = currentRange.rangeEnd + 1
    const endPoint = Math.min(target, rangeLimit)
    const pointsToProcess = endPoint - currentRating

    // Garantir que sempre avançamos (evitar loop infinito)
    if (pointsToProcess <= 0) {
      if (currentRating >= target) break

      console.error(`[PRICING] Zero points to process: currentRating=${currentRating}, rangeLimit=${rangeLimit}, range=${JSON.stringify(currentRange)}`)
      throw new Error('Erro no cálculo de preço: configuração de faixas inválida.')
    }

    // Calcular preço proporcional para esses pontos (preço base é por 1000 pontos)
    const thousands = pointsToProcess / 1000
    total += thousands * currentRange.price

    // Avançar para a próxima faixa
    currentRating += pointsToProcess
  }

  return total
}


/**
 * Calcula o preço total para Coaching (baseado em horas com desconto progressivo)
 * target = número de horas
 */
async function calculateCoachingPrice(hours: number, ranges: PricingRange[]): Promise<number> {
  if (ranges.length === 0) throw new Error('Nenhuma configuração de coaching encontrada')

  // Encontra a faixa de preço que cobre a quantidade total de horas
  let applicableRange = ranges.find(r => hours >= r.rangeStart && hours <= r.rangeEnd)
  
  if (!applicableRange) {
    // Se o cliente escolheu mais horas do que o limite máximo configurado, aplica o preço da última faixa
    const maxRange = [...ranges].sort((a, b) => b.rangeEnd - a.rangeEnd)[0]
    if (hours > maxRange.rangeEnd) {
       applicableRange = maxRange
    } else {
       throw new Error(`Nenhuma configuração de coaching encontrada para ${hours} horas`)
    }
  }

  // Lógica de volume: multiplica TODAS as horas pelo preço da faixa em que o total se encontra
  return hours * applicableRange.price
}

/**
 * Calcula o preço baseado no modo de jogo
 */
export async function calculatePrice(
  game: Game,
  gameMode: GameMode,
  current: number,
  target: number,
  serviceType: ServiceType = 'RANK_BOOST'
): Promise<number> {
  if (serviceType === 'COACHING') {
    const ranges = await getPricingRanges(game, gameMode, serviceType)
    return calculateCoachingPrice(target, ranges) // target = hours
  }

  switch (gameMode) {
    case 'PREMIER':
      return calculatePremierPrice(current, target, serviceType)
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
  target: number,
  serviceType: ServiceType = 'RANK_BOOST'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const ranges = await getPricingRanges(game, gameMode, serviceType)

    if (ranges.length === 0) {
      return {
        valid: false,
        error: 'No pricing configuration available for this game mode'
      }
    }

    // Para COACHING, verificar se existe pelo menos uma configuração cobrindo alguma hora
    // Deixamos o motor calcular progressivamente. Validamos apenas se há configs que alcançam a hora solicitada
    if (serviceType === 'COACHING') {
      const hours = current // current é reutilizado como horas no contexto de coaching
      const maxConfigured = Math.max(...ranges.map(r => r.rangeEnd))
      const minConfigured = Math.min(...ranges.map(r => r.rangeStart))
      if (hours < minConfigured) {
        return {
          valid: false,
          error: `Mínimo permitido é ${minConfigured} horas`
        }
      }
      if (hours > maxConfigured) {
         return {
           valid: false,
           error: `Máximo permitido é ${maxConfigured} horas`
         }
      }
      return { valid: true }
    }

    if (gameMode === 'PREMIER') {
      const minConfigured = ranges[0].rangeStart;
      const maxConfigured = ranges[ranges.length - 1].rangeEnd;
      
      if (current < minConfigured || target > maxConfigured) {
        return {
          valid: false,
          error: `Faixa de pontuação fora dos limites. Mínimo: ${minConfigured}, Máximo: ${maxConfigured}`
        }
      }

      // Para Premier, verificar se há cobertura completa do range
      // Checando pontos-chave para garantir que não existam gaps grandes não cobertos.
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
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
