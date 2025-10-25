'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function Calculator() {
  const [game, setGame] = useState('')
  const [currentRank, setCurrentRank] = useState('')
  const [targetRank, setTargetRank] = useState('')
  const [price, setPrice] = useState(0)

  const games = [
    { value: 'cs2', label: 'Counter-Strike 2 (Premier)' },
    { value: 'gamersclub', label: 'Gamers Club' },
    { value: 'lol', label: 'League of Legends' },
    { value: 'valorant', label: 'Valorant' }
  ]

  const cs2Ranks = [
    // CS2 Premier Mode (CS Rating)
    '0 - 4.999 (Cinza)', '5.000 - 9.999 (Azul Claro)', '10.000 - 14.999 (Azul)',
    '15.000 - 19.999 (Roxo)', '20.000 - 24.999 (Rosa)', '25.000 - 29.999 (Vermelho)', '30.000+ (Dourado)'
  ]

  const gamersClubRanks = [
    // Gamers Club Levels
    'Nível 1', 'Nível 2', 'Nível 3', 'Nível 4', 'Nível 5',
    'Nível 6', 'Nível 7', 'Nível 8', 'Nível 9', 'Nível 10',
    'Nível 11', 'Nível 12', 'Nível 13', 'Nível 14', 'Nível 15',
    'Nível 16', 'Nível 17', 'Nível 18', 'Nível 19', 'Nível 20'
  ]

  const lolRanks = [
    'Iron IV', 'Iron III', 'Iron II', 'Iron I',
    'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
    'Silver IV', 'Silver III', 'Silver II', 'Silver I',
    'Gold IV', 'Gold III', 'Gold II', 'Gold I',
    'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I',
    'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I',
    'Master', 'Grandmaster', 'Challenger'
  ]

  const valorantRanks = [
    'Iron 1', 'Iron 2', 'Iron 3',
    'Bronze 1', 'Bronze 2', 'Bronze 3',
    'Silver 1', 'Silver 2', 'Silver 3',
    'Gold 1', 'Gold 2', 'Gold 3',
    'Platinum 1', 'Platinum 2', 'Platinum 3',
    'Diamond 1', 'Diamond 2', 'Diamond 3',
    'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
    'Immortal 1', 'Immortal 2', 'Immortal 3',
    'Radiant'
  ]

  const getRanks = () => {
    switch (game) {
      case 'cs2': return cs2Ranks
      case 'gamersclub': return gamersClubRanks
      case 'lol': return lolRanks
      case 'valorant': return valorantRanks
      default: return []
    }
  }

  const calculatePrice = () => {
    if (!game || !currentRank || !targetRank) return

    const ranks = getRanks()
    const currentIndex = ranks.indexOf(currentRank)
    const targetIndex = ranks.indexOf(targetRank)

    if (currentIndex === -1 || targetIndex === -1 || currentIndex >= targetIndex) {
      setPrice(0)
      return
    }

    const rankDifference = targetIndex - currentIndex
    let basePrice = 0

    switch (game) {
      case 'cs2':
        // CS2 Premier Mode (CS Rating) - preços mais altos
        basePrice = rankDifference * 30
        break
      case 'gamersclub':
        // Gamers Club - preços intermediários
        basePrice = rankDifference * 22
        break
      case 'lol':
        basePrice = rankDifference * 20
        break
      case 'valorant':
        basePrice = rankDifference * 18
        break
    }

    setPrice(basePrice)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-white font-orbitron mb-4 text-center" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
          <span className="text-purple-300">CALCULADORA</span>
          <span className="text-white"> DE PREÇOS</span>
        </h2>
        
        {game === 'cs2' && (
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold text-purple-300 font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
              CS2 Premier Mode:
            </h3>
            <div className="text-sm text-gray-300 font-rajdhani space-y-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
              <p><span className="text-purple-300">• Sistema CS Rating:</span> Pontuações de 0 a 30.000+</p>
              <p><span className="text-purple-300">• Faixas de Cores:</span> Cinza → Azul Claro → Azul → Roxo → Rosa → Vermelho → Dourado</p>
            </div>
          </div>
        )}

        {game === 'gamersclub' && (
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold text-purple-300 font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
              Gamers Club:
            </h3>
            <div className="text-sm text-gray-300 font-rajdhani space-y-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
              <p><span className="text-purple-300">• Sistema de Níveis:</span> 20 níveis de progressão</p>
              <p><span className="text-purple-300">• Plataforma:</span> Matchmaking competitivo para América Latina</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-white font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                Jogo
              </label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="w-full p-3 bg-black/50 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="">Selecione um jogo</option>
                {games.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                Rank Atual
              </label>
              <select
                value={currentRank}
                onChange={(e) => setCurrentRank(e.target.value)}
                className="w-full p-3 bg-black/50 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="">Selecione seu rank atual</option>
                {getRanks().map((rank) => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                Rank Desejado
              </label>
              <select
                value={targetRank}
                onChange={(e) => setTargetRank(e.target.value)}
                className="w-full p-3 bg-black/50 border border-purple-500/50 rounded-lg text-white focus:border-purple-400 focus:outline-none"
              >
                <option value="">Selecione o rank desejado</option>
                {getRanks().map((rank) => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={calculatePrice}
              className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
            >
              CALCULAR PREÇO
            </Button>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/50 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
              <span className="text-purple-300">PREÇO</span>
              <span className="text-white"> ESTIMADO</span>
            </h3>
            
            {price > 0 ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-300 font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
                  R$ {price.toFixed(2)}
                </div>
                <p className="text-gray-300 font-rajdhani mb-4" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  {currentRank} → {targetRank}
                </p>
                <Button className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30">
                  CONTRATAR AGORA
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                Selecione o jogo e os ranks para calcular o preço
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
