/**
 * Configuração de jogos suportados pela plataforma
 * Esta estrutura permite adicionar novos jogos facilmente
 */

export type GameId = 'CS2' | 'LOL' | 'VALORANT' // Adicione novos jogos aqui conforme necessário

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
          basePrice: 50,
          unit: '1000 pontos',
          calculation: (current: number, target: number) => {
            const difference = target - current
            return Math.ceil(difference / 1000) * 50
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
          basePrice: 45,
          unit: '1 nível',
          calculation: (current: number, target: number) => {
            const difference = target - current
            return difference * 45 // R$ 45 por nível
          },
        },
        ranks: [
          { id: 'iniciante', name: 'Iniciante', minPoints: 1, maxPoints: 3 },
          { id: 'amador', name: 'Amador', minPoints: 4, maxPoints: 7 },
          { id: 'avançado', name: 'Avançado', minPoints: 8, maxPoints: 11 },
          { id: 'expert', name: 'Expert', minPoints: 12, maxPoints: 15 },
          { id: 'master', name: 'Master', minPoints: 16, maxPoints: 19 },
          { id: 'supremo', name: 'Supremo', minPoints: 20, maxPoints: 23 },
          { id: 'lendário', name: 'Lendário', minPoints: 24, maxPoints: 27 },
        ],
        ratingPoints: Array.from({ length: 27 }, (_, i) => i + 1), // Níveis de 1 a 27
      },
    },
  },
  // Jogos futuros podem ser adicionados aqui
  // LOL: {
  //   id: 'LOL',
  //   name: 'League of Legends',
  //   displayName: 'LoL',
  //   description: 'Boost de rank no League of Legends',
  //   href: '/games/lol',
  //   enabled: false,
  //   supportedServiceTypes: ['RANK_BOOST', 'PLACEMENT'],
  // },
  // VALORANT: {
  //   id: 'VALORANT',
  //   name: 'Valorant',
  //   displayName: 'Valorant',
  //   description: 'Boost de rank no Valorant',
  //   href: '/games/valorant',
  //   enabled: false,
  //   supportedServiceTypes: ['RANK_BOOST', 'PLACEMENT'],
  // },
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

