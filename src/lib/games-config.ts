/**
 * Configuração de jogos suportados pela plataforma
 * Esta estrutura permite adicionar novos jogos facilmente
 */

export type GameId = 'CS2' // Adicione novos jogos aqui conforme necessário

export type ServiceType = 'RANK_BOOST' | 'PLACEMENT' | 'COACHING' | 'ACCOUNT_LEVELING' // Tipos de serviços disponíveis

export type GameMode = 'PREMIER' | 'GAMERS_CLUB'

export interface GameModeConfig {
  id: GameMode
  name: string
  displayName: string
  description: string
  pricingRules: {
    basePrice: number
    unit: string
    calculation: (current: number, target: number) => number
  }
  // Configurações específicas do modo
  ratingPoints?: number[] // Pontos de rating disponíveis
  ranks?: Array<{
    id: string
    name: string
    minPoints?: number
    maxPoints?: number
  }>
}

export interface GameConfig {
  id: GameId
  name: string
  displayName: string
  description: string
  icon?: string
  href: string
  enabled: boolean
  supportedServiceTypes: ServiceType[]
  modes?: Record<GameMode, GameModeConfig> // Modos de jogo suportados
  // Manter para compatibilidade com jogos que não têm modos
  pricingRules?: {
    basePrice?: number
    unit?: string
    calculation?: (current: number, target: number) => number
  }
}

export const GAMES_CONFIG: Partial<Record<GameId, GameConfig>> = {
  CS2: {
    id: 'CS2',
    name: 'Counter-Strike 2',
    displayName: 'CS2',
    description: 'Boost de rank Premier do CS2',
    href: '/games/cs2',
    enabled: true,
    supportedServiceTypes: ['RANK_BOOST'],
    modes: {
      PREMIER: {
        id: 'PREMIER',
        name: 'Premier',
        displayName: 'Premier',
        description: 'Sistema de rating Premier do CS2',
        pricingRules: {
          basePrice: 25,
          unit: '1000 pontos',
          calculation: (current: number, target: number) => {
            // Preços progressivos por faixa (mercado brasileiro)
            // Baseado em pesquisa de concorrentes: DFGames, Desapego Games
            const getPricePer1000 = (rating: number): number => {
              if (rating < 5000) return 25 // 1K-4.999: R$ 25/1000
              if (rating < 10000) return 35 // 5K-9.999: R$ 35/1000
              if (rating < 15000) return 45 // 10K-14.999: R$ 45/1000
              if (rating < 20000) return 50 // 15K-19.999: R$ 50/1000
              if (rating < 25000) return 60 // 20K-24.999: R$ 60/1000
              return 90 // 25K-26K: R$ 90/1000
            }

            let total = 0
            let currentRating = current

            // Calcular por faixas progressivas, do current para o target
            while (currentRating < target) {
              const pricePer1000 = getPricePer1000(currentRating)

              // Determinar o próximo limite de faixa
              const nextThreshold =
                currentRating < 5000 ? 5000 :
                  currentRating < 10000 ? 10000 :
                    currentRating < 15000 ? 15000 :
                      currentRating < 20000 ? 20000 :
                        currentRating < 25000 ? 25000 :
                          Infinity

              // Calcular quantos pontos podemos processar nesta faixa
              const maxPointsInRange = Math.min(target, nextThreshold) - currentRating
              const pointsToProcess = Math.min(maxPointsInRange, target - currentRating)

              // Calcular preço para esses pontos
              const thousands = Math.ceil(pointsToProcess / 1000)
              total += thousands * pricePer1000

              // Avançar para a próxima faixa
              currentRating += pointsToProcess
            }

            return total
          },
        },
        ratingPoints: [
          1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
          11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000,
          21000, 22000, 23000, 24000, 25000, 26000
        ],
      },
      GAMERS_CLUB: {
        id: 'GAMERS_CLUB',
        name: 'Gamers Club',
        displayName: 'Gamers Club',
        description: 'Sistema de ranqueamento do Gamers Club',
        pricingRules: {
          basePrice: 20,
          unit: '1 nível',
          calculation: (current: number, target: number) => {
            // Preços progressivos por faixa (mercado brasileiro)
            // Baseado em pesquisa de concorrentes: DFGames
            const getPricePerLevel = (level: number): number => {
              if (level <= 10) return 20 // Level 1-10: R$ 20/nível
              if (level <= 14) return 40 // Level 11-14: R$ 40/nível
              if (level <= 17) return 50 // Level 15-17: R$ 50/nível
              if (level <= 19) return 70 // Level 18-19: R$ 70/nível
              return 120 // Level 20: R$ 120/nível
            }

            let total = 0
            for (let level = current + 1; level <= target; level++) {
              total += getPricePerLevel(level)
            }

            return total
          },
        },
        ranks: [
          { id: 'iniciante', name: 'Iniciante', minPoints: 1, maxPoints: 3 },
          { id: 'amador', name: 'Amador', minPoints: 4, maxPoints: 7 },
          { id: 'avançado', name: 'Avançado', minPoints: 8, maxPoints: 11 },
          { id: 'expert', name: 'Expert', minPoints: 12, maxPoints: 15 },
          { id: 'master', name: 'Master', minPoints: 16, maxPoints: 19 },
          { id: 'supremo', name: 'Supremo', minPoints: 20, maxPoints: 20 },
        ],
        ratingPoints: Array.from({ length: 20 }, (_, i) => i + 1), // Níveis de 1 a 20
      },
    },
  },
}

/**
 * Retorna apenas os jogos habilitados
 */
export function getEnabledGames(): GameConfig[] {
  return Object.values(GAMES_CONFIG).filter((game) => game.enabled)
}

/**
 * Retorna a configuração de um jogo específico
 */
export function getGameConfig(gameId: GameId): GameConfig | undefined {
  return GAMES_CONFIG[gameId] as GameConfig | undefined
}

/**
 * Verifica se um jogo está habilitado
 */
export function isGameEnabled(gameId: GameId): boolean {
  return GAMES_CONFIG[gameId]?.enabled ?? false
}

/**
 * Verifica se um tipo de serviço é suportado por um jogo
 */
export function isServiceTypeSupported(gameId: GameId, serviceType: ServiceType): boolean {
  return GAMES_CONFIG[gameId]?.supportedServiceTypes.includes(serviceType) ?? false
}

