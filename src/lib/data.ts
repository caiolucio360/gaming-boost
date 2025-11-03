import { GameRank } from '@/types'
import { GameId } from './games-config'

export const cs2Ranks: GameRank[] = [
  { id: '1', name: 'Silver I', image: '/ranks/cs2/silver1.png', gameId: 'CS2' },
  { id: '2', name: 'Silver II', image: '/ranks/cs2/silver2.png', gameId: 'CS2' },
  { id: '3', name: 'Silver Elite', image: '/ranks/cs2/silverelite.png', gameId: 'CS2' },
  { id: '4', name: 'Gold Nova I', image: '/ranks/cs2/goldnova1.png', gameId: 'CS2' },
  { id: '5', name: 'Gold Nova II', image: '/ranks/cs2/goldnova2.png', gameId: 'CS2' },
  { id: '6', name: 'Gold Nova Master', image: '/ranks/cs2/goldnovamaster.png', gameId: 'CS2' },
  { id: '7', name: 'Master Guardian I', image: '/ranks/cs2/mg1.png', gameId: 'CS2' },
  { id: '8', name: 'Master Guardian II', image: '/ranks/cs2/mg2.png', gameId: 'CS2' },
  { id: '9', name: 'Distinguished Master Guardian', image: '/ranks/cs2/dmg.png', gameId: 'CS2' },
  { id: '10', name: 'Legendary Eagle', image: '/ranks/cs2/le.png', gameId: 'CS2' },
  { id: '11', name: 'Supreme Master First Class', image: '/ranks/cs2/smfc.png', gameId: 'CS2' },
  { id: '12', name: 'The Global Elite', image: '/ranks/cs2/global.png', gameId: 'CS2' },
]

/**
 * Mapa de ranks por jogo
 * Adicione novos jogos aqui conforme necessário
 */
export const gameRanks: Partial<Record<GameId, GameRank[]>> = {
  CS2: cs2Ranks,
  // Adicione outros jogos aqui
  // LOL: lolRanks,
  // VALORANT: valorantRanks,
}

/**
 * Retorna os ranks de um jogo específico
 */
export function getRanksForGame(gameId: GameId): GameRank[] {
  return gameRanks[gameId] || []
}